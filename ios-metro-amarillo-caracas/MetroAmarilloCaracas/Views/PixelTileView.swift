import SwiftUI

struct PixelTileView: View {
    let coordinate: TileCoordinate
    let station: MetroStation
    let line: MetroLine
    let phase: GamePhase

    private var baseColor: Color {
        if coordinate.y == 0 || coordinate.y == 8 || coordinate.x == 0 || coordinate.x == 11 {
            return Color(hex: 0x21344A)
        }
        if coordinate.y == 4 {
            return line.darkAccent.opacity(0.9)
        }
        if coordinate.x == 5 || coordinate.x == 6 {
            return Color.platformOchre
        }
        return (coordinate.x + coordinate.y).isMultiple(of: 2) ? Color(hex: 0xDAB971) : Color.tileCream
    }

    var body: some View {
        Rectangle()
            .fill(baseColor)
            .overlay(alignment: .topLeading) {
                Rectangle()
                    .fill(Color.white.opacity(0.18))
                    .frame(height: 2)
            }
            .overlay(alignment: .bottomTrailing) {
                Rectangle()
                    .fill(Color.black.opacity(0.24))
                    .frame(width: 2)
            }
            .overlay {
                if coordinate.y == 4 && coordinate.x > 1 && coordinate.x < 10 {
                    Rectangle()
                        .fill(line.accent)
                        .frame(height: 4)
                }
            }
            .overlay {
                if coordinate.x == 9 && coordinate.y == 2 && station.isTransfer {
                    Text("T")
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundStyle(Color.retroInk)
                        .frame(width: 18, height: 18)
                        .background(Color.metroYellow)
                }
            }
            .accessibilityHidden(true)
    }
}
