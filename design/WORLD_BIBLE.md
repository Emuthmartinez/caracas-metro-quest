# Caracas Metro Quest — World Bible

This folder is the **design source of truth** for the game's world. It is *reference data*, not app code — the kind of thing studios keep as a world/story bible plus data-driven content files. Edit these JSON files to change the world, then regenerate the Swift (`MetroData.npcs`) from `npcs.json`.

## Files

- **`areas.json`** — the 7 zones the metro passes through. Each: real description, architecture, street life, who's there & how they dress, a hex palette, the zone's authentic soundscape, mood, visual motifs, and research sources. These drive the per-zone ride videos (`Resources/ride_<area>.mp4`), the per-zone audio rumble tint, and the honesty of each NPC's look.

- **`npcs.json`** — all 48 NPCs (ambient, no quests). Each: identity, station/line, area, the matter-of-fact magical-realism premise, a 2–3 line caraqueño `dialoguePool`, and a composable `visual` (build/skin/hair/headwear/prop) with a one-line note on why that look is honest to the character and zone.

- **`WORLD_BIBLE.md`** — this file.

## How NPC sprites work (composable, data-driven)

No NPC is hand-drawn. `Views/PixelNPCView.swift` *composes* a pixel sprite from a small fixed vocabulary, and each character's choices live in `npcs.json` → `visual`:

```
build:    child | adult | elder | heavy
skin:     light | medium | brown | dark
hair:     short | long | bun | bald | gray | curly
headwear: none | cap | sombrero | panuelo | beret | hardhat | veil | feathers | conductor | crown | scarf | hood
prop:     none | flute | cuatro | tickets | newspaper | candle | wrench | briefcase | cane | basket | bird | book | broom | shoeBrush | guitar | sack
```

To add/change a character: edit `npcs.json`, then re-run the generator that splices `static let npcs` into `Models/MetroData.swift` (it joins identity + dialogue + visual). Keep one NPC per (station, line).

## The zones

### centro — Centro Histórico / El Silencio / Parque Central

- **Is:** The colonial and early-modernist core of Caracas, running roughly west-to-east from the twin Torres del Centro Simón Bolívar (1954) at El Silencio through Plaza Bolívar, the Capitolio Federal, the Panteón Nacional, the Teatro Municipal (1881) and Teatro Nacional (1905), the decaying Nuevo Circo bullring (1919, closed 1997), and terminating at the Parque Central complex (completed 1983), the twin 225-m octagonal brutalist towers once tallest in Latin America, one still fire-scarred from the October 2004 blaze that gutted floors 34–50. Avenida Bolívar (2 km, opened 1949) is the spine — a wide…

- **People & dress:** Overwhelmingly working-class and lower-middle-class Venezuelan mestizo population — the product of centuries of mixing among Spanish colonial settlers, Indigenous peoples, and West African enslaved people. The majority is racially mixed (mestizo/mulato), with significant Afro-Venezuelan presence, plus a smaller stratum of lighter-skinned office workers in the government buildings. Ages skew…

- **Soundscape:** Metro trains rumbling under the pavement with a distinctive squeal on curves (Line 1 at La Hoyada/Capitolio is among the busiest sections in the system). The warning chime and recorded voice announcements of metro station doors. Diesel buses accelerating and braking on Avenida Bolívar and…

- **Palette:** #C8A96E #4A6741 #8C7156 #D4C4A0 #3D3D3D #B5300A  ·  **Mood:** Heavy, layered, slightly oppressive during peak heat (Caracas sits at 900 m elevation but the concrete valley traps heat

- **NPCs (11):** Doña Perpetua Salcedo (heavy/tickets), Licenciado Eleazar Marcano (adult/briefcase), Nena Castrillo (adult/basket), Profesor Remigio Urdaneta (elder/newspaper), Xiomara Pietrantoni (adult/flute), Profesor Gilberto (elder/book), Gastón 'El Gato' Montilla (adult/guitar), Hermana Dolores de la Providencia (elder/candle), Celestino Arriechi (adult/tickets), Ernesto 'Tigre' Bracho (adult/none), Wilmer Ochoa (adult/book)

### sabanagrande — Sabana Grande y Plaza Venezuela

- **Is:** A dense, mixed-use corridor in west-central Caracas (Parroquia El Recreo, Municipio Libertador) anchored by two very different poles. Plaza Venezuela (inaugurated 1940, renovated 2007–2009) is a major traffic roundabout and public square at the geographic heart of the city, famous for its Fuente Venezuela — a 50-metre illuminated pool with 574 LED luminaries, 260 jets, and a soundtrack; at night it cycles through 16 million color combinations. The Zona Rental station (Lines 4 and 5, opened 2006/2015) occupies a planned mixed-use zone between Plaza Venezuela and Parque Central, rezoned for…

- **People & dress:** The zone is socioeconomically layered: no single class owns it. The bulk of daily pedestrians are lower-middle and working class mestizo Caraqueños — arriving from Catia and Petare via metro. Mestizo (mixed European/Indigenous/African) is by far the dominant phenotype in Caracas, roughly mirroring national figures: ~51% mestizo, ~43% white or Arab-descended, ~4% Afro-Venezuelan, ~2% indigenous.…

- **Soundscape:** Vendor calls (pregones): shouted single words — 'chicha', 'agua', 'empanadas' — layered continuously. Reggaeton and salsa blasting from competing CD stalls, each store trying to drown the next. Metro PA announcements drifting up through grates and exits (female voice, same clip for 40 years on Line…

- **Palette:** #C4884A #3B6B8C #2C2C2C #D4C59A #8B1A1A #5E8B3F  ·  **Mood:** Compressed, relentless, layered. Not dangerous-feeling to the accustomed eye but never relaxed — the street is working a

- **NPCs (5):** Félix Rodríguez Amaral (elder/briefcase), Marisol Torrealba (adult/tickets), Yuneixi Marcano (adult/book), Ernesto Oquendo (adult/newspaper), Reinaldo (elder/none)

### este — El Este: Chacao & Altamira

- **Is:** Chacao municipality (13 km², pop. ~64,600 in 2001) is Caracas's smallest but wealthiest borough — a planned 1940s garden-city district that has become the city's primary financial, diplomatic, and upper-class residential corridor. The L1 stations Chacao, Altamira, Miranda, and Los Dos Caminos thread through it along Av. Francisco de Miranda. Altamira, the neighborhood's symbolic heart, was master-planned by developer Luis Roche from 1944 onward using a North American garden-suburb model: curved low-density streets adapting to the sloping topography, broad tree-lined avenues, grass verges, and…

- **People & dress:** Racial composition is the most distinctive feature of this zone relative to the rest of Caracas. Eastern Caracas registers 65-80% white-identifying Venezuelans — the highest concentration in the country — versus a city average that is majority mestizo/pardo. This correlates directly with class: Venezuela's post-WWII European immigration (Italian, Portuguese, Spanish, German, plus Lebanese and…

- **Soundscape:** Constant low roar of Av. Francisco de Miranda traffic — denser and more car-dominant than bus-dominated western Caracas; car horns are frequent but not the frantic layering of the city center. Motorcycle engines (both courier bikes and PoliChacao motorbikes) cut through at higher pitch. Metro…

- **Palette:** #87CEEB #D4C5A9 #4A4A4A #2E6B3E #F5F0E8 #B8860B  ·  **Mood:** Contained prosperity under visible strain. The zone carries the performative order of a Latin American affluent district

- **NPCs (4):** La Guacamaya de Chacao (adult/bird), Reinaldo Blanco (elder/newspaper), Donatella Figueroa de Rossi (elder/basket), Luisito el de Los Dos Caminos (adult/none)

### petare — Petare & the Eastern Terminus

- **Is:** This four-station eastern tail of Line 1 passes through three distinct urban registers before terminating at Palo Verde. Los Cortijos is Caracas's mid-century industrial belt: a dense grid of factories, warehouses, and office parks laid between Avenida Francisco de Miranda and the Francisco Fajardo expressway, anchored by the original 1951 Cervecería Polar plant and a concentration of logistics and manufacturing firms whose blind concrete facades turn their backs to the street. La California is a transitional residential-commercial strip — urbanizaciones of 1950s-60s apartment blocks and…

- **People & dress:** The population is overwhelmingly working-class and lower-income mestizo, with a significant Afro-Venezuelan and Afro-Caribbean minority — Caracas concentrates its black population in barrios specifically including Petare. Skin tones are predominantly medium to dark brown (the self-identification terms in use are moreno/morena and negro/negra; phenotypically the mix is heavy African and indigenous…

- **Soundscape:** The Petare metro station exit produces a continuous low roar of crowd noise — the press of thousands of daily commuters on a narrow concourse — punctuated by vendors calling their prices (arepas, empanadas, teléfono, recarga) in sharp short shouts. Honda 125cc mototaxi engines rev and idle, their…

- **Palette:** #B5472A #8C8071 #4A7C6F #D4A535 #2E3A2F #C9C0B0  ·  **Mood:** Relentlessly alive and high-density during daylight; the dominant register is functional urgency — people moving fast wi

- **NPCs (4):** Doña Esperanza (elder/basket), Marisol (elder/book), Luisito (child/newspaper), Remigio (adult/wrench)

### oeste — El Oeste Popular — Metro Línea 2

- **Is:** This is the working-class and lower-income western spine of Caracas, stretching from the densely commercial Catia district (Parroquia Sucre, 393,619 inhabitants — the most populous parish in the city) through the valley of Antímano (214,437 inhabitants), past the ruined industrial corridor of La Yaguara and Carapita, and out to Caricuao: the largest single public-housing complex ever built in Venezuela and arguably in Latin America, with roughly 23,540 apartments in 219 buildings housing around 138,659 people as of 2011. Metro Line 2 (inaugurated 4 October 1987, 13 stations, 26.5 km) is the…

- **People & dress:** The population is overwhelmingly working class and lower income, predominantly mestizo (mixed Indigenous-Spanish-African), with a higher-than-city-average concentration of Afro-Venezuelan residents — consistent with national patterns placing Afro-descendant urban populations in western Caracas barrios. National demographic baseline: approximately 67% mestizo, 8% Afro-descendant, with European and…

- **Soundscape:** The defining sound layer is the Metro Line 2 viaduct: a steel wheel-on-rail screech and low-frequency rumble that passes overhead every 3–5 minutes during peak hours, audible 200m away and felt as vibration in nearby buildings. Underneath and between trains: mototaxis — high-pitched 150cc…

- **Palette:** #C9733A #A8B5A2 #4A4A4A #D4A843 #7B3F2E #2E4A3A  ·  **Mood:** Heavy and functional by day; the zone has the density and purposefulness of a city that has no choice but to work. Not p

- **NPCs (15):** Doña Mireya (heavy/basket), Edgarcito (child/none), Don Temístocles (elder/shoeBrush), Consuelo (adult/newspaper), Eloísa Troconis (elder/none), Gladys (adult/bird), Roberto (adult/wrench), Belkis la Correa (adult/candle), Néstorino (elder/none), Petra Villamizar (adult/candle), Franklyn "Mamera" (adult/none), Xuxa Marcano (adult/basket), Yara (adult/bird), Lucho el Flaco (adult/wrench), Señor Transbordo (elder/sack)

### sur — The Southern Valley — Línea 3

- **Is:** The Line 3 corridor is the spine of working-class and lower-middle-class Caracas, running south-west from the edge of the central valley through a series of dense residential parishes (El Valle, Los Jardines de El Valle, Coche) before terminating at the mid-century modernist hippodrome complex. The zone occupies the southern flanks of the Caracas valley where the mountains rise steeply behind the informal hillside settlements (cerros), cut through by the Avenida Intercomunal de El Valle and the Valle-Coche expressway. It contains two poles of exceptional architectural ambition — the…

- **People & dress:** The dominant demographic is moreno/mestizo Venezuela: the great majority of residents and workers are of mixed African, Indigenous, and European ancestry, reflecting Venezuela's national profile (~68% mestizo, ~10% afrodescendiente in the lower-income urban south, with the west and south of Caracas concentrating more Afro-Venezuelan presence historically). Skin tones range from light brown to…

- **Soundscape:** Pre-dawn: the Mercado de Coche generates a rumbling bass layer — diesel trucks idling, handcarts rattling over concrete, shouted wholesale prices, the slap of crates. Morning rush: the overriding sound is the por puesto and bus horn — not polite beeping but extended, aggressive blasts from aging…

- **Palette:** #C4843A #7A9E6E #D4C49A #3B5A8A #8C3A2A #E8D9B0  ·  **Mood:** Functional, dense, un-glamorous, and quietly proud. This is the working machinery of Caracas — the zone that feeds the c

- **NPCs (8):** Profesora Remedios Altamirano (elder/book), Kendry 'El Símbolo' (child/none), Doña Esperanza Briceño (heavy/basket), Tío Ramoncito (adult/cuatro), Abuela Teresita Pugliese-Montoya (elder/candle), El Obrero Heliodoro (adult/wrench), Yara Sequera (adult/basket), Lisandro Pimentel (adult/newspaper)

### phantom — La Línea Fantasma (Línea 5 Ghost Corridor)

- **Is:** Caracas Metro Línea 5 is a 7.5 km extension announced by Hugo Chávez on November 3, 2006, contracted to Brazilian firm Odebrecht for USD 5.9 billion (FONDEN-financed). It was supposed to link Zona Rental (on Line 4 at Plaza Venezuela) southeast through six new stations — Bello Monte, Las Mercedes, Tamanaco, Chuao, Bello Campo, and Parque del Este — with a projected opening of 2011, revised to 2014, then 2016. In practice: only two stations are operational. Zona Rental opened with Line 4; Bello Monte opened November 4, 2015 as the sole Line 5 station, 40 meters underground on a single…

- **People & dress:** Three overlapping populations. Population 1 (Wealthy / Dollarized class, 20–45 years old): Concentrated in Las Mercedes, upper Chuao, and Bello Campo residential streets. Skews lighter-skinned (eastern Caracas white population estimated at 65–80% per Venezuelan census patterns, versus ~44% nationally). Men in fitted button-downs or polo shirts, dark jeans or chinos, leather sneakers or loafers;…

- **Soundscape:** The dominant layer is constant: the Francisco Fajardo / Cacique Guaicaipuro autopista roar — a continuous 70+ dB wall of vehicle noise, lorries, motorbikes, and the occasional horn. This permeates every site in the corridor. At the Bello Monte station entrance: the metallic hiss and rattle of the…

- **Palette:** #C8A96E #5C7A3E #B85C2A #2B2B2B #D4C4A0 #6B8FA8  ·  **Mood:** Asymmetric present tense — luxury and rot sharing the same street. The ghost corridor reads as a monument to a promise t

- **NPCs (1):** Yaritza (adult/tickets)
