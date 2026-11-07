<#
.SYNOPSIS
  Fuellt ein mit CurseForge "Clone as..." geklontes Profil fuer einen Minecraft-Versionstest
  mit den bisherigen Mods, statt mit den Versionen, die der Klon automatisch anhebt.

.DESCRIPTION
  CurseForge kann die Minecraft-Version eines Profils nicht aendern. "Clone as..." legt ein
  neues Profil mit anderer Version an, hebt dabei aber CurseForge-Mods auf neuere Versionen,
  nimmt eigene Jars nicht mit und laesst die Config leer. Fuer einen sauberen Test soll sich
  nur die Minecraft-Version aendern. Das Skript:
    1. legt die Mods des Klons nach <Ziel>\_klon-mods-beiseite, ausser denen aus -Behalten
       (typisch: Bibliotheken, die es fuer die neue Version braucht, etwa Fabric API),
    2. kopiert alle Jars aus dem Quell-Profil, ausser solchen mit derselben Mod-ID wie ein
       behaltener Jar,
    3. setzt in kopierten Jars, die "minecraft" genau auf die alte Version festlegen, den Wert
       auf ">=<alt> <=<neu>" (nur in der Kopie, das Quell-Profil bleibt unveraendert),
    4. kopiert die Ordner und Dateien aus -Ordner und -Dateien und optional eine Welt.
  Ohne -Ausfuehren ist es ein Probelauf, der nur anzeigt, was passieren wuerde.
  Die alte und neue Minecraft-Version liest es aus minecraftinstance.json der beiden Profile.

  Grenzen: Angepasst werden nur Jars mit genau festgelegter Version (Fabric, fabric.mod.json).
  Ob eine Mod danach auf der neuen Version laeuft, zeigt erst der Start (Log pruefen).
  Danach in CurseForge NICHT "Repair" oder "Update" druecken, sonst kommen die Klon-Versionen
  zurueck.

.NOTES
  Ablauf Schritt fuer Schritt:
    1. Minecraft schliessen.
    2. In der CurseForge-App: Rechtsklick auf das bisherige Profil -> "Clone as..." ->
       neue Minecraft-Version waehlen -> "Create". Das neue Profil heisst z. B. "MeinPack (1)".
       In dessen "Profile Options" die Fabric-Loader-Version pruefen.
    3. Falls die neue Version zusaetzliche Bibliotheken in neuer Fassung braucht: im Klon
       ueber "Add More Content" hinzufuegen und mit -Behalten angeben.
    4. PowerShell oeffnen, in den Ordner mit diesem Skript wechseln, erst den Probelauf
       starten (ohne -Ausfuehren) und die Ausgabe lesen.
    5. Denselben Befehl mit -Ausfuehren wiederholen.
    6. Das Klon-Profil starten. Im Ordner logs die Datei latest.log nach "ERROR",
       "Mixin apply failed" und "Could not find required mod" durchsuchen.
    7. Nichts loeschen: Die Klon-Mods liegen in <Ziel>\_klon-mods-beiseite, das alte Profil
       bleibt unveraendert.
  Falls Windows das Skript blockiert ("Ausfuehrung von Skripts ist deaktiviert"):
    powershell -ExecutionPolicy Bypass -File .\versionstest-profil.ps1 -Quelle ... -Ziel ...
  Hilfe anzeigen: Get-Help .\versionstest-profil.ps1 -Full

.EXAMPLE
  # Probelauf
  .\versionstest-profil.ps1 -Quelle "$env:USERPROFILE\curseforge\minecraft\Instances\MeinPack" `
                            -Ziel   "$env:USERPROFILE\curseforge\minecraft\Instances\MeinPack (1)"

.EXAMPLE
  # Anwenden, mit zusaetzlichen Bibliotheken, Musikordnern, ohne einen Config-Unterordner, mit Welt
  .\versionstest-profil.ps1 -Quelle "...\MeinPack" -Ziel "...\MeinPack (1)" `
      -Behalten 'fabric-api-*','ForgeConfigAPIPort-*' `
      -Ordner config,mts_server_music -Ausschliessen luckperms `
      -Welt "D:\Server-Download\world" -WeltName Testwelt -Ausfuehren
#>
param(
  [Parameter(Mandatory = $true)][string]$Quelle,
  [Parameter(Mandatory = $true)][string]$Ziel,
  [string]$AlteVersion = '',
  [string]$NeueVersion = '',
  [string[]]$Behalten = @('fabric-api-*'),
  [string[]]$Ordner = @('config'),
  [string[]]$Dateien = @('options.txt'),
  [string[]]$Ausschliessen = @(),
  [string]$Welt = '',
  [string]$WeltName = 'Testwelt',
  [switch]$Ausfuehren
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-GameVersion([string]$profil) {
  $f = Join-Path $profil 'minecraftinstance.json'
  if (-not (Test-Path $f)) { return '' }
  return [string](Get-Content $f -Raw | ConvertFrom-Json).gameVersion
}

function Read-ModJson([string]$jar) {
  $z = [IO.Compression.ZipFile]::OpenRead($jar)
  try {
    $e = $z.GetEntry('fabric.mod.json')
    if (-not $e) { return $null }
    $r = New-Object IO.StreamReader($e.Open()); $t = $r.ReadToEnd(); $r.Close()
    $id = $null; try { $id = ($t | ConvertFrom-Json).id } catch { }
    return [pscustomobject]@{ Id = $id; Text = $t }
  } finally { $z.Dispose() }
}

function Set-MinecraftRange([string]$jar, [string]$pattern, [string]$range) {
  $z = [IO.Compression.ZipFile]::Open($jar, 'Update')
  try {
    $e = $z.GetEntry('fabric.mod.json')
    $r = New-Object IO.StreamReader($e.Open()); $t = $r.ReadToEnd(); $r.Close()
    $new = [regex]::Replace($t, $pattern, ('"minecraft": "' + $range + '"'))
    $e.Delete()
    $w = New-Object IO.StreamWriter($z.CreateEntry('fabric.mod.json').Open(), (New-Object Text.UTF8Encoding($false)))
    $w.Write($new); $w.Close()
  } finally { $z.Dispose() }
}

function Copy-Dir([string]$von, [string]$nach) {
  $xd = @(); if ($Ausschliessen.Count) { $xd = @('/XD') + $Ausschliessen }
  robocopy $von $nach /E @xd /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy-Fehler ($LASTEXITCODE): $von" }
}

function Step([string]$msg) { if ($Ausfuehren) { "  [MACHE] $msg" } else { "  [PLAN ] $msg" } }

if (-not (Test-Path (Join-Path $Quelle 'mods'))) { throw "Quelle hat keinen mods-Ordner: $Quelle" }
if (-not (Test-Path (Join-Path $Ziel 'mods'))) { throw "Ziel hat keinen mods-Ordner: $Ziel" }
if ((Resolve-Path $Quelle).Path -eq (Resolve-Path $Ziel).Path) { throw 'Quelle und Ziel sind dasselbe Profil.' }

if (-not $AlteVersion) { $AlteVersion = Get-GameVersion $Quelle }
if (-not $NeueVersion) { $NeueVersion = Get-GameVersion $Ziel }
if (-not $AlteVersion -or -not $NeueVersion) { throw 'Version nicht ermittelbar, -AlteVersion und -NeueVersion angeben.' }
if ($AlteVersion -eq $NeueVersion) { Write-Warning "Beide Profile stehen auf $AlteVersion. Ist das Ziel wirklich der Klon?" }

$pin = '"minecraft"\s*:\s*"=?' + [regex]::Escape($AlteVersion) + '"'
$range = ">=$AlteVersion <=$NeueVersion"
"Modus:   " + $(if ($Ausfuehren) { 'AUSFUEHREN' } else { 'Probelauf (nichts wird geaendert, -Ausfuehren zum Anwenden)' })
"Quelle:  $Quelle  (Minecraft $AlteVersion)"
"Ziel:    $Ziel  (Minecraft $NeueVersion)"

"1) Mods aus dem Klon"
$keepIds = @{}
$aside = Join-Path $Ziel '_klon-mods-beiseite'
foreach ($f in Get-ChildItem (Join-Path $Ziel 'mods') -File) {
  $keep = $false; foreach ($p in $Behalten) { if ($f.Name -like $p) { $keep = $true } }
  if ($keep) {
    $info = if ($f.Extension -eq '.jar') { Read-ModJson $f.FullName } else { $null }
    if ($info -and $info.Id) { $keepIds[$info.Id] = $f.Name }
    "  behalten: $($f.Name)"
  } else {
    Step "beiseite: $($f.Name)"
    if ($Ausfuehren) { New-Item -ItemType Directory -Force $aside | Out-Null; Move-Item $f.FullName $aside -Force }
  }
}

"2) Jars aus der Quelle"
$copied = 0; $patched = 0; $skipped = 0
foreach ($f in Get-ChildItem (Join-Path $Quelle 'mods') -Filter *.jar -File) {
  $info = Read-ModJson $f.FullName
  if ($info -and $info.Id -and $keepIds.ContainsKey($info.Id)) {
    "  uebersprungen: $($f.Name) (ersetzt durch $($keepIds[$info.Id]))"; $skipped++; continue
  }
  $needsPatch = $info -and ([regex]::Matches($info.Text, $pin).Count -eq 1)
  if ($needsPatch) { Step "kopieren + Version anpassen ($range): $($f.Name)"; $patched++ } else { $copied++ }
  if ($Ausfuehren) {
    $dst = Join-Path (Join-Path $Ziel 'mods') $f.Name
    Copy-Item $f.FullName $dst -Force
    if ($needsPatch) { Set-MinecraftRange $dst $pin $range }
  }
}
"  ohne Aenderung kopiert: $copied, angepasst: $patched, uebersprungen: $skipped"

"3) Ordner, Dateien, Welt"
foreach ($d in $Ordner) {
  $von = Join-Path $Quelle $d
  if (Test-Path $von) {
    $hinweis = if ($Ausschliessen.Count) { " (ohne $($Ausschliessen -join ', '))" } else { '' }
    Step "Ordner $d kopieren$hinweis"
    if ($Ausfuehren) { Copy-Dir $von (Join-Path $Ziel $d) }
  } else { "  fehlt in der Quelle: $d" }
}
foreach ($d in $Dateien) {
  $von = Join-Path $Quelle $d
  if (Test-Path $von) {
    Step "Datei $d kopieren"
    if ($Ausfuehren) { Copy-Item $von (Join-Path $Ziel $d) -Force }
  }
}
if ($Welt) {
  if (-not (Test-Path (Join-Path $Welt 'level.dat'))) { throw "Keine Welt (level.dat fehlt): $Welt" }
  Step "Welt kopieren nach saves\$WeltName"
  if ($Ausfuehren) { Copy-Dir $Welt (Join-Path (Join-Path $Ziel 'saves') $WeltName) }
}
$global:LASTEXITCODE = 0

if ($Ausfuehren) {
  "4) Kontrolle"
  "  Jars im Ziel: $((Get-ChildItem (Join-Path $Ziel 'mods') -Filter *.jar).Count)"
  "Fertig. In CurseForge NICHT 'Repair' oder 'Update' druecken."
}
