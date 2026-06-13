#!/usr/bin/env python3
"""Build the Phase 5 art generation manifest from the bestiario data.

For every creature, fills the LOCKED prompt templates (prompts/) with its
design_brief + a palette-ramp selection derived from its types and the
style-bible rendering rules. Emits build/art-manifest.json: an ordered,
resumable worklist the generation driver consumes (front gen + back gen per
creature; icon/overworld/tornasol are postprocess-derived, not generations).

Deterministic and idempotent — safe to re-run. Does NOT call any API or spend
credits; it only prepares prompts. Model is flux_2 (GATE 3 locked baseline).

Usage: python3 scripts/build_art_manifest.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)

palette = load("data/palette/master-palette.json")["rows"]
creatures = load("data/creatures/creatures.json")["creatures"]
by_id = {c["id"]: c for c in creatures}

# Type -> the palette rows that carry that type's hue (style-bible §2 + §5 keys,
# applied to creature bodies). Row 0 (outline/earth) is always added.
TYPE_ROWS = {
    "Criollo":   ["1_concreto_brutalista"],
    "Sabroso":   ["5_hora_dorada"],
    "Rumba":     ["7_caribe_vitales"],
    "Espanto":   ["6_neon_espiritu"],
    "Catatumbo": ["6_neon_espiritu", "5_hora_dorada"],
    "Caribe":    ["7_caribe_vitales"],
    "Monte":     ["3_verde_avila", "4_selva_calida"],
    "Tepuy":     ["1_concreto_brutalista", "0_outline_earth"],
}

def hexes(row, idxs=None):
    vals = palette[row]
    if idxs is not None:
        vals = [vals[i] for i in idxs if i < len(vals)]
    return vals

def ramp_phrase(rows):
    """Compact 'name (hexes)' phrase for the prompt, ≤3 body ramps + outline."""
    label = {
        "0_outline_earth": "earth browns",
        "1_concreto_brutalista": "brutalist concrete grays",
        "2_naranja_metro": "metro orange",
        "3_verde_avila": "Ávila greens",
        "4_selva_calida": "warm jungle greens and browns",
        "5_hora_dorada": "golden-hour yellows",
        "6_neon_espiritu": "spirit-violet neon",
        "7_caribe_vitales": "caribe water blues",
    }
    parts = []
    for r in rows:
        # sample 4 representative steps to keep the prompt tight
        hx = hexes(r)
        sample = [hx[1], hx[3], hx[5], hx[7]] if len(hx) >= 8 else hx
        parts.append(f"{label[r]} ({' '.join(sample)})")
    return "; ".join(parts)

def body_rows(c):
    rows = []
    for t in c["types"]:
        for r in TYPE_ROWS[t]:
            if r not in rows:
                rows.append(r)
    # fauna & tepuy bodies want earth shading; ensure row 0 present, cap at 3 body ramps
    rows = rows[:3]
    if "0_outline_earth" not in rows:
        rows = rows[:2] + ["0_outline_earth"]
    return rows

def render_note(c):
    """Magical-realism rule from style-bible §4, as a prompt clause."""
    if c["category"] == "folklore":
        return ("Espanto rendering: shade the shadow side with faint spirit-violet "
                "(#6a4db8 #9b7ad6), hard edges, no ghost transparency, a 1px gap under "
                "the feet (does not quite touch the floor), no contact shadow.")
    if c["category"] == "urban-magical":
        return ("Urban-magical rendering: flesh/object shading in earth tones plus exactly "
                "one spirit-violet/neon accent feature (eyes, a spark, a lit window).")
    return ("Fauna rendering: earth-tone shading, grounded confident stance, full "
            "opacity (no separate ground shadow — the sprite is isolated).")

CONCEPT = open(os.path.join(ROOT, "prompts/creature-concept.prompt"), encoding="utf-8").read()
EVOLUTION = open(os.path.join(ROOT, "prompts/creature-evolution.prompt"), encoding="utf-8").read()
BACK = open(os.path.join(ROOT, "prompts/creature-back.prompt"), encoding="utf-8").read()

def strip_header(tmpl):
    # Strip only the leading comment block (the "# vN ..." header lines); keep
    # any '#' that appears inside the prompt body (e.g. '#FFFFFF').
    lines = tmpl.splitlines()
    i = 0
    while i < len(lines) and lines[i].lstrip().startswith("#"):
        i += 1
    return "\n".join(lines[i:]).strip()

def fill(tmpl, **kw):
    out = strip_header(tmpl)
    for k, v in kw.items():
        out = out.replace("{" + k + "}", v)
    return out

# pre-evolution map (what each creature evolves FROM), for evolution/back references
evolves_from = {}
for c in creatures:
    e = c.get("evolves_to")
    if e:
        evolves_from[e["to"]] = c["id"]

ALREADY_DONE = {"chigui", "chiguiron"}  # Phase 3 proof line, committed on flux_2

manifest = {
    "model": "flux_2",
    "model_params": {"model": "pro", "resolution": "1k"},
    "aspect_ratio": "1:1",
    "notes": "Phase 5 worklist. Per creature: a front generation then a back "
             "generation (reference = the front job id). icon/overworld/tornasol "
             "are postprocess-derived from the front, not separate generations. "
             "Evolved stages use the evolution template with the prior stage's "
             "front job as reference, preserving line identity. chigui/chiguiron "
             "are the Phase 3 anchor line (already committed) and are skipped.",
    "items": [],
}

for c in creatures:
    if c["id"] in ALREADY_DONE:
        continue
    rows = body_rows(c)
    palette_rows = ramp_phrase(rows)
    note = render_note(c)
    pre = evolves_from.get(c["id"])
    is_evo = pre is not None and pre not in ("",)
    if is_evo:
        front_prompt = fill(EVOLUTION, name=c["name_es"],
                            prior_stage_name=by_id[pre]["name_es"],
                            design_brief=c["design_brief"],
                            palette_rows=palette_rows) + " " + note
        front_ref = pre  # reference the prior stage's front job (resolved at run time)
        front_template = "creature-evolution.prompt"
    else:
        front_prompt = fill(CONCEPT, name=c["name_es"],
                            design_brief=c["design_brief"],
                            palette_rows=palette_rows) + " " + note
        front_ref = None
        front_template = "creature-concept.prompt"
    back_prompt = fill(BACK, name=c["name_es"],
                       design_brief=c["design_brief"],
                       palette_rows=palette_rows) + " " + note
    manifest["items"].append({
        "id": c["id"], "num": c["num"], "name": c["name_es"],
        "category": c["category"], "types": c["types"],
        "budget": c["budget"], "is_evolution": is_evo,
        "front": {"template": front_template, "ref_front_of": front_ref,
                  "prompt": front_prompt},
        "back": {"template": "creature-back.prompt", "prompt": back_prompt},
        "derives": ["icon", "overworld", "tornasol"],
    })

os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
out = os.path.join(ROOT, "build", "art-manifest.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)
    f.write("\n")
print(f"wrote build/art-manifest.json: {len(manifest['items'])} creatures to generate "
       f"({len(manifest['items'])*2} generations + {len(manifest['items'])*3} derived)")
