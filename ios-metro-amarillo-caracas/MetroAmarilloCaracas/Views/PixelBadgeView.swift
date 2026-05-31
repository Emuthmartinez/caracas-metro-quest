import SwiftUI

struct PixelBadgeView: View {
    let title: String
    let value: String
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.system(size: 9, weight: .heavy, design: .monospaced))
                .foregroundStyle(Color.tileCream.opacity(0.72))
            Text(value)
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(Color.white)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.retroInk)
        .overlay(alignment: .bottom) {
            Rectangle().fill(accent).frame(height: 4)
        }
        .overlay {
            Rectangle().stroke(Color.white.opacity(0.25), lineWidth: 1)
        }
    }
}
