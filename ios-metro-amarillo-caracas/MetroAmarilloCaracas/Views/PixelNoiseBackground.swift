import SwiftUI

struct PixelNoiseBackground: View {
    private let dots: [TileCoordinate] = TileCoordinate.grid(width: 18, height: 32)

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x07111E), Color(hex: 0x14243A), Color(hex: 0x251834)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            GeometryReader { proxy in
                ForEach(dots) { dot in
                    Rectangle()
                        .fill(pixelColor(for: dot))
                        .frame(width: 3, height: 3)
                        .position(
                            x: CGFloat(dot.x) / 17.0 * proxy.size.width,
                            y: CGFloat(dot.y) / 31.0 * proxy.size.height
                        )
                }
            }
            .opacity(0.5)
        }
        .ignoresSafeArea()
    }

    private func pixelColor(for coordinate: TileCoordinate) -> Color {
        if (coordinate.x + coordinate.y).isMultiple(of: 11) { return Color.metroYellow.opacity(0.42) }
        if (coordinate.x * 3 + coordinate.y).isMultiple(of: 13) { return Color(hex: 0x4AB7FF).opacity(0.32) }
        return Color.white.opacity(0.08)
    }
}
