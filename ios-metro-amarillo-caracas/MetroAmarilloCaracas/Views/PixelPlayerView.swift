import SwiftUI

/// Salvo, the focaccia baker, hugging a five-kilo sack of harina.
/// The whole sprite mirrors horizontally when he walks west.
struct PixelPlayerView: View {
    let direction: PlayerDirection
    let accent: Color

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                head
                bodyBlock
                legs
            }
            FlourSackView(scale: 1)
                .offset(y: 2)
        }
        .frame(width: 38, height: 48)
        .scaleEffect(x: direction == .west ? -1 : 1, y: 1)
        .shadow(color: Color.black.opacity(0.35), radius: 0, x: 3, y: 3)
        .accessibilityLabel("Salvo carrying a five-kilo flour sack, facing \(direction.rawValue)")
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
            Rectangle().fill(accent).frame(width: 26, height: 16)
            Rectangle().fill(Color.white.opacity(0.85)).frame(width: 8, height: 16)
        }
        // forearms reaching down to hold the sack
        .overlay(alignment: .bottomLeading) {
            Rectangle().fill(Color(hex: 0xF1B27A)).frame(width: 5, height: 8).offset(x: 1, y: 6)
        }
        .overlay(alignment: .bottomTrailing) {
            Rectangle().fill(Color(hex: 0xF1B27A)).frame(width: 5, height: 8).offset(x: -1, y: 6)
        }
    }

    private var legs: some View {
        HStack(spacing: 4) {
            Rectangle().fill(Color(hex: 0x24446C)).frame(width: 8, height: 11)
            Rectangle().fill(Color(hex: 0x24446C)).frame(width: 8, height: 11)
        }
    }
}

/// A reusable pixel sack of flour — used on the player sprite and in the HUD.
struct FlourSackView: View {
    var scale: CGFloat = 1

    var body: some View {
        VStack(spacing: 0) {
            // cinched, tied neck
            Rectangle().fill(Color(hex: 0xC9B07E)).frame(width: 7 * scale, height: 3 * scale)
            ZStack {
                Rectangle().fill(Color(hex: 0xEBDCA8)).frame(width: 20 * scale, height: 16 * scale)
                VStack(spacing: 2 * scale) {
                    Rectangle().fill(Color(hex: 0xB23B2E)).frame(width: 12 * scale, height: 4 * scale) // red label band
                    Rectangle().fill(Color(hex: 0xD8C48E)).frame(width: 16 * scale, height: 2 * scale) // seam
                }
            }
            .overlay(alignment: .leading) {
                Rectangle().fill(Color.white.opacity(0.30)).frame(width: 2 * scale)
            }
            .overlay(alignment: .trailing) {
                Rectangle().fill(Color.black.opacity(0.20)).frame(width: 3 * scale)
            }
        }
        .accessibilityHidden(true)
    }
}
