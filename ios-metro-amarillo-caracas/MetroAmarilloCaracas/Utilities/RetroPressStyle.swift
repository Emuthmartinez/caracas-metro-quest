import SwiftUI

struct RetroPressStyle: ButtonStyle {
    let accent: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.caption, design: .monospaced).weight(.black))
            .textCase(.uppercase)
            .foregroundStyle(Color.retroInk)
            .frame(minHeight: 44)
            .padding(.horizontal, 12)
            .background(accent)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(Color.black.opacity(configuration.isPressed ? 0.12 : 0.28))
                    .frame(height: configuration.isPressed ? 2 : 5)
            }
            .overlay {
                Rectangle()
                    .stroke(Color.white.opacity(0.85), lineWidth: 2)
                    .padding(2)
            }
            .clipShape(.rect(cornerRadius: 0))
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.spring(response: 0.18, dampingFraction: 0.62), value: configuration.isPressed)
    }
}
