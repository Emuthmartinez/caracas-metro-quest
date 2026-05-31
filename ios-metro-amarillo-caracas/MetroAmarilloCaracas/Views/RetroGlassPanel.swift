import SwiftUI

struct RetroGlassPanel<Content: View>: View {
    let accent: Color
    @ViewBuilder let content: Content

    var body: some View {
        Group {
            if #available(iOS 26.0, *) {
                content
                    .padding(12)
                    .glassEffect(.regular.tint(accent.opacity(0.16)), in: .rect(cornerRadius: 18))
            } else {
                content
                    .padding(12)
                    .background(.ultraThinMaterial)
                    .clipShape(.rect(cornerRadius: 18))
            }
        }
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(accent.opacity(0.55), lineWidth: 2)
        }
    }
}
