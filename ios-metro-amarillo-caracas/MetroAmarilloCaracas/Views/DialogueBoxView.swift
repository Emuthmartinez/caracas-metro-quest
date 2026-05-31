import SwiftUI

struct DialogueBoxView: View {
    let message: String
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 7) {
                Rectangle().fill(accent).frame(width: 10, height: 10)
                Text("MetroCom")
                    .font(.system(size: 10, weight: .black, design: .monospaced))
                    .foregroundStyle(accent)
                    .textCase(.uppercase)
                Spacer()
                Text("A")
                    .font(.system(size: 9, weight: .black, design: .monospaced))
                    .foregroundStyle(Color.retroInk)
                    .frame(width: 18, height: 18)
                    .background(Color.tileCream)
            }
            Text(message)
                .font(.system(size: 14, weight: .bold, design: .monospaced))
                .foregroundStyle(Color.tileCream)
                .lineSpacing(3)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .background(Color.retroInk)
        .overlay {
            Rectangle().stroke(Color.white.opacity(0.8), lineWidth: 3)
        }
        .overlay(alignment: .bottomTrailing) {
            HStack(spacing: 3) {
                Rectangle().fill(accent).frame(width: 6, height: 6)
                Rectangle().fill(accent.opacity(0.75)).frame(width: 6, height: 6)
            }
            .padding(8)
        }
        .accessibilityLabel(message)
    }
}
