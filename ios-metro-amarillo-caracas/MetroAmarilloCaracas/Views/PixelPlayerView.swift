import SwiftUI

struct PixelPlayerView: View {
    let direction: PlayerDirection
    let accent: Color

    var body: some View {
        VStack(spacing: 0) {
            head
            bodyBlock
            legs
        }
        .frame(width: 34, height: 44)
        .shadow(color: Color.black.opacity(0.35), radius: 0, x: 3, y: 3)
        .accessibilityLabel("Player facing \(direction.rawValue)")
    }

    private var head: some View {
        VStack(spacing: 0) {
            Rectangle().fill(Color(hex: 0x2F1B14)).frame(width: 18, height: 5)
            HStack(spacing: 0) {
                Rectangle().fill(Color(hex: 0xB97452)).frame(width: 5, height: 12)
                Rectangle().fill(Color(hex: 0xF1B27A)).frame(width: 14, height: 12)
                Rectangle().fill(Color(hex: 0xB97452)).frame(width: 5, height: 12)
            }
            HStack(spacing: 3) {
                Rectangle().fill(Color.retroInk).frame(width: 3, height: 3)
                Rectangle().fill(Color.retroInk).frame(width: 3, height: 3)
            }
            .offset(y: -8)
        }
        .frame(height: 19)
    }

    private var bodyBlock: some View {
        ZStack {
            Rectangle().fill(accent).frame(width: 24, height: 16)
            Rectangle().fill(Color.white.opacity(0.85)).frame(width: 8, height: 16)
        }
    }

    private var legs: some View {
        HStack(spacing: 4) {
            Rectangle().fill(Color(hex: 0x24446C)).frame(width: 8, height: 11)
            Rectangle().fill(Color(hex: 0x24446C)).frame(width: 8, height: 11)
        }
    }
}
