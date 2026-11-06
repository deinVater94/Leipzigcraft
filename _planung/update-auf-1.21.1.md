# Update auf Minecraft 1.21.1

Stand: 07.11.2026 · Status: Entwurf, noch nichts getestet

## Ziel

| Heute | Ziel |
|---|---|
| Minecraft 1.21 | Minecraft 1.21.1 |
| Fabric Loader 0.17.3 | bleibt 0.17.3 |
| Fabric API 0.102.0+1.21 | 0.116.17+1.21.1 |
| CustomNPCs-Unofficial 1.21.1.20241204 | 1.21.1.20260124 |

Nicht Teil dieses Updates: ein neuerer Fabric Loader, Minecraft 1.21.4 oder höher, Updates anderer Mods. 1.21.1 ist nur eine Fehlerbehebungs-Version von 1.21. Alles darüber würde alle Mods neu bauen und wäre ein eigenes Projekt.

## Warum

- Die neueren CustomNPCs-Builds laufen nur auf 1.21.1. Sie bringen laut Changelog das moderne Dialog-System, einen Memory-Leak-Fix, Script-GUIs, die auf dem Server wieder öffnen, und Fixes für NPCs, die sich nach einem Chunk-Reset nicht mehr ändern lassen. Quests, Dialoge und NPC-Händler des Servers hängen an dieser Mod.
- Für geplante Boss-Raids kommt FIW Bosses in Frage. Es läuft nur ab 1.21.1.
- Die Fabric API ist von 2024 und wird durch eine aktuelle Version ersetzt.

## Was heute auf 1.21 festhält

Geprüft an den `fabric.mod.json` der Jars (06.11.2026):

| Datei | Angabe | Maßnahme |
|---|---|---|
| `Immersive Vehicles-1.21-25.0.0-fabric-alpha17-serverradio1.jar` (eigener Fork mit Server-Radio) | `minecraft = 1.21` genau | Versionsangabe ändern. Das ist der wichtigste Test. |
| `fuelpumprefill-1.0.3.jar` | `minecraft = 1.21` genau | Versionsangabe ändern |
| `mts-sound-mixer-1.0.0.jar` | `minecraft = 1.21` genau | Versionsangabe ändern |
| `fabric-api-0.102.0+1.21.jar` | `>=1.21- <1.21.1-` | ersetzen durch `fabric-api-0.116.17+1.21.1` |
| `ForgeConfigAPIPort-v21.0.5-1.21-Fabric.jar` | `1.21` | ersetzen durch `v21.1.6-1.21.1-Fabric` |

Alle übrigen Mods erlauben 1.21.1 laut ihrer `fabric.mod.json`. Erlaubt heißt nicht getestet: Das zeigt erst ein Startversuch.

Die Grenze „Loader ≤ 0.17.3“ in fünf eigenen Mods (`gang-chunk-trade`, `gang-dynamic-npc-trader`, `gang-npc-party-level-gate`, `gang-player-level-xp`, `gang-server-items`) stört nicht, solange der Loader bei 0.17.3 bleibt.

## Besonderheiten des aktuellen Stands (müssen erhalten bleiben)

Ausgangspunkt ist immer der aktuelle Stand von `/mods` auf dem Server, nicht ein älterer Download oder Ordner.

- `MTS Official Pack-1.21.1-V29-fabric.jar` ist eine Fassung mit eingebauter `fabric.mod.json` (Mod-ID `mtsofficialpack`). Die Original-Jar ohne diese Datei zeigt lila-schwarze Item-Icons. Sie darf nicht gegen das Original getauscht werden.
- Als Radio-Jar liegt `serverradio1` auf dem Server, nicht `serverradio_fixed`.
- Bewusst gelöscht und nicht wieder aufzulegen: `gang-player-level-xp` 1.1.0 und 1.1.1, `gang-server-stats-…DYNAMICBOARD-JAVA21FIX`, `serverradio_fixed` (jeweils doppelte Versionen).
- Reine Server-Mods (LuckPerms, Vanish und weitere) gehören nicht in Downloads für Spieler. LuckPerms-Daten und -Config schon gar nicht.
- Sodium, Iris, Complementary Reimagined und Faithful 64x sind reine Client-Mods für Spieler und gehören nicht auf den Server.
- Launcher-`pack.json`, Website-Anleitung und das Download-Release `manual-v1.1` zeigen auf den heutigen Stand und müssen mit umgestellt werden.

## Vorgehen

Die unsicherste Annahme (läuft der Radio-Fork auf 1.21.1?) wird zuerst getestet, bevor am Server oder an etwas Öffentlichem etwas verändert wird.

### 0. Sicherung
1. Server bei Nitrado stoppen.
2. Per FileZilla den kompletten Server (Welt, `mods`, `config`) in einen neuen Ordner mit Datum herunterladen.
3. Zusätzlich im Nitrado-Panel ein Welt-Backup anlegen.
4. Prüfen, ob der Download vollständig ist (Dateianzahl und Größe von `world/`).

### 1. Test auf einem lokalen PC
Der Server wird dabei nicht verändert.
1. Neues CurseForge-Profil mit Minecraft 1.21.1 und Fabric 0.17.3 anlegen.
2. Die Jars vom Server in dessen `mods` kopieren.
3. Bei den drei Jars mit fester Version in der `fabric.mod.json` unter `depends` den Wert `"minecraft": "1.21"` durch `">=1.21 <=1.21.1"` ersetzen. Eine Jar ist eine ZIP-Datei und lässt sich mit einem Entpacker bearbeiten.
4. Fabric API und ForgeConfigAPIPort durch die 1.21.1-Versionen aus der Tabelle ersetzen.
5. CustomNPCs in diesem Schritt noch nicht tauschen.
6. Starten und `logs/latest.log` auf `ERROR`, `Mixin apply failed` und `Could not find required mod` prüfen.
7. Eine Kopie der Server-Welt als Einzelspieler-Welt laden und prüfen: Auto fahren, Radio auf „SERVER“, Werkbank im Autoland, Party-Karte, Shop, ein Befehl der eigenen Mods.

Bricht der Test ab, wird nicht auf Verdacht weiter geändert. Dann muss der Radio-Fork für 1.21.1 neu gebaut werden (Versionsangaben in `fabric.mod.json` und Gradle-Konfiguration, Mappings prüfen). Das Update ruht, bis der Fork läuft.

### 2. CustomNPCs tauschen
Nur wenn Schritt 1 sauber war.
1. Im Test-Profil CustomNPCs durch `1.21.1.20260124` ersetzen. Der Dateiname muss „Fabric“ enthalten, denn im selben Modrinth-Projekt liegen auch Forge-Builds.
2. In der Welt-Kopie prüfen: vorhandene Quests und Dialoge, NPC-Händler, und ob platzierte NPCs mit der NPC-Wand wieder änderbar sind.
3. Ist etwas kaputt, die alte Jar wieder einsetzen. Neue CustomNPCs-Versionen können gespeicherte Daten umschreiben, die alte Version liest sie danach eventuell nicht mehr.

### 3. Nitrado klären
1. Im Panel prüfen, ob Minecraft 1.21.1 mit Fabric und Loader 0.17.3 angeboten wird, welche Java-Version läuft (1.21.x braucht Java 21) und ob ein Versionswechsel den Ordner `/mods` oder die Konfiguration überschreibt.
2. Bleibt etwas unklar, beim Nitrado-Support nachfragen.

### 4. Server umstellen
1. Spieler vorher ankündigen, Zeitpunkt mit wenig Betrieb wählen.
2. Server stoppen, frisches Backup.
3. Version im Panel auf 1.21.1 stellen.
4. In `/mods` die geänderten Dateien ersetzen, die alten in einen Ordner `mods-alt` verschieben.
5. Starten, `latest.log` prüfen und mit einem Test-Account die Liste aus Schritt 1 und 2 durchgehen.

### 5. Alles umstellen, was Spieler betrifft (am selben Tag)
Mit dem alten Pack kommt man nach Schritt 4 nicht mehr auf den Server.
- Launcher-`pack.json`: `minecraft` auf `1.21.1`, geänderte Dateien mit neuer SHA256-Prüfsumme und URL, Pack-Version erhöhen, Signatur erneuern.
- Website-Anleitung: Versionsangabe auf 1.21.1.
- Neue Download-ZIPs (Performance und High Quality) als neues Release, Links auf der Website anpassen.
- Neuer CurseForge-Export ohne Server-Daten und ohne Servermusik.
- Ankündigung für die Spieler.

## Risiken

- Alle Spieler müssen gleichzeitig wechseln.
- CustomNPCs kann gespeicherte Daten umschreiben. Zurück geht es dann nur über die Sicherung aus Schritt 0.
- Fabric API: nur die Datei verwenden, die ausdrücklich für 1.21.1 gebaut ist, nicht die neueste und keine für 1.21.4.
- Jede getauschte Datei hat eine neue SHA256-Prüfsumme. Stimmt sie in der `pack.json` nicht, lehnt der Launcher die Datei ab.
- Immer nur eine Änderung pro Test, nicht gleichzeitig Loader und Mods anheben.
- LuckPerms und die zugehörige Datenbank bleiben unberührt.
- Radio: Für Immersive Vehicles gibt es auf Modrinth für 1.21.1 nur einen NeoForge-Build, keinen Fabric-Build. Der Fork bleibt also der eigene. CurseForge wurde nicht geprüft.

## Rückweg

1. Server stoppen.
2. Alte Mods (`mods-alt`) und die gesicherte Welt aus Schritt 0 zurückspielen.
3. Im Nitrado-Panel die Version auf 1.21 zurückstellen.
4. Starten und mit einem Test-Account prüfen.
5. Falls Launcher oder Website schon umgestellt wurden, `pack.json` und Website-Text zurücksetzen.

## Offene Punkte

- Läuft der Radio-Fork auf 1.21.1 mit geänderter Versionsangabe allein? (Vermutung: ja, 1.21 und 1.21.1 unterscheiden sich intern wenig. Ungetestet.)
- Bietet Nitrado 1.21.1 mit Fabric 0.17.3 an, und was überschreibt der Wechsel?
- Lädt die neue CustomNPCs-Version die vorhandenen NPCs und Quests unverändert?
- Verhalten der übrigen Mods auf 1.21.1 (laut `fabric.mod.json` erlaubt, nicht getestet).
