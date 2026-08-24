# LeipzigCraft Header Fix

Ersetze auf GitHub:
- index.html
- styles.css

script.js kann unverändert bleiben; die index.html lädt ihn mit einer Versionsnummer neu.

Was geändert wurde:
- Header ist auf 78 px begrenzt.
- Logo ist hart auf maximal 62 px Höhe / 145 px Breite begrenzt.
- Zusätzliche Inline-Grenzen verhindern ein riesiges Logo selbst dann, wenn CSS kurz gecacht wird.
- styles.css und script.js bekommen Cache-Busting (`?v=4`).
- Logo bekommt ebenfalls Cache-Busting (`?v=2`).

Danach GitHub Pages kurz deployen lassen und die Seite normal neu laden.
