import SwiftUI

enum MetroData {
    static let lines: [MetroLine] = [
        makeLine(
            id: "L1",
            number: "1",
            name: "Propatria ↔ Palo Verde",
            displayName: "Línea 1 Roja",
            accent: Color(hex: 0xE83B3B),
            darkAccent: Color(hex: 0x8C1E2C),
            stationNames: [
                "Propatria", "Pérez Bonalde", "Plaza Sucre", "Gato Negro", "Agua Salud", "Caño Amarillo", "Capitolio", "La Hoyada", "Parque Carabobo", "Bellas Artes", "Colegio de Ingenieros", "Plaza Venezuela", "Sabana Grande", "Chacaíto", "Chacao", "Altamira", "Miranda", "Los Dos Caminos", "Los Cortijos", "La California", "Petare", "Palo Verde"
            ],
            transfers: [
                "Capitolio": ["L2"],
                "Plaza Venezuela": ["L3"],
                "Miranda": ["L5"]
            ],
            plannedStations: [],
            routeNote: "The backbone east-west ride under Caracas, from Propatria to Palo Verde."
        ),
        makeLine(
            id: "L2",
            number: "2",
            name: "El Silencio ↔ Las Adjuntas / Zoológico",
            displayName: "Línea 2 Verde",
            accent: Color(hex: 0x35B96F),
            darkAccent: Color(hex: 0x1C7045),
            stationNames: [
                "El Silencio", "Capuchinos", "Maternidad", "Artigas", "La Paz", "La Yaguara", "Carapita", "Antímano", "Mamera", "Ruiz Pineda", "Caricuao", "Zoológico", "Las Adjuntas"
            ],
            transfers: [
                "El Silencio": ["L1"],
                "Capuchinos": ["L4"],
                "Las Adjuntas": ["Los Teques"]
            ],
            plannedStations: [],
            routeNote: "West-side branch service through Caricuao, splitting toward Zoológico and Las Adjuntas."
        ),
        makeLine(
            id: "L3",
            number: "3",
            name: "Plaza Venezuela ↔ La Rinconada",
            displayName: "Línea 3 Azul",
            accent: Color(hex: 0x3C7DFF),
            darkAccent: Color(hex: 0x214C9F),
            stationNames: [
                "Plaza Venezuela", "Ciudad Universitaria", "Los Símbolos", "La Bandera", "El Valle", "Los Jardines", "Coche", "Mercado", "La Rinconada"
            ],
            transfers: [
                "Plaza Venezuela": ["L1"],
                "El Valle": ["L3 branch"]
            ],
            plannedStations: [],
            routeNote: "A north-south ride from Plaza Venezuela to the rail terminal at La Rinconada."
        ),
        makeLine(
            id: "L4",
            number: "4",
            name: "Zona Rental ↔ Capuchinos",
            displayName: "Línea 4 Amarilla",
            accent: Color(hex: 0xFFD447),
            darkAccent: Color(hex: 0xB87816),
            stationNames: [
                "Zona Rental", "Parque Central", "Nuevo Circo", "Teatros", "Capuchinos"
            ],
            transfers: [
                "Zona Rental": ["L3", "L5"],
                "Capuchinos": ["L2"]
            ],
            plannedStations: [],
            routeNote: "A short central connector under the theater district and Parque Central towers."
        ),
        makeLine(
            id: "L5",
            number: "5",
            name: "Zona Rental ↔ Bello Monte",
            displayName: "Línea 5 Morada",
            accent: Color(hex: 0x9B5CFF),
            darkAccent: Color(hex: 0x5B329E),
            stationNames: [
                "Zona Rental", "Bello Monte"
            ],
            transfers: [
                "Zona Rental": ["L4", "L3"]
            ],
            plannedStations: ["Las Mercedes", "Tamanaco", "Chuao", "Bello Campo", "Miranda"],
            routeNote: "Currently playable as the open Bello Monte shuttle, with the planned eastward stations marked on the map."
        )
    ]

    static let npcs: [MetroNPC] = [
        MetroNPC(id: "empanada-queen", name: "Mariela", role: "Empanada vendor", stationName: "Capitolio", lineID: "L1", palette: Color(hex: 0xFFB84D), dialogue: "Mi amor, if you can transfer without losing your ticket, you earn the crispy cheese empanada."),
        MetroNPC(id: "vinyl-dj", name: "DJ Chacao", role: "Cassette collector", stationName: "Chacao", lineID: "L1", palette: Color(hex: 0x61D6FF), dialogue: "Every platform has a rhythm. Listen for the doors before the beat drops."),
        MetroNPC(id: "avila-runner", name: "Tere del Ávila", role: "Mountain runner", stationName: "Altamira", lineID: "L1", palette: Color(hex: 0x71E05F), dialogue: "From here the mountain watches the whole city. Keep your route clean, chamo."),
        MetroNPC(id: "mechanic", name: "Elio", role: "Train mechanic", stationName: "Las Adjuntas", lineID: "L2", palette: Color(hex: 0xA6F25D), dialogue: "The west branch forks like a rail puzzle. Pick Zoológico for adventure, Adjuntas for legends."),
        MetroNPC(id: "student", name: "Nayibe", role: "UCV architecture student", stationName: "Ciudad Universitaria", lineID: "L3", palette: Color(hex: 0x78A6FF), dialogue: "The campus mosaics are like map tiles. Move one square at a time and the city opens."),
        MetroNPC(id: "theater-ghost", name: "Don Candilejas", role: "Theater usher", stationName: "Teatros", lineID: "L4", palette: Color(hex: 0xFFE66D), dialogue: "Your train is the curtain. When it opens, step onto the stage."),
        MetroNPC(id: "skater", name: "Sofi", role: "Bello Monte skater", stationName: "Bello Monte", lineID: "L5", palette: Color(hex: 0xC188FF), dialogue: "Line Five is small now, but every unfinished tunnel dreams big."),
        MetroNPC(id: "map-keeper", name: "Señor Riel", role: "Metro map keeper", stationName: "Plaza Venezuela", lineID: "L1", palette: Color(hex: 0xFF6B6B), dialogue: "Plaza Venezuela is where routes shake hands. Choose the line color, not just the name."),
        MetroNPC(id: "percussionist", name: "Beto Tambor", role: "Street percussionist", stationName: "Parque Central", lineID: "L4", palette: Color(hex: 0xF7D64A), dialogue: "If the wheels go ta-ka ta-ka, you're close to a transfer."),
        MetroNPC(id: "market-auntie", name: "Tía Mercedes", role: "Market guide", stationName: "Mercado", lineID: "L3", palette: Color(hex: 0xFF9270), dialogue: "A good rider knows when to sit, when to stand, and when to ask directions."),
        MetroNPC(id: "book-kid", name: "Luisito", role: "Sticker trader", stationName: "Petare", lineID: "L1", palette: Color(hex: 0x54E5B8), dialogue: "I trade station stickers. Palo Verde is rare if you arrive with full energy."),
        MetroNPC(id: "zoo-guard", name: "Yara", role: "Zoológico keeper", stationName: "Zoológico", lineID: "L2", palette: Color(hex: 0x63C769), dialogue: "Last stop smells like trees. The parrots know the schedule better than us."),
        MetroNPC(id: "terminal-scout", name: "Omar", role: "Terminal scout", stationName: "La Rinconada", lineID: "L3", palette: Color(hex: 0x4FA3FF), dialogue: "End of the blue line. Big trips begin when the rails run out."),
        MetroNPC(id: "signal-tech", name: "Kika", role: "Signal technician", stationName: "Zona Rental", lineID: "L4", palette: Color(hex: 0xFDDC5C), dialogue: "Yellow, purple, blue: this hub is a switchboard. Watch the signs before boarding."
        )
    ]

    static var allStations: [MetroStation] {
        lines.flatMap(\.stations)
    }

    static func line(for id: String) -> MetroLine {
        lines.first { $0.id == id } ?? lines[0]
    }

    static func npc(at station: MetroStation) -> MetroNPC? {
        npcs.first { $0.stationName == station.name && $0.lineID == station.lineID }
    }

    static func transferLines(from station: MetroStation) -> [MetroLine] {
        station.transferLineIDs.compactMap { transferID in
            lines.first { $0.id == transferID }
        }
    }

    private static func makeLine(
        id: String,
        number: String,
        name: String,
        displayName: String,
        accent: Color,
        darkAccent: Color,
        stationNames: [String],
        transfers: [String: [String]],
        plannedStations: [String],
        routeNote: String
    ) -> MetroLine {
        let stations: [MetroStation] = stationNames.enumerated().map { offset, stationName in
            let transferLineIDs: [String] = transfers[stationName] ?? []
            return MetroStation(
                id: "\(id)-\(stationName)",
                name: stationName,
                lineID: id,
                index: offset,
                isTransfer: !transferLineIDs.isEmpty,
                transferLineIDs: transferLineIDs,
                isOperational: true
            )
        }

        return MetroLine(
            id: id,
            number: number,
            name: name,
            displayName: displayName,
            accent: accent,
            darkAccent: darkAccent,
            stations: stations,
            plannedStations: plannedStations,
            routeNote: routeNote
        )
    }
}
