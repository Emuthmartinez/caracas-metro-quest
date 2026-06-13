#!/usr/bin/env python3
"""Compose a creature-line contact sheet for review against the anchor.

One row per creature: front, back, icon, overworld, tornasol — each integer-
scaled onto a checkerboard so transparency and stray pixels are visible. The
Chigüi anchor row is appended last for style comparison.

Usage: python3 scripts/make_contact_sheet.py OUT.png id1 id2 ...
"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLOTS = [("front", 4), ("back", 4), ("front-tornasol", 4), ("icon", 6), ("overworld", 10)]
CELL = 64 * 4 + 16  # max sprite (64@4x) + padding
PAD = 12
LABELW = 150

def checker(w, h, s=8):
    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2:
                d.rectangle([x, y, x + s - 1, y + s - 1], fill=(214, 214, 214, 255))
    return img

def place(sheet, cx, cy, path, scale):
    if not os.path.exists(path):
        return
    sp = Image.open(path).convert("RGBA")
    sp = sp.resize((sp.width * scale, sp.height * scale), Image.NEAREST)
    bg = checker(sp.width, sp.height)
    bg.alpha_composite(sp)
    sheet.alpha_composite(bg, (cx + (CELL - sp.width) // 2, cy + (CELL - sp.height) // 2))

def main():
    out = sys.argv[1]
    ids = sys.argv[2:] + ["chigui"]  # anchor last
    cols = len(SLOTS)
    W = LABELW + cols * CELL + PAD
    H = PAD + len(ids) * (CELL + PAD)
    sheet = Image.new("RGBA", (W, H), (40, 40, 46, 255))
    d = ImageDraw.Draw(sheet)
    for ci, (slot, _) in enumerate(SLOTS):
        d.text((LABELW + ci * CELL + CELL // 2 - 24, 2), slot, fill=(230, 230, 230, 255))
    for ri, cid in enumerate(ids):
        cy = PAD + ri * (CELL + PAD)
        tag = cid + ("  (ANCHOR)" if cid == "chigui" else "")
        d.text((6, cy + CELL // 2), tag, fill=(255, 210, 140, 255) if cid == "chigui" else (235, 235, 235, 255))
        for ci, (slot, scale) in enumerate(SLOTS):
            place(sheet, LABELW + ci * CELL, cy, os.path.join(ROOT, "assets", "creatures", cid, f"{slot}.png"), scale)
    sheet.convert("RGB").save(out)
    print("wrote", out, sheet.size)

if __name__ == "__main__":
    main()
