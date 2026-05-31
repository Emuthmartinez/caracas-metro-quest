import SwiftUI

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        let red = Double((hex >> 16) & 0xFF) / 255.0
        let green = Double((hex >> 8) & 0xFF) / 255.0
        let blue = Double(hex & 0xFF) / 255.0
        self.init(red: red, green: green, blue: blue, opacity: opacity)
    }

    static let retroInk = Color(hex: 0x081421)
    static let tunnelNavy = Color(hex: 0x101B2D)
    static let tileCream = Color(hex: 0xF4DFA2)
    static let platformOchre = Color(hex: 0xC68B30)
    static let metroYellow = Color(hex: 0xFFD34F)
    static let pixelShadow = Color(hex: 0x2B2E4A)
}
