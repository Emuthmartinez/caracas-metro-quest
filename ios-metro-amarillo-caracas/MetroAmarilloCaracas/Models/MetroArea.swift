import Foundation

/// The zone of Caracas visible through the window as the train passes a station.
/// Each maps to a looping ride video (Higgsfield-generated). Most of the metro is
/// underground, but the game shows the neighborhood *above* each station — the
/// city the train is dreaming as it tunnels under it.
enum MetroArea: String {
    case tunnel
    case centro
    case sabanagrande
    case este
    case petare
    case oeste
    case sur
    case phantom

    /// Bundled mp4 resource name (without extension).
    var videoResource: String {
        switch self {
        case .sur:          return "ride_loop"          // original base frame: Ávila + southern valley
        case .tunnel:       return "ride_tunnel"
        case .centro:       return "ride_centro"
        case .sabanagrande: return "ride_sabanagrande"
        case .este:         return "ride_este"
        case .petare:       return "ride_petare"
        case .oeste:        return "ride_oeste"
        case .phantom:      return "ride_phantom"
        }
    }

    static func area(forStationID id: String) -> MetroArea {
        areaByStationID[id] ?? .tunnel
    }

    static func videoResource(forStationID id: String) -> String {
        area(forStationID: id).videoResource
    }

    private static let areaByStationID: [String: MetroArea] = {
        var map: [String: MetroArea] = [:]
        func set(_ line: String, _ area: MetroArea, _ stations: [String]) {
            for station in stations { map["\(line)-\(station)"] = area }
        }

        // Línea 1 — west → center → boulevard → modern east → Petare
        set("L1", .oeste,        ["Propatria", "Pérez Bonalde", "Plaza Sucre", "Gato Negro"])
        set("L1", .centro,       ["Agua Salud", "Caño Amarillo", "Capitolio", "La Hoyada", "Parque Carabobo", "Bellas Artes"])
        set("L1", .sabanagrande, ["Colegio de Ingenieros", "Plaza Venezuela", "Sabana Grande", "Chacaíto"])
        set("L1", .este,         ["Chacao", "Altamira", "Miranda", "Los Dos Caminos"])
        set("L1", .petare,       ["Los Cortijos", "La California", "Petare", "Palo Verde"])

        // Línea 2 — center → working-class west / aerial
        set("L2", .centro,       ["El Silencio", "Capuchinos"])
        set("L2", .oeste,        ["Maternidad", "Artigas", "La Paz", "La Yaguara", "Carapita", "Antímano", "Mamera", "Ruiz Pineda", "Caricuao", "Zoológico", "Las Adjuntas"])

        // Línea 3 — Salvo's southern valley
        set("L3", .sabanagrande, ["Plaza Venezuela"])
        set("L3", .sur,          ["Ciudad Universitaria", "Los Símbolos", "La Bandera", "El Valle", "Los Jardines", "Coche", "Mercado", "La Rinconada"])

        // Línea 4 — central theaters / Parque Central towers
        set("L4", .centro,       ["Capuchinos", "Teatros", "Nuevo Circo", "Parque Central"])
        set("L4", .sabanagrande, ["Zona Rental"])

        // Línea 5 — the frozen line. Bello Monte looks out on what was never built.
        set("L5", .sabanagrande, ["Zona Rental"])
        set("L5", .phantom,      ["Bello Monte"])

        return map
    }()
}
