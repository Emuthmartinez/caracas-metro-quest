import SwiftUI

/// Salvatore "Salvo" — the player character.
///
/// An Italian-Venezuelan focaccia baker who runs a tiny home business out of
/// Los Jardines del Valle (a real neighborhood in the El Valle parish, served
/// by Línea 3). His grandfather brought the focaccia recipe over from Puglia;
/// Salvo brings five-kilo sacks of *harina* home on the metro. Every ride is a
/// flour run.
enum Protagonist {
    static let name = "Salvo"
    static let fullName = "Salvatore \"Salvo\" Pugliese"
    static let trade = "focaccia casera"

    /// Home is Los Jardines del Valle — the "Los Jardines" stop on Línea 3.
    static let homeLineID = "L3"
    static let homeStationName = "Los Jardines"
    static let homeStationID = "L3-Los Jardines"
    static let homeStationIndex = 5
    static let homeNeighborhood = "Los Jardines del Valle"

    /// How much flour Salvo hauls on a run.
    static let flourKilos = 5

    static let tagline = "La ruta de la harina"

    /// First thing the player sees on launch — sets up the flour run.
    static let intro = "Salvo: \"El horno está frío y se acabó la harina. Cinco kilos al hombro y a montarse en el metro. ¡Arranca, chamo!\""

    /// Shown when Salvo is standing on his home platform with nothing else to say.
    static let homePlatformLine = "Estás en Los Jardines del Valle, tu estación. El olor a focaccia todavía no llega tan lejos… pero llegará."
}
