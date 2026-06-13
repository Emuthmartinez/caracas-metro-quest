#!/usr/bin/env python3
"""Metro Quest deterministic asset pipeline (locked at GATE 3).

background removal -> content crop -> NEAREST downscale -> master-palette
quantization -> <=15-color merge (sprites) -> 1px outline enforcement.

Usage:
  python3 scripts/postprocess.py IN.png OUT.png --kind battle [--shiny] [--h32]
Kinds: battle (64x64) | icon (32x32) | overworld (16x16, --h32 -> 16x32)
     | background (240x160) | tilesheet (multiple of 16) | keyart (palette grade only)
Prints a stats JSON line; exits non-zero if constraints can't be met.
"""
import argparse, json, os, sys
from collections import Counter, deque
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PALETTE_PATH = os.path.join(HERE, "..", "data", "palette", "master-palette.json")

SIZES = {"battle": (64, 64), "icon": (32, 32), "overworld": (16, 16),
         "background": (240, 160)}
SPRITE_KINDS = {"battle", "icon", "overworld"}


def load_palette():
    with open(PALETTE_PATH, encoding="utf-8") as fh:
        rows = json.load(fh)["rows"]
    table, row_of = [], {}
    for rname, hexes in rows.items():
        for hx in hexes:
            rgb = tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5))
            table.append(rgb)
            row_of[rgb] = rname
    return rows, table, row_of


def dist(a, b):
    return 2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2


def nearest(rgb, table):
    return min(table, key=lambda c: dist(rgb, c))


def remove_background(img, tol=28):
    """Flood-fill transparency from the four corners (near-white gen background)."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    refs = [px[x, y][:3] for x, y in seeds]
    seen = set()
    q = deque(seeds)
    while q:
        x, y = q.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a == 0 or any(max(abs(r - rr), abs(g - rg), abs(b - rb)) <= tol
                         for rr, rg, rb in refs):
            px[x, y] = (0, 0, 0, 0)
            q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return img


def content_crop(img, margin_frac=0.04):
    bbox = img.getbbox()
    if not bbox:
        sys.exit("ERROR: image is empty after background removal")
    l, t, r, b = bbox
    m = int(max(r - l, b - t) * margin_frac)
    return img.crop((max(0, l - m), max(0, t - m),
                     min(img.width, r + m), min(img.height, b + m)))


def downscale(img, tw, th):
    scale = min(tw / img.width, th / img.height)
    nw, nh = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    small = img.resize((nw, nh), Image.NEAREST)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    canvas.paste(small, ((tw - nw) // 2, th - nh))  # feet to the floor
    return canvas


def quantize(img, table):
    px = img.load()
    cache = {}
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0)
                continue
            key = (r, g, b)
            if key not in cache:
                cache[key] = nearest(key, table)
            nr, ng, nb = cache[key]
            px[x, y] = (nr, ng, nb, 255)
    return img


def merge_to_budget(img, budget=15):
    px = img.load()
    while True:
        counts = Counter(px[x, y][:3] for y in range(img.height)
                         for x in range(img.width) if px[x, y][3] == 255)
        if len(counts) <= budget:
            return img, len(counts)
        rare = min(counts, key=counts.get)
        others = [c for c in counts if c != rare]
        target = min(others, key=lambda c: dist(rare, c))
        for y in range(img.height):
            for x in range(img.width):
                if px[x, y][3] == 255 and px[x, y][:3] == rare:
                    px[x, y] = (*target, 255)


def enforce_outline(img, dark=(26, 26, 26)):
    px = img.load()
    w, h = img.size
    fixed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a != 255:
                continue
            edge = any(not (0 <= x + dx < w and 0 <= y + dy < h)
                       or px[x + dx, y + dy][3] == 0
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if edge and (0.3 * r + 0.55 * g + 0.15 * b) > 70:
                px[x, y] = (*dark, 255)
                fixed += 1
    return img, fixed


def tornasol(img, rows):
    """Deterministic shiny: dominant non-neutral ramp -> naranja_metro, index-wise."""
    px = img.load()
    hex2rgb = lambda hx: tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5))
    ramps = {n: [hex2rgb(h) for h in hx] for n, hx in rows.items()}
    counts = Counter()
    for y in range(img.height):
        for x in range(img.width):
            if px[x, y][3] != 255:
                continue
            rgb = px[x, y][:3]
            for name, ramp in ramps.items():
                if rgb in ramp and not name.startswith(("0_", "1_", "2_")):
                    counts[name] += 1
    if not counts:
        return img, None
    dom = counts.most_common(1)[0][0]
    mapping = dict(zip(ramps[dom], ramps["2_naranja_metro"]))
    for y in range(img.height):
        for x in range(img.width):
            if px[x, y][3] == 255 and px[x, y][:3] in mapping:
                px[x, y] = (*mapping[px[x, y][:3]], 255)
    return img, dom


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("infile"); ap.add_argument("outfile")
    ap.add_argument("--kind", required=True,
                    choices=["battle", "icon", "overworld", "background",
                             "tilesheet", "keyart"])
    ap.add_argument("--shiny", action="store_true")
    ap.add_argument("--h32", action="store_true",
                    help="overworld 16x32 instead of 16x16")
    a = ap.parse_args()

    rows, table, _ = load_palette()
    img = Image.open(a.infile).convert("RGBA")
    stats = {"in": a.infile, "out": a.outfile, "kind": a.kind,
             "src_size": list(img.size)}

    if a.kind in SPRITE_KINDS:
        img = remove_background(img)
        img = content_crop(img)
        tw, th = (16, 32) if (a.kind == "overworld" and a.h32) else SIZES[a.kind]
        img = downscale(img, tw, th)
        img = quantize(img, table)
        img, ncolors = merge_to_budget(img, 15)
        img, fixed = enforce_outline(img)
        stats.update(colors=ncolors, outline_fixed=fixed)
        if ncolors > 15:
            sys.exit("ERROR: could not reach 15-color budget")
    elif a.kind == "background":
        img = img.resize(SIZES["background"], Image.NEAREST)
        img = quantize(img, table)
        stats["colors"] = "full palette"
    elif a.kind == "tilesheet":
        w = img.width - img.width % 16
        h = img.height - img.height % 16
        img = img.crop((0, 0, w, h))
        img = quantize(img, table)
    else:  # keyart: palette grade only (soft quantize keeps size)
        img = quantize(img, table)

    if a.shiny:
        img, dom = tornasol(img, rows)
        stats["tornasol_swapped_row"] = dom

    os.makedirs(os.path.dirname(os.path.abspath(a.outfile)), exist_ok=True)
    img.save(a.outfile)
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    main()
