import SwiftUI

struct ContentView: View {
    @State private var game: MetroGameViewModel = MetroGameViewModel()

    var body: some View {
        ZStack {
            PixelNoiseBackground()
            ScrollView {
                VStack(spacing: 18) {
                    RouteHeaderView(game: game)
                        .padding(.horizontal, 16)
                        .padding(.top, 14)

                    GameWorldView(
                        line: game.currentLine,
                        station: game.currentStation,
                        npc: game.currentNPC,
                        phase: game.phase,
                        direction: game.playerDirection
                    )
                    .padding(.horizontal, 16)

                    DialogueBoxView(message: game.statusMessage, accent: game.currentLine.accent)
                        .padding(.horizontal, 16)

                    LineSelectorView(game: game)

                    NPCPanelView(npc: game.currentNPC, accent: game.currentLine.accent)
                        .padding(.horizontal, 16)

                    LineMapView(game: game)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 118)
                }
            }
            .scrollIndicators(.hidden)
        }
        .safeAreaInset(edge: .bottom) {
            ControlDockView(game: game)
        }
        .onAppear {
            AudioManager.shared.start()
            AudioManager.shared.enterStation()
        }
    }
}

private struct ControlDockView: View {
    let game: MetroGameViewModel

    var body: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(LinearGradient(colors: [Color.clear, Color.retroInk.opacity(0.82)], startPoint: .top, endPoint: .bottom))
                .frame(height: 18)
            ControlPadView(game: game)
                .padding(.horizontal, 16)
                .padding(.top, 10)
                .padding(.bottom, 12)
                .background(Color.retroInk.opacity(0.94))
        }
    }
}

#Preview {
    ContentView()
}
