import SwiftUI

struct MetroLine: Identifiable {
    let id: String
    let number: String
    let name: String
    let displayName: String
    let accent: Color
    let darkAccent: Color
    let stations: [MetroStation]
    let plannedStations: [String]
    let routeNote: String
}
