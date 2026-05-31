import SwiftUI

struct LineSelectorView: View {
    let game: MetroGameViewModel

    var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 10) {
                ForEach(MetroData.lines) { line in
                    Button {
                        Haptics.tap()
                        game.selectLine(line.id)
                    } label: {
                        VStack(spacing: 6) {
                            Text("L\(line.number)")
                                .font(.system(size: 18, weight: .black, design: .monospaced))
                            Text(line.stations[game.stationIndex(for: line.id)].name)
                                .font(.system(size: 9, weight: .heavy, design: .monospaced))
                                .lineLimit(1)
                                .minimumScaleFactor(0.55)
                        }
                        .foregroundStyle(game.selectedLineID == line.id ? Color.retroInk : Color.tileCream)
                        .frame(width: 106, height: 58)
                        .background(game.selectedLineID == line.id ? line.accent : Color.retroInk.opacity(0.88))
                        .overlay(alignment: .bottom) {
                            Rectangle().fill(line.accent).frame(height: 5)
                        }
                        .overlay {
                            Rectangle().stroke(Color.white.opacity(game.selectedLineID == line.id ? 0.9 : 0.22), lineWidth: 2)
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Select \(line.displayName)")
                }
            }
        }
        .contentMargins(.horizontal, 16)
        .scrollIndicators(.hidden)
    }
}
