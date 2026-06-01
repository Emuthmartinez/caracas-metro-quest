import SwiftUI

struct RouteHeaderView: View {
    let game: MetroGameViewModel
    @State private var muted = AudioManager.shared.isMuted

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Metro Amarillo")
                        .font(.system(size: 28, weight: .black, design: .monospaced))
                        .foregroundStyle(Color.tileCream)
                        .shadow(color: game.currentLine.accent.opacity(0.9), radius: 0, x: 2, y: 2)
                    Text("\(Protagonist.tagline) · \(Protagonist.name)")
                        .font(.system(size: 11, weight: .heavy, design: .monospaced))
                        .foregroundStyle(Color.white.opacity(0.72))
                        .textCase(.uppercase)
                }
                Spacer()
                Button {
                    muted.toggle()
                    AudioManager.shared.isMuted = muted
                    Haptics.tap()
                } label: {
                    Image(systemName: muted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(Color.tileCream)
                        .frame(width: 40, height: 54)
                        .background(Color.retroInk)
                        .overlay { Rectangle().stroke(Color.white.opacity(0.3), lineWidth: 2) }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(muted ? "Activar sonido" : "Silenciar sonido")
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
                PixelBadgeView(title: "Estación", value: game.currentStation.name, accent: game.currentLine.accent)
                PixelBadgeView(title: "Modo", value: game.phase == .ride ? "Rodando" : "Andén", accent: Color.metroYellow)
                HStack(spacing: 6) {
                    FlourSackView(scale: 0.7)
                    PixelBadgeView(title: "Harina", value: "\(Protagonist.flourKilos) kg", accent: Color.tileCream)
                }
                .fixedSize(horizontal: true, vertical: false)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Metro Amarillo. Current station \(game.currentStation.name). Current line \(game.currentLine.displayName)")
    }
}
