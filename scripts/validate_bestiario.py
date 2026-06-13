#!/usr/bin/env python3
"""Phase 4 content validator: creatures, abilities, encounters.

Checks the full data contract between data/creatures/creatures.json,
data/abilities/abilities.json, data/encounters/encounters.json,
data/moves/moves.json and data/maps/maps.json, plus the GATE 0 canon
freeze (Q4A) for the shipped 29. Run before any commit that touches
these files (see docs/playbook/new-content.md).

Usage: python3 scripts/validate_bestiario.py
Exits non-zero on any error. Warnings don't fail the build.
"""
import json, os, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TYPES = {"Criollo","Sabroso","Rumba","Espanto","Catatumbo","Caribe","Monte","Tepuy"}
BANDS = {"s1": (300,340), "s2": (400,440), "s3": (500,540), "leg": (570,600)}
EVPTS = {"s1":1, "s2":2, "s3":3, "leg":3}
GROUPS = {"rapido","parejo","pausado","lento"}
CATS = {"fauna","folklore","urban-magical"}
REGIONS = {"linea1","linea2","linea3","linea4","linea5","superficie","avila",
           "metrocable_sanagustin","metrocable_mariche","losteques"}
HABS = {"tunel","anden","matorral","parque","agua","mercado","apagon","fantasma",
        "paramo","cable","cumbre","sendero","zoologico","boulevard"}
STATS = ["hp","atk","def","spa","spd","spe"]
KINDS = {"oscura","matorral","anden","sendero","azotea","tableau","safari"}

# GATE 0/Q4A freeze: the shipped 29 — names, types and evolution relationships
# are immutable (new stages may be appended to line ends; pre-evos may point in).
CANON_FREEZE = {
 "frontinito": ("Frontinito", ["Tepuy"], "ucumari"),
 "ucumari": ("Ucumarí", ["Tepuy","Monte"], None),
 "turpialin": ("Turpialín", ["Rumba","Monte"], "cantaclaro"),
 "cantaclaro": ("Cantaclaro", ["Rumba","Monte"], None),
 "cocuyin": ("Cocuyín", ["Catatumbo"], "centella"),
 "centella": ("La Centella", ["Catatumbo","Espanto"], None),
 "chigui": ("Chigüi", ["Caribe"], "chiguiron"),
 "chiguiron": ("Chigüirón", ["Caribe","Tepuy"], None),
 "cunaguaro": ("Cunaguaro", ["Monte"], None),
 "pereza": ("Pereza", ["Monte","Criollo"], None),
 "rabipelado": ("Rabipelado", ["Criollo","Espanto"], None),
 "guacamayo": ("Guacamayo", ["Rumba","Monte"], None),
 "caribito": ("Caribito", ["Caribe"], "caribazo"),
 "caribazo": ("Caribazo", ["Caribe"], None),
 "araguako": ("Araguako", ["Monte","Rumba"], None),
 "tonina": ("Tonina", ["Caribe","Espanto"], None),
 "bachaquito": ("Bachaquito", ["Monte"], "bachacon"),
 "bachacon": ("Bachacón", ["Monte","Tepuy"], None),
 "cachicamo": ("Cachicamo", ["Tepuy"], None),
 "morrocoy": ("Morrocoy", ["Tepuy","Sabroso"], None),
 "mapanare": ("Mapanare", ["Monte","Espanto"], None),
 "duendecito": ("Duendecito", ["Espanto","Monte"], None),
 "pavoso": ("Pavoso", ["Espanto"], None),
 "vagonima": ("Vagónima", ["Espanto","Catatumbo"], None),
 "llorona": ("La Llorona", ["Espanto","Caribe"], None),
 "sayona": ("La Sayona", ["Espanto"], None),
 "silbon": ("El Silbón", ["Espanto","Rumba"], None),
 "catatumbo": ("Catatumbo", ["Catatumbo","Caribe"], None),
 "trenfantasma": ("Tren Fantasma", ["Espanto","Catatumbo"], None),
}
# Shipped evolution levels (js/dex.js) — immutable.
CANON_EVO_LEVELS = {"frontinito":16,"turpialin":16,"cocuyin":16,"chigui":18,
                    "caribito":20,"bachaquito":18}

errors, warnings = [], []
def err(m): errors.append(m)
def warn(m): warnings.append(m)

def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)

creatures = load("data/creatures/creatures.json")["creatures"]
abilities = load("data/abilities/abilities.json")["abilities"]
encfile = load("data/encounters/encounters.json")
moves = {m["id"] for m in load("data/moves/moves.json")["moves"]}
maps = load("data/maps/maps.json")["maps"]

ability_ids = {a["id"] for a in abilities}
ids = {}

# ——— creatures ———
if len(creatures) != 150:
    err(f"roster must be exactly 150, found {len(creatures)}")
for i, c in enumerate(creatures, 1):
    cid = c.get("id","?")
    if c.get("num") != i: err(f"{cid}: num {c.get('num')} != position {i}")
    if cid in ids: err(f"duplicate id {cid}")
    ids[cid] = c
    if not (1 <= len(c["types"]) <= 2) or not set(c["types"]) <= TYPES:
        err(f"{cid}: bad types {c['types']}")
    if c["category"] not in CATS: err(f"{cid}: bad category {c['category']}")
    if c["region"] not in REGIONS: err(f"{cid}: bad region {c['region']}")
    if not set(c["habitats"]) <= HABS: err(f"{cid}: bad habitats {c['habitats']}")
    if c["budget"] not in BANDS: err(f"{cid}: bad budget {c['budget']}")
    else:
        lo, hi = BANDS[c["budget"]]
        bst = sum(c["base"][s] for s in STATS)
        if not (lo <= bst <= hi): err(f"{cid}: BST {bst} outside {c['budget']} band {lo}-{hi}")
    if sorted(c["base"].keys()) != sorted(STATS): err(f"{cid}: base stats keys wrong")
    if not (0 < c["catch"] <= 255): err(f"{cid}: catch {c['catch']} out of range")
    if c["exp_group"] not in GROUPS: err(f"{cid}: bad exp_group")
    g = c["gender"]
    if g != "genderless" and (set(g) != {"m","f"} or abs(g["m"]+g["f"]-100) > 0.01):
        err(f"{cid}: bad gender {g}")
    ab = c["abilities"]
    for slot in ("primary","secondary","hidden"):
        if ab.get(slot) is not None and ab[slot] not in ability_ids:
            err(f"{cid}: unknown ability {ab[slot]!r} in {slot}")
    if ab.get("primary") is None: err(f"{cid}: needs a primary ability")
    if sum(c["ev_yield"].values()) != EVPTS.get(c["budget"], -1):
        err(f"{cid}: ev_yield total {sum(c['ev_yield'].values())} != {EVPTS.get(c['budget'])} for {c['budget']}")
    if not set(c["ev_yield"]) <= set(STATS): err(f"{cid}: bad ev_yield stats")
    if not c["learnset"]: err(f"{cid}: empty learnset")
    last = 0
    for lvl, mv in c["learnset"]:
        if mv not in moves: err(f"{cid}: unknown move {mv!r}")
        if not (1 <= lvl <= 100): err(f"{cid}: bad learn level {lvl}")
        if lvl < last: warn(f"{cid}: learnset not sorted at {mv} ({lvl} after {last})")
        last = max(last, lvl)
    for field in ("name_es","name_en","dex_es","dex_en","design_brief",
                  "silhouette_progression","inspiration"):
        if not c.get(field): err(f"{cid}: missing {field}")
    for field, ln in (("dex_es",200),("dex_en",200)):
        if len(c[field]) > ln: warn(f"{cid}: {field} long ({len(c[field])} chars)")

# evolution graph
for cid, c in ids.items():
    evo = c["evolves_to"]
    if evo:
        if evo["to"] not in ids: err(f"{cid}: evolves to unknown {evo['to']}")
        if evo["method"] not in ("level","confianza"): err(f"{cid}: bad evo method")
        if evo["method"] == "level" and not (1 < evo["level"] <= 64):
            err(f"{cid}: odd evo level {evo.get('level')}")
        tgt = ids.get(evo["to"])
        if tgt and BANDS[tgt["budget"]][0] <= BANDS[c["budget"]][0] and tgt["budget"] != c["budget"]:
            warn(f"{cid} ({c['budget']}) evolves into {evo['to']} ({tgt['budget']}) — downgrade?")

# canon freeze
for cid, (name, types, evo_to) in CANON_FREEZE.items():
    c = ids.get(cid)
    if not c: err(f"canon creature {cid} missing from roster"); continue
    if c["name_es"] != name: err(f"canon {cid}: name {c['name_es']!r} != {name!r}")
    if c["types"] != types: err(f"canon {cid}: types {c['types']} != frozen {types}")
    actual = c["evolves_to"]["to"] if c["evolves_to"] else None
    if evo_to and actual != evo_to:
        err(f"canon {cid}: shipped evolution to {evo_to} changed to {actual}")
    if cid in CANON_EVO_LEVELS:
        if not c["evolves_to"] or c["evolves_to"].get("level") != CANON_EVO_LEVELS[cid]:
            err(f"canon {cid}: shipped evo level {CANON_EVO_LEVELS[cid]} changed")
if ids.get("trenfantasma") and ids["trenfantasma"]["num"] != 150:
    warn("Tren Fantasma is not dex #150 — intended?")

# legendary sanity
legs = [c["id"] for c in creatures if c["budget"] == "leg"]
for cid in legs:
    if ids[cid]["evolves_to"]: err(f"legendary {cid} must not evolve")

# ——— encounters ———
map_by_id = {m["id"]: m for m in maps}
expected = {m["encounters"] for m in maps if m.get("encounters")}
tables = encfile["tables"]
missing = expected - set(tables)
extra = set(tables) - expected
if missing: err(f"encounter tables missing for: {sorted(missing)}")
if extra: err(f"encounter tables with no map ref: {sorted(extra)}")
for key, tab in tables.items():
    if tab["kind"] not in KINDS: err(f"{key}: bad kind {tab['kind']}")
    w = sum(s["w"] for s in tab["slots"])
    if w != 100: err(f"{key}: slot weights sum {w} != 100")
    def check_slots(slots, where):
        for s in slots:
            if s["id"] not in ids: err(f"{key}{where}: unknown species {s['id']}")
            if not (1 <= s["min"] <= s["max"] <= 100): err(f"{key}{where}: bad levels {s}")
            c = ids.get(s["id"])
            if c:
                pre = [p for p in ids.values()
                       if p["evolves_to"] and p["evolves_to"]["to"] == s["id"]
                       and p["evolves_to"]["method"] == "level"]
                for p in pre:
                    if s["min"] < p["evolves_to"]["level"]:
                        warn(f"{key}{where}: {s['id']} spawns at L{s['min']} below its evo level {p['evolves_to']['level']}")
    check_slots(tab["slots"], "")
    for tier, rows in tab.get("fishing", {}).items():
        if tier not in ("viejo","bueno","super"): err(f"{key}: bad fishing tier {tier}")
        if sum(s["w"] for s in rows) != 100: err(f"{key}/fishing.{tier}: weights != 100")
        check_slots(rows, f"/fishing.{tier}")
for s in encfile["static"] + encfile["gifts"]:
    if s["id"] not in ids: err(f"static/gift: unknown species {s['id']}")
    if s["map"] not in map_by_id: err(f"static/gift {s['id']}: unknown map {s['map']}")
for r in encfile["roaming"]:
    if r["id"] not in ids: err(f"roaming: unknown species {r['id']}")
    if r["region"] not in REGIONS: err(f"roaming {r['id']}: unknown region")

# every species must be obtainable: wild, fishing, static, gift, roaming, or evolution
obtainable = set()
for tab in tables.values():
    obtainable |= {s["id"] for s in tab["slots"] if s["w"] > 0}
    for rows in tab.get("fishing", {}).values(): obtainable |= {s["id"] for s in rows}
obtainable |= {s["id"] for s in encfile["static"] + encfile["gifts"] + encfile["roaming"]}
changed = True
while changed:
    changed = False
    for c in creatures:
        if c["id"] in obtainable and c["evolves_to"] and c["evolves_to"]["to"] not in obtainable:
            obtainable.add(c["evolves_to"]["to"]); changed = True
unobtainable = set(ids) - obtainable
if unobtainable: err(f"species not obtainable anywhere: {sorted(unobtainable)}")

# ——— report ———
tc = Counter()
for c in creatures:
    for t in c["types"]: tc[t] += 1
print(f"creatures: {len(creatures)} | abilities: {len(abilities)} | tables: {len(tables)} "
      f"(+{len(encfile['static'])} static, {len(encfile['gifts'])} gifts, {len(encfile['roaming'])} roaming)")
print("type spread:", ", ".join(f"{t}:{n}" for t, n in sorted(tc.items())))
print("budgets:", dict(Counter(c["budget"] for c in creatures)))
for w in warnings: print("WARN:", w)
if errors:
    for e in errors: print("ERROR:", e)
    sys.exit(f"{len(errors)} error(s)")
print(f"OK — bestiario contract holds ({len(warnings)} warnings).")
