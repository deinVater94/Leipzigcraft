"""Prüft einen Mods-Ordner auf neuere Versionen bei Modrinth.

Aufruf:
    python -I mod_updates.py <mods-ordner> [--mc 1.21.1] [--loader fabric] [--md out.md] [--csv out.csv]

Je Jar:
  1. liest Mod-ID und Version aus fabric.mod.json (bzw. quilt.mod.json / META-INF/neoforge|mods.toml),
  2. sucht die Datei per SHA-1 bei Modrinth (exakter Treffer),
  3. fragt die neueste Version für <mc> + <loader> ab,
  4. ohne Hash-Treffer: Versuch über die Mod-ID als Modrinth-Slug (markiert als "per ID", unsicher).

Keine Abhängigkeiten außer Python 3.8+. Ändert nichts am Ordner.
"""
import argparse, csv, hashlib, json, re, sys, urllib.request, zipfile
from pathlib import Path

API = "https://api.modrinth.com/v2"
UA = {"User-Agent": "mod-update-check/1.0", "Content-Type": "application/json"}


def http(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def mod_info(jar):
    """(id, version) aus den Metadaten der Jar, sonst aus dem Dateinamen."""
    try:
        with zipfile.ZipFile(jar) as z:
            names = set(z.namelist())
            for meta in ("fabric.mod.json", "quilt.mod.json"):
                if meta in names:
                    d = json.loads(z.read(meta).decode("utf-8", "replace"), strict=False)
                    if meta == "quilt.mod.json":
                        d = d.get("quilt_loader", {})
                    return d.get("id", "?"), str(d.get("version", "?"))
            for meta in ("META-INF/neoforge.mods.toml", "META-INF/mods.toml"):
                if meta in names:
                    t = z.read(meta).decode("utf-8", "replace")
                    mid = re.search(r'modId\s*=\s*"([^"]+)"', t)
                    ver = re.search(r'version\s*=\s*"([^"]+)"', t)
                    return (mid.group(1) if mid else "?"), (ver.group(1) if ver else "?")
    except (zipfile.BadZipFile, ValueError):
        pass
    return jar.stem, "?"


def sha1(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ordner")
    ap.add_argument("--mc", default="1.21.1")
    ap.add_argument("--loader", default="fabric")
    ap.add_argument("--md")
    ap.add_argument("--csv")
    a = ap.parse_args()

    jars = sorted(Path(a.ordner).glob("*.jar"))
    if not jars:
        sys.exit(f"Keine .jar in {a.ordner}")
    rows = []
    for j in jars:
        mid, ver = mod_info(j)
        rows.append({"datei": j.name, "id": mid, "version": ver, "sha1": sha1(j)})

    hashes = [r["sha1"] for r in rows]
    current = http("POST", "/version_files", {"hashes": hashes, "algorithm": "sha1"}) or {}
    latest = http("POST", "/version_files/update", {"hashes": hashes, "algorithm": "sha1",
                  "loaders": [a.loader], "game_versions": [a.mc]}) or {}

    projects = {}
    for r in rows:
        cur, new = current.get(r["sha1"]), latest.get(r["sha1"])
        r["quelle"] = "Hash"
        if cur:
            r["projekt"] = cur["project_id"]
        else:
            # Fallback: Mod-ID als Slug probieren
            p = http("GET", f"/project/{r['id']}") if re.fullmatch(r"[\w\-.]+", r["id"]) else None
            if p:
                r["projekt"], r["quelle"] = p["id"], "per ID"
                q = urllib.parse.urlencode({"loaders": json.dumps([a.loader]),
                                            "game_versions": json.dumps([a.mc])})
                vs = http("GET", f"/project/{p['id']}/version?{q}") or []
                new = vs[0] if vs else None
            else:
                r["projekt"], r["quelle"] = "", "nicht auf Modrinth"
        r["neu"] = new["version_number"] if new else ""
        r["neu_datum"] = new["date_published"][:10] if new else ""
        r["neu_datei"] = new["files"][0]["filename"] if new and new.get("files") else ""
        if not r["projekt"]:
            r["status"] = "unbekannt (eigene Mod oder nur CurseForge)"
        elif not new:
            r["status"] = f"keine Version für {a.mc}/{a.loader}"
        elif cur and new["id"] == cur["id"]:
            r["status"] = "aktuell"
        elif r["neu_datei"] == r["datei"]:
            r["status"] = "aktuell"
        else:
            r["status"] = "UPDATE"
        if r["projekt"]:
            projects[r["projekt"]] = None

    if projects:
        ids = json.dumps(list(projects))
        for p in http("GET", "/projects?ids=" + urllib.parse.quote(ids)) or []:
            projects[p["id"]] = p["slug"]
    for r in rows:
        r["slug"] = projects.get(r["projekt"]) or ""

    order = {"UPDATE": 0}
    rows.sort(key=lambda r: (order.get(r["status"], 1), r["status"], r["datei"].lower()))
    cols = ["status", "datei", "id", "version", "neu", "neu_datum", "neu_datei", "slug", "quelle"]

    n = {s: sum(r["status"] == s for r in rows) for s in {r["status"] for r in rows}}
    print(f"{len(rows)} Jars, Ziel {a.mc}/{a.loader}: " + ", ".join(f"{k}: {v}" for k, v in sorted(n.items())))
    for r in rows:
        if r["status"] == "UPDATE":
            print(f"  UPDATE {r['datei']}  ->  {r['neu_datei']} ({r['neu_datum']})")

    if a.csv:
        with open(a.csv, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=cols, delimiter=";", extrasaction="ignore")
            w.writeheader(); w.writerows(rows)
    if a.md:
        with open(a.md, "w", encoding="utf-8") as f:
            f.write(f"| Status | Datei | Version | Neu für {a.mc} | Datum | Modrinth |\n|---|---|---|---|---|---|\n")
            for r in rows:
                link = f"[{r['slug']}](https://modrinth.com/mod/{r['slug']})" if r["slug"] else ""
                f.write(f"| {r['status']} | `{r['datei']}` | {r['version']} | {r['neu']} | {r['neu_datum']} | {link} |\n")


if __name__ == "__main__":
    import urllib.parse  # noqa: E402  (für Fallback)
    main()
