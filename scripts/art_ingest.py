#!/usr/bin/env python3
"""Ingest finished Higgsfield jobs into committed creature assets.

Reads build/ingest-batch.json (written by the generation driver with the job
results), and for each entry: downloads the raw image, runs the locked
postprocess pipeline for every required kind, and updates the creature's
meta.json. Front entries derive front/icon/overworld/tornasol; back entries
derive the back sprite. Idempotent per slot.

build/ingest-batch.json schema:
[ {"id","name","num","slot":"front"|"back","job_id","url","template","seed":int|null} ]

Usage: python3 scripts/art_ingest.py
"""
import json, os, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
POST = os.path.join(HERE, "postprocess.py")
MODEL = "flux_2 pro 1k"

def adir(cid):
    d = os.path.join(ROOT, "assets", "creatures", cid)
    os.makedirs(os.path.join(d, "raw"), exist_ok=True)
    return d

def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "metro-quest-art/1"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())
    if os.path.getsize(dest) < 256:
        sys.exit(f"ERROR: download too small: {url}")

def post(infile, outfile, kind, shiny=False, h32=False):
    cmd = [sys.executable, POST, infile, outfile, "--kind", kind]
    if shiny: cmd.append("--shiny")
    if h32: cmd.append("--h32")
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f"ERROR postprocess {kind} {infile}: {out.stderr.strip()}")
    return json.loads(out.stdout.strip().splitlines()[-1])

def load_meta(d, cid, item):
    p = os.path.join(d, "meta.json")
    if os.path.exists(p):
        return json.load(open(p, encoding="utf-8"))
    return {"id": cid, "name": item["name"], "num": item["num"],
            "model": MODEL, "jobs": {}, "palette": {}, "frames": {"idle": 1, "walk": 0},
            "anchor_px": {"ground_y": 63}, "notes": "Phase 5 generated."}

def main():
    batch_path = os.path.join(ROOT, "build", "ingest-batch.json")
    batch = json.load(open(batch_path, encoding="utf-8"))
    done = []
    for it in batch:
        cid, slot = it["id"], it["slot"]
        d = adir(cid)
        ext = os.path.splitext(it["url"].split("?")[0])[1] or ".png"
        meta = load_meta(d, cid, it)
        if slot == "front":
            raw = os.path.join(d, "raw", f"front.src{ext}")
            download(it["url"], raw)
            s_front = post(raw, os.path.join(d, "front.png"), "battle")
            post(raw, os.path.join(d, "icon.png"), "icon")
            post(raw, os.path.join(d, "overworld.png"), "overworld")
            s_shiny = post(raw, os.path.join(d, "front-tornasol.png"), "battle", shiny=True)
            meta["jobs"]["front"] = {"job_id": it["job_id"], "seed": it.get("seed"),
                                     "model": MODEL, "template": it["template"]}
            meta["palette"]["colors_front"] = s_front.get("colors")
            meta["palette"]["tornasol_swapped_row"] = s_shiny.get("tornasol_swapped_row")
        elif slot == "back":
            raw = os.path.join(d, "raw", f"back.src{ext}")
            download(it["url"], raw)
            s_back = post(raw, os.path.join(d, "back.png"), "battle")
            meta["jobs"]["back"] = {"job_id": it["job_id"], "seed": it.get("seed"),
                                    "model": MODEL, "template": it["template"],
                                    "reference": it.get("reference")}
            meta["palette"]["colors_back"] = s_back.get("colors")
        else:
            sys.exit(f"unknown slot {slot}")
        json.dump(meta, open(os.path.join(d, "meta.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        done.append(f"{cid}:{slot}")
    print("ingested:", ", ".join(done))

if __name__ == "__main__":
    main()
