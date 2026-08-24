# LeipzigCraft – Logo + Marquee Update

Dieses Paket ersetzt die bisherigen Dateien vollständig.

## Hochladen / ersetzen

Im Hauptverzeichnis:

- `index.html`
- `styles.css`
- `script.js`

Zusätzlich muss dieser Ordner ins Repository:

- `assets/leipzigcraft-logo.png`

Deinen vorhandenen `downloads`-Ordner nicht löschen.

## Wichtig

Bitte die neue `styles.css` wirklich komplett verwenden und nicht nur unten an die alte Datei anhängen.

Der alte Ticker verwendete Klassen wie `.ticker`. Diese Version verwendet absichtlich komplett neue Klassen (`.lc-marquee...`), damit keine alten CSS-Regeln mehr dazwischenfunken.

Der neue Lauftext:
- wird per JavaScript so oft geklont, dass auch breite Monitore gefüllt sind,
- bewegt sich exakt um die Breite einer Gruppe,
- springt dadurch nicht sichtbar zurück,
- benutzt nur eine einzige laufende Browser-Animation.

Das Logo stammt aus der bereits in dieser Unterhaltung erzeugten transparenten Version.
