import SwiftUI

struct RouteHeaderView: View {
    let game: MetroGameViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Metro Amarillo")
                        .font(.system(size: 28, weight: .black, design: .monospaced))
                        .foregroundStyle(Color.tileCream)
                        .shadow(color: game.currentLine.accent.opacity(0.9), radius: 0, x: 2, y: 2)
                    Text("Caracas rail quest")
                        .font(.system(size: 11, weight: .heavy, design: .monospaced))
                        .foregroundStyle(Color.white.opacity(0.72))
                        .textCase(.uppercase)
                }
                Spacer()
                Text("L\(game.currentLine.number)")
                    .font(.system(size: 22, weight: .black, design: .monospaced))
                    .foregroundStyle(Color.retroInk)
                    .frame(width: 54, height: 54)
                    .background(game.currentLine.accent)
                    .overlay {
                        Rectangle().stroke(Color.white.opacity(0.85), lineWidth: 3)
                    }
                    .shadow(color: Color.black.opacity(0.4), radius: 0, x: 5, y: 5)
            }

            HStack(spacing: 8) {
                PixelBadgeView(title: "Station", value: game.currentStation.name, accent: game.currentLine.accent)
                PixelBadgeView(title: "Mode", value: game.phase == .ride ? "Riding" : "Platform", accent: Color.metroYellow)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Metro Amarillo. Current station \(game.currentStation.name). Current line \(game.currentLine.displayName)")
    }
}
