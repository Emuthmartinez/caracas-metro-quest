#!/usr/bin/env python3
"""Generate data/maps/maps.json from the line definitions below.

Edit THESE definitions, never the JSON by hand (world-bible.md §11).
Run: python3 scripts/gen_maps.py
"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "maps", "maps.json")

DIMS = {"station": (40, 24), "tunnel": (80, 12), "surface": (48, 32),
        "interior": (20, 14), "cable": (24, 16), "ghost": (40, 24)}

# Lines: ordered list of (slug, name_es, name_en, opts). Tunnels are generated
# between consecutive stops; "features" on a stop attach to the tunnel that
# ARRIVES at it (paradas menores passed on the way, weather zones, etc.).
LINES = {
    "linea1": {
        "tileset": "ts.linea1",
        "stops": [
            ("propatria", "Propatria", "Propatria", {}),
            ("canoamarillo", "Caño Amarillo", "Caño Amarillo", {"feat": [
                ("parada_menor", "perezbonalde", "Pérez Bonalde"),
                ("parada_menor", "plazasucre", "Plaza Sucre"),
                ("parada_menor", "gatonegro", "Gato Negro"),
                ("parada_menor", "aguasalud", "Agua Salud")]}),
            ("capitolio", "Capitolio", "Capitolio", {}),
            ("bellasartes", "Bellas Artes", "Bellas Artes", {"feat": [
                ("parada_menor", "lahoyada", "La Hoyada"),
                ("parada_menor", "parquecarabobo", "Parque Carabobo")]}),
            ("plazavenezuela", "Plaza Venezuela", "Plaza Venezuela", {"feat": [
                ("parada_menor", "colegiodeingenieros", "Colegio de Ingenieros")]}),
            ("sabanagrande", "Sabana Grande", "Sabana Grande", {}),
            ("chacaito", "Chacaíto", "Chacaíto", {}),
            ("altamira", "Altamira", "Altamira", {"feat": [
                ("parada_menor", "chacao", "Chacao")]}),
            ("petare", "Petare", "Petare", {"feat": [
                ("parada_menor", "miranda", "Miranda (Parque del Este)"),
                ("parada_menor", "losdoscaminos", "Los Dos Caminos"),
                ("parada_menor", "loscortijos", "Los Cortijos"),
                ("parada_menor", "lacalifornia", "La California")]}),
            ("paloverde", "Palo Verde", "Palo Verde", {"minor": True}),
        ],
    },
    "linea2": {
        "tileset": "ts.linea2",
        "stops": [
            ("elsilencio", "El Silencio", "El Silencio", {}),
            ("capuchinos", "Capuchinos", "Capuchinos", {}),
            ("layaguara", "La Yaguara", "La Yaguara", {"feat": [
                ("parada_menor", "maternidad", "Maternidad"),
                ("parada_menor", "artigas", "Artigas"),
                ("parada_menor", "lapaz", "La Paz")]}),
            ("caricuao", "Caricuao", "Caricuao", {"feat": [
                ("parada_menor", "carapita", "Carapita"),
                ("parada_menor", "antimano", "Antímano"),
                ("parada_menor", "mamera", "Mamera"),
                ("weather_zone", "apagon_oeste", "Tramo del Apagón", "apagon")]}),
            ("zoologico", "Zoológico", "Zoológico (Caricuao)", {}),
        ],
        # Branch: Caricuao -> Las Adjuntas (Ruiz Pineda on the way).
        "branches": [("caricuao", [
            ("lasadjuntas", "Las Adjuntas", "Las Adjuntas", {"feat": [
                ("parada_menor", "ruizpineda", "Ruiz Pineda")]}),
        ])],
    },
    "linea3": {
        "tileset": "ts.linea3",
        "stops": [
            ("plazavenezuela", None, None, {"ref": True}),  # existing L1 map
            ("ciudaduniversitaria", "Ciudad Universitaria", "Ciudad Universitaria", {}),
            ("labandera", "La Bandera", "La Bandera", {"feat": [
                ("parada_menor", "lossimbolos", "Los Símbolos")]}),
            ("elvalle", "El Valle", "El Valle", {}),
            ("larinconada", "La Rinconada", "La Rinconada", {"feat": [
                ("parada_menor", "losjardines", "Los Jardines"),
                ("parada_menor", "coche", "Coche"),
                ("parada_menor", "mercado", "Mercado"),
                ("fishing_spot", "quebrada_elvalle", "Quebrada crecida")],
                "gate": "oficio.nado"}),
        ],
    },
    "linea4": {
        "tileset": "ts.linea4",
        "stops": [
            ("capuchinos", None, None, {"ref": True}),  # existing L2 map
            ("teatros", "Teatros", "Teatros", {}),
            ("nuevocirco", "Nuevo Circo", "Nuevo Circo", {"gate": "oficio.demolicion"}),
            ("parquecentral", "Parque Central", "Parque Central", {}),
            ("zonarental", "Zona Rental", "Zona Rental", {"gate": "fichas>=8"}),
        ],
    },
    "linea5": {
        "tileset": "ts.fantasma",
        "stops": [
            ("zonarental", None, None, {"ref": True}),
            ("bellomonte", "Bello Monte", "Bello Monte", {"gate": "flag.bendicion"}),
        ],
        "ghosts": ["lasmercedes", "tamanaco", "chuao", "bellocampo", "miranda_l5"],
        "ghost_names": {"lasmercedes": ("Las Mercedes", "Las Mercedes"),
                        "tamanaco": ("Tamanaco", "Tamanaco"),
                        "chuao": ("Chuao", "Chuao"),
                        "bellocampo": ("Bello Campo", "Bello Campo"),
                        "miranda_l5": ("Miranda", "Miranda")},
    },
    "losteques": {
        "tileset": "ts.losteques",
        "stops": [
            ("lasadjuntas", None, None, {"ref": True}),
            ("aliprimera", "Alí Primera", "Alí Primera", {"gate": "flag.tren_resuelto"}),
            ("guaicaipuro", "Guaicaipuro", "Guaicaipuro", {}),
            ("independencia", "Independencia", "Independencia", {}),
            ("carrizal", "Carrizal", "Carrizal", {"feat": [
                ("parada_menor", "loscerritos", "Los Cerritos")]}),
            ("sanantonio", "San Antonio", "San Antonio de los Altos", {"feat": [
                ("parada_menor", "lasminas", "Las Minas")]}),
        ],
    },
}

CABLES = {
    "metrocable_sanagustin": {
        "tileset": "ts.sanagustin", "dock": "st_parquecentral", "gate": "oficio.teleferico",
        "stops": [("hornosdecal", "Hornos de Cal"), ("laceiba", "La Ceiba"),
                  ("elmanguito", "El Manguito"), ("sanagustin", "San Agustín")],
    },
    "metrocable_mariche": {
        "tileset": "ts.mariche", "dock": "st_paloverde", "gate": "oficio.teleferico",
        "stops": [("mariche", "Mariche")],
    },
}

SURFACES = [  # (id-slug, name_es, name_en, attached station, gate)
    ("calvario", "El Calvario", "El Calvario Park", "st_canoamarillo", "oficio.machete"),
    ("bulevar", "Bulevar de Sabana Grande", "Sabana Grande Boulevard", "st_sabanagrande", None),
    ("caobos", "Parque Los Caobos", "Los Caobos Park", "st_bellasartes", None),
    ("ucv", "Tierra de Nadie (UCV)", "UCV Grounds", "st_ciudaduniversitaria", None),
    ("parquedeleste", "Parque del Este", "Parque del Este", "st_altamira", None),
    ("mercadopetare", "Mercado de Petare", "Petare Market", "st_petare", None),
    ("hipica", "La Hípica Sur", "Southern Hippodrome Grounds", "st_larinconada", None),
    ("puertaavila", "Puerta del Ávila", "Ávila Gateway", "st_altamira", "oficio.machete"),
]

AVILA = [  # chained from sf_puertaavila upward
    ("sabasnieves", "Sabas Nieves", "Sabas Nieves Trail", None),
    ("neblina", "La Neblina", "The Fog Belt", "neblina"),
    ("cumbre", "La Cumbre (Hotel Humboldt)", "The Summit (Hotel Humboldt)", None),
]

INTERIORS = [
    ("casaabuela", "Casa de la Abuela", "Grandma's House", "st_propatria", None),
    ("safari", "Safari del Zoológico", "Zoo Safari", "st_zoologico", None),
    ("latorre", "La Torre", "The Tower (battle facility)", "st_independencia", None),
    ("mercadocirco", "Mercado del Coleccionista", "The Collector's Market", "st_nuevocirco", None),
]

TRANSFERS = [  # (a, b, via, gate)
    ("st_capitolio", "st_elsilencio", "transfer", "fichas>=4"),
    ("st_plazavenezuela", "tn_plazavenezuela__ciudaduniversitaria", "transfer", "fichas>=5"),
    ("st_capuchinos", "tn_capuchinos__teatros", "transfer", "fichas>=7"),
    ("st_zonarental", "tn_zonarental__bellomonte", "gate", "flag.consejo"),
    ("st_lasadjuntas", "tn_lasadjuntas__aliprimera", "gate", "flag.tren_resuelto"),
]

CANON_MAP = {  # new id -> shipped js/world.js id (Act 1 migration)
    "in_casaabuela": "casa", "st_propatria": "propatria",
    "tn_propatria__canoamarillo": "tunel1", "st_canoamarillo": "canoamarillo",
    "tn_canoamarillo__capitolio": "tunel2", "st_capitolio": "capitolio",
    "tn_capitolio__bellasartes": "tunel3", "st_bellasartes": "bellasartes",
    "tn_bellasartes__plazavenezuela": "tunel4", "st_plazavenezuela": "plazavenezuela",
    "tn_plazavenezuela__sabanagrande": "tunel5", "st_sabanagrande": "sabanagrande",
    "tn_sabanagrande__chacaito": "tunel6", "st_chacaito": "chacaito",
    "tn_chacaito__altamira": "tunel7", "st_altamira": "altamira",
    "tn_altamira__petare": "tunel8", "st_petare": "petare",
}


def mk(map_id, mtype, region, name_es, name_en, tileset, music, minor=False,
       features=None, encounters="auto"):
    w, h = DIMS[mtype]
    return {
        "id": map_id, "type": mtype, "region": region,
        "name_es": name_es, "name_en": name_en,
        **({"minor": True} if minor else {}),
        "tileset": tileset,
        "dimensions": {"w": w, "h": h},
        "connections": [],
        "features": features or [],
        "encounters": (f"enc.{map_id}" if encounters == "auto" else encounters),
        "npcs": [], "events": [],
        "music": music,
    }


def feat(entries):
    out = []
    for e in entries:
        kind, slug, name = e[0], e[1], e[2]
        f = {"kind": kind, "id": slug, "name_es": name}
        if kind == "weather_zone":
            f["weather"] = e[3]
        out.append(f)
    return out


def connect(maps, a, b, via, gate=None):
    ma, mb = maps[a], maps[b]
    ma["connections"].append({"to": b, "via": via, "gate": gate})
    mb["connections"].append({"to": a, "via": via, "gate": gate})


def main():
    maps = {}

    for region, line in LINES.items():
        ts = line["tileset"]
        seqs = [line["stops"]]
        for origin, branch in line.get("branches", []):
            seqs.append([(origin, None, None, {"ref": True})] + branch)
        for seq in seqs:
            prev = None
            for slug, name_es, name_en, opts in seq:
                sid = f"st_{slug}"
                if not opts.get("ref"):
                    maps[sid] = mk(sid, "station", region, f"Estación {name_es}",
                                   f"{name_en} Station", ts,
                                   f"mus.{region}.station",
                                   minor=opts.get("minor", False),
                                   encounters=None)
                if prev:
                    tid = f"tn_{prev}__{slug}"
                    maps[tid] = mk(tid, "tunnel", region,
                                   f"Túnel {prev}–{slug}", f"Tunnel {prev}–{slug}",
                                   ts, f"mus.{region}.tunnel",
                                   features=feat(opts.get("feat", [])))
                    connect(maps, f"st_{prev}", tid, "walk")
                    connect(maps, tid, sid, "walk", opts.get("gate"))
                prev = slug
        for g in line.get("ghosts", []):
            gid = f"gh_{g}"
            es, en = line["ghost_names"][g]
            maps[gid] = mk(gid, "ghost", region, f"Estación fantasma {es}",
                           f"Ghost station {en}", line["tileset"],
                           f"mus.{region}.ghost")
        ghosts = line.get("ghosts", [])
        if ghosts:
            chain = ["st_bellomonte"] + [f"gh_{g}" for g in ghosts]
            for a, b in zip(chain, chain[1:]):
                tid = f"tn_{a[3:]}__{b[3:]}"
                maps[tid] = mk(tid, "tunnel", region, f"Vía muerta {a[3:]}–{b[3:]}",
                               f"Dead track {a[3:]}–{b[3:]}", line["tileset"],
                               f"mus.{region}.tunnel")
                connect(maps, a, tid, "walk")
                connect(maps, tid, b, "walk")

    for region, cab in CABLES.items():
        prev = cab["dock"]
        for slug, name in cab["stops"]:
            cid = f"cb_{slug}"
            maps[cid] = mk(cid, "cable", region, f"Estación {name}",
                           f"{name} Cable Station", cab["tileset"],
                           f"mus.{region}.cable")
            connect(maps, prev, cid, "cable", cab["gate"])
            prev = cid

    for slug, es, en, station, gate in SURFACES:
        sid = f"sf_{slug}"
        maps[sid] = mk(sid, "surface", "superficie", es, en, "ts.superficie",
                       "mus.superficie.day")
        connect(maps, station, sid, "warp", gate)

    prev = "sf_puertaavila"
    for slug, es, en, weather in AVILA:
        aid = f"sf_{slug}"
        features = ([{"kind": "weather_zone", "id": f"wz_{slug}",
                      "name_es": es, "weather": weather}] if weather else [])
        maps[aid] = mk(aid, "surface", "avila", es, en, "ts.avila",
                       "mus.avila.trail", features=features)
        gate = "oficio.teleferico" if slug == "cumbre" else None
        connect(maps, prev, aid, "walk", gate)
        prev = aid

    for slug, es, en, station, gate in INTERIORS:
        iid = f"in_{slug}"
        maps[iid] = mk(iid, "interior", maps[station]["region"], es, en,
                       "ts.interior", "mus.interior.default",
                       encounters=("auto" if slug == "safari" else None))
        connect(maps, station, iid, "warp", gate)

    for a, b, via, gate in TRANSFERS:
        connect(maps, a, b, via, gate)

    out = {
        "schema_version": 1,
        "generated_by": "scripts/gen_maps.py",
        "canon_map": CANON_MAP,
        "maps": sorted(maps.values(), key=lambda m: m["id"]),
    }
    with open(os.path.abspath(OUT), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")

    by_type = {}
    for m in maps.values():
        by_type[m["type"]] = by_type.get(m["type"], 0) + 1
    print(f"wrote {len(maps)} maps -> {os.path.relpath(os.path.abspath(OUT))}")
    print(by_type)
    # Reachability check from casa de la abuela (gates ignored: they open in story).
    seen, stack = set(), ["in_casaabuela"]
    while stack:
        cur = stack.pop()
        if cur in seen:
            continue
        seen.add(cur)
        stack += [c["to"] for c in maps[cur]["connections"]]
    unreachable = sorted(set(maps) - seen)
    print("unreachable:", unreachable or "none")


if __name__ == "__main__":
    main()
