# Plan: Server von Minecraft 1.21 auf 1.21.1 heben

Stand 07.11.2026 · Status: **Plan, nichts getestet**

Beschlossen am 07.11.2026: Das Update kommt **vor** der weiteren Quest-Arbeit aus Etappe 2. Sonst bauen wir Quests und Dialoge auf einer alten CustomNPCs-Version, die wir danach sowieso ersetzen.

Der Plan ist so geschrieben, dass ihn jeder lesen kann (wir, der Repo-Besitzer, eine KI). Ein kurzer Prompt für ChatGPT steht ganz unten und ist optional.

---

## 1. Ziel und Abgrenzung

| Heute | Ziel |
|---|---|
| Minecraft **1.21** | Minecraft **1.21.1** |
| Fabric Loader **0.17.3** | bleibt **0.17.3** |
| Fabric API 0.102.0+1.21 | 0.116.17+1.21.1 |
| CustomNPCs-Unofficial `1.21.1.20241204` (Dez. 2024) | `1.21.1.20260124` (Jan. 2026) |

**Nicht Teil des Plans:** ein neuerer Loader, Minecraft 1.21.4 oder höher, andere Mods updaten. 1.21 → 1.21.1 ist nur eine Fehlerbehebungs-Version. Alles darüber würde alle Mods neu bauen und ist ein eigenes Projekt.

## 2. Warum lohnt sich das

- **Die Kette der Dialog-/Quest-Arbeit** sitzt auf CustomNPCs. Die neueren Builds bringen laut Changelog: das moderne Dialog-System (03.11.2025), Script-GUIs, die auf dem Server wieder öffnen (29.11.2025), einen Memory-Leak-Fix (24.01.2026) und Fixes für NPCs, die sich nach einem Chunk-Reset nicht mehr ändern lassen. Das letzte ist unser bekannter Fehler „platzierte NPCs lassen sich nicht mehr ändern“.
- **FIW Bosses** (Boss-Raids, 12) läuft nur ab 1.21.1.
- **Aktuelle Fabric API** (0.116.17 vom 01.09.2026) statt einer Version von 2024.
- Wir müssen die zwei vorhandenen Quest-Ketten nicht auf einer alten Version flicken und danach nochmal anfassen. Es sind nur zwei Ketten, ein Neubau wäre also kein Drama.

**Kosten und Risiko:** mittlerer Aufwand (grob ein halber bis ein ganzer Tag, wenn die MTS-Fork-Jar ohne Neubau läuft), Risiko klein bis mittel. Das größte Risiko ist die MTS-Fork-Jar (Schritt 1).

## 3. Was heute auf 1.21 festhält

Geprüft am Profil `ServerPack` (06.11.2026), aus den `fabric.mod.json` der Jars:

| Datei | Angabe | Was tun |
|---|---|---|
| `Immersive Vehicles-1.21-25.0.0-fabric-alpha17-serverradio1.jar` (MTS-Fork, **unser** Fork mit Server-Radio) | `minecraft = 1.21` genau | Versionsangabe ändern. **Haupttest.** |
| `fuelpumprefill-1.0.3.jar` | `minecraft = 1.21` genau | Versionsangabe ändern |
| `mts-sound-mixer-1.0.0.jar` | `minecraft = 1.21` genau | Versionsangabe ändern |
| `fabric-api-0.102.0+1.21.jar` | `>=1.21- <1.21.1-` | ersetzen durch `fabric-api-0.116.17+1.21.1` (Modrinth, geprüft 06.11.) |
| `ForgeConfigAPIPort-v21.0.5-1.21-Fabric.jar` | `1.21` | ersetzen durch `v21.1.6-1.21.1-Fabric` (Modrinth, geprüft 06.11.) |

Alle anderen Mods erlauben 1.21.1 laut ihrer `fabric.mod.json`. **„Erlaubt“ heißt nicht „getestet“.** Das zeigt erst der Startversuch.

Die Grenze „Loader ≤ 0.17.3“ in fünf Gang-Mods (`gang-chunk-trade`, `gang-dynamic-npc-trader`, `gang-npc-party-level-gate`, `gang-player-level-xp`, `gang-server-items`) stört nicht, solange der Loader bei 0.17.3 bleibt. Sie würde erst bei einem späteren Loader-Update ein Thema.

## 4. Unsere Änderungen am Server (müssen erhalten bleiben)

Alles Folgende **immer vom aktuellen Stand von `/mods` auf dem Server** ausgehen, nie von alten ZIPs oder alten Ordnern.

| Änderung | Warum |
|---|---|
| `MTS Official Pack-1.21.1-V29-fabric.jar` statt der Original-Jar | Unsere Fassung hat eine eingebaute `fabric.mod.json` (Mod-ID `mtsofficialpack`). Die Original-Jar zeigt lila-schwarze Icons. Die Versionsangabe darin ist `1.21.x`, passt also auch für 1.21.1. |
| Radio-Jar `serverradio1` auf dem Server, nicht `serverradio_fixed` | Beide unterscheiden sich nur im Compiler, die Logik ist gleich. |
| Gelöscht, nicht wieder auflegen: `gang-player-level-xp` 1.1.0 und 1.1.1, `gang-server-stats-…DYNAMICBOARD-JAVA21FIX`, `serverradio_fixed` | Doppelte Versionen derselben Mod. |
| LuckPerms, Vanish und andere reine Server-Mods nie in Spieler-Downloads | LuckPerms hat Datenbank und Config mit Zugangsdaten. |
| Sodium, Iris, Complementary Reimagined, Faithful 64x nur im Spieler-Pack | Reine Client-Mods, nicht auf den Server. |
| Website, Download-Release `manual-v1.1`, Launcher-`pack.json` | Zeigen auf den heutigen Stand und müssen in Schritt 5 mit. |

## 5. Schritte

Reihenfolge nach Risiko: Die unsicherste Annahme (läuft der MTS-Fork auf 1.21.1?) wird zuerst getestet, bevor am Server oder an irgendetwas Öffentlichem etwas verändert wird.

### Schritt 0 – Sicherung (Pflicht)
1. Server bei Nitrado stoppen.
2. Per FileZilla den **kompletten** Server (Welt, `mods`, `config`) in einen neuen Ordner mit Datum herunterladen, z. B. `server-vor-1.21.1-2026-11-07`. Nicht über einen älteren Ordner kopieren.
3. Zusätzlich im Nitrado-Panel das **Welt-Backup** anlegen (es gibt unter „Werkzeuge“ nur „Backup wiederherstellen“, Anlegen siehe Panel).
4. Prüfen, dass der Download vollständig ist (Dateianzahl und Größe von `world/` passen zum Server).
5. Server wieder starten, falls hier nicht gleich weitergemacht wird.

### Schritt 1 – Test auf dem eigenen PC (riskanteste Annahme)
Hier wird am Server nichts verändert.
1. **Neues CurseForge-Profil** „ServerPack-1.21.1“: Minecraft **1.21.1**, Fabric **0.17.3**. Das Original-Profil bleibt unberührt.
2. Alle Jars aus `mods` des alten Profils in das neue Profil kopieren (ohne die reinen Server-Mods ist auch ok, für den ersten Test aber alle, damit das Bild dem Server gleicht).
3. Die drei Jars mit fester Version anpassen: Jar in einen Entpacker öffnen (eine Jar ist eine ZIP-Datei, z. B. mit 7-Zip „Archiv öffnen“), darin `fabric.mod.json` bearbeiten und bei `"depends"` / `"minecraft"` den Wert `"1.21"` durch `">=1.21 <=1.21.1"` ersetzen, speichern, Archiv aktualisieren. Betrifft: MTS-Fork, `fuelpumprefill`, `mts-sound-mixer`.
4. `fabric-api-0.102.0+1.21.jar` und `ForgeConfigAPIPort-v21.0.5-1.21-Fabric.jar` durch die 1.21.1-Versionen aus Abschnitt 3 ersetzen (über CurseForge: „Add Content“, die passende Datei wählen, die alte Datei entfernen). **Die Datei muss ausdrücklich „1.21.1“ im Namen oder in der Versionsliste haben.**
5. **CustomNPCs noch nicht tauschen.**
6. Minecraft starten. Im Log (`logs/latest.log`) nach `ERROR`, `Mixin apply failed`, `Could not find required mod` und dem Namen des MTS-Forks suchen.
7. **Abbruch**, wenn der Start abstürzt oder der MTS-Fork „Mixin apply failed“ meldet. Dann nichts auf Verdacht weiter ändern, sondern **Fall B** (unten).
8. Läuft der Start: eine **Kopie** der Server-Welt als Einzelspieler-Welt laden. Prüfen: Auto fahren, Radio auf „SERVER“ stellen, Werkbank im Autoland durchblättern (hatte vorher zu Kicks geführt), Party-Karte und Shop öffnen, ein Gang-Mod-Befehl aus dem Chat.

**Fall B – Fork läuft nicht:** Der Fork muss neu gebaut werden (Quellcode vom Repo-Besitzer, `minecraft`-Version in `fabric.mod.json` und Gradle-Konfiguration auf 1.21.1, Mappings prüfen). Das ist dann ein eigenes Teilprojekt. Das Update stoppt hier, bis der Fork läuft.

### Schritt 2 – CustomNPCs tauschen
Nur wenn Schritt 1 sauber war.
1. Im Test-Profil `CustomNPCs-Unofficial-Fabric-1.21.1.20241204.jar` entfernen und `1.21.1.20260124` einsetzen. **Dateinamen prüfen:** Er muss „Fabric“ enthalten, auf Modrinth gibt es auch Forge-Builds (Datei `1.20.1…`).
2. Kopie der Server-Welt laden. Prüfen:
   - Die zwei Quest-Ketten (Welcome to Grünau, Weed-Route) lassen sich spielen. Quest-Dateien liegen in `world/customnpcs/quests/`.
   - NPC-Händler (Dynamic Trader, Marketplace) öffnen.
   - **Platzierte NPCs lassen sich mit der NPC-Wand wieder ändern.** Das ist die Hauptfrage.
   - Dialoge zeigen weiter Texte und Optionen an.
3. **Rückweg:** Ist etwas kaputt, die alte CustomNPCs-Jar wieder einsetzen und die Welt aus Schritt 0 verwenden. Neue CustomNPCs-Versionen können gespeicherte Daten umschreiben, die alte Version liest sie dann eventuell nicht mehr.

### Schritt 3 – Nitrado vorbereiten
1. Im Nitrado-Panel die Server-Einstellungen öffnen und nachsehen, ob dort Minecraft-Version, Mod-Loader und Java-Version einstellbar sind. Im Netz steht dazu nichts Brauchbares, es geht nur im eigenen Panel. Screenshot der Einstellungsseite reicht, dann lässt sich daraus ablesen, was möglich ist.
2. Klären:
   - Gibt es **1.21.1 mit Fabric**? Bleibt der Loader **0.17.3**?
   - Ersetzt der Versionswechsel den Ordner `/mods` oder die Konfiguration? (Auf anderen Hostern ersetzt er die Server-Jar und Bibliotheken.)
   - Reicht die vorhandene Java-Version? (MC 1.21.x braucht Java 21.)
3. Unklar → **Nitrado-Support fragen**, nicht raten.

### Schritt 4 – Server umstellen
Zuerst die Spieler warnen (Discord), dann zu einer ruhigen Zeit:
1. Server stoppen. Frisches Backup (Schritt 0 wiederholen, wenn seit dem letzten viel gespielt wurde).
2. Im Panel Minecraft-Version auf 1.21.1 stellen (Loader 0.17.3).
3. Per FileZilla in `/mods`: die vier Dateien aus Abschnitt 3 ersetzen (angepasste Jars + Fabric API + ForgeConfigAPIPort), CustomNPCs tauschen. Alte Dateien in einen Ordner `mods-alt` legen, nicht löschen.
4. Server starten. `latest.log` prüfen: Alle Mods geladen, keine Fehler bei MTS-Fork, CustomNPCs und den Gang-Mods.
5. Mit dem Test-Account beitreten und die Liste aus Schritt 1 und 2 durchgehen.

### Schritt 5 – Alles mitziehen, was Spieler sehen (am selben Tag)
Mit dem alten Pack kommt man nach Schritt 4 nicht mehr auf den Server.
- **Launcher `pack.json`:** `minecraft` auf `1.21.1`, geänderte Dateien mit neuer SHA256-Prüfsumme und neuer URL, Pack-Version hochzählen, Signatur erneuern.
- **Website `index.html`:** Anleitungstext „Minecraft Java 1.21“ auf 1.21.1.
- **Neue Download-ZIPs** (Performance und High Quality) und Release `manual-v1.2`, Links in `index.html` und `script.js`.
- **CurseForge-Export** neu erstellen, Server-Daten und Musik abwählen.
- Ankündigung in Discord.

## 6. Fallen

- **Alle müssen gleichzeitig wechseln.** Wer das alte Pack hat, kommt nicht mehr rein.
- **CustomNPCs kann Daten umschreiben.** Zurück geht es dann nur über die Sicherung.
- **Fabric API:** nur die Datei, die ausdrücklich für 1.21.1 ist, nicht „die neueste“ und nicht eine für 1.21.4.
- **Jede getauschte Datei hat einen neuen SHA256-Hash.** Stimmt er im Launcher nicht, lehnt der Launcher die Datei ab.
- **Ein Ding pro Test.** Nicht gleichzeitig Loader heben und andere Mods updaten.
- **LuckPerms und die Nitrado-Datenbank nicht anfassen.**
- **Mods mit „1.21.1“ im Namen** (z. B. `audioplayer`) laufen schon auf 1.21 und brauchen keinen Tausch.
- **Radio:** Auf Modrinth gibt es Immersive Vehicles für 1.21.1 nur als NeoForge-Build (`24.0.0-1.21.1`, 16.04.2026), keine Fabric-Version. Der Fork bleibt also unser eigener, ein „schon gefixt“ ist dort nicht zu erwarten. CurseForge wurde nicht geprüft. Der bekannte Radio-Lag ist ein eigenes Thema.
- **Falsche Datei bei CustomNPCs:** auf Modrinth liegen Forge- und Fabric-Builds im selben Projekt.

## 7. Rollback

1. Server stoppen.
2. Alte `mods` (Ordner `mods-alt`) und die gesicherte Welt aus Schritt 0 zurückspielen.
3. Im Nitrado-Panel die Version zurück auf 1.21 stellen.
4. Server starten, mit dem Test-Account prüfen.
5. Falls schon der Launcher oder die Website umgestellt wurden: `pack.json` und Website-Text zurücksetzen.

## 8. Offen und ungetestet

- Läuft die MTS-Fork-Jar auf 1.21.1 nur mit geänderter Versionsangabe? (Vermutung, spricht dafür: 1.21 → 1.21.1 ändert intern wenig.)
- Bietet Nitrado 1.21.1 mit Fabric 0.17.3 an und was überschreibt der Wechsel?
- Lädt die neue CustomNPCs-Version unsere NPCs und Quests unverändert?
- Verhalten der übrigen Gang-Mods auf 1.21.1 (nur laut `fabric.mod.json` erlaubt, nicht getestet).

---

## Optional: kurzer Prompt für ChatGPT

Neuen Chat öffnen, den Plan oben komplett einfügen, darunter diesen Text:

```
Oben steht ein Plan für unseren Minecraft-Server. Ich kenne mich technisch kaum aus. Führe mich Schritt für Schritt: immer nur EINEN Schritt, dann wartest du auf mein Ergebnis (Text, Log oder Screenshot).
Regeln: Erfinde keine Versionsnummern oder Dateinamen, nimm nur die aus dem Plan. Schreibe nichts neu, solange der einfache Weg (Versionsangabe ändern) nicht gescheitert ist. Sag ehrlich, wenn du etwas nicht weißt. Ändere nie mehrere Dinge auf einmal. Fasse LuckPerms nicht an, hebe den Fabric Loader nicht (bleibt 0.17.3), gehe nicht höher als 1.21.1.
Fang mit Schritt 0 an und frag mich zuerst, welches Betriebssystem ich nutze.
```
