import SwiftUI

struct PixelNPCView: View {
    let npc: MetroNPC

    var body: some View {
        VStack(spacing: 0) {
            Rectangle().fill(Color(hex: 0x342018)).frame(width: 20, height: 6)
            Rectangle().fill(Color(hex: 0xE6A06C)).frame(width: 18, height: 13)
            Rectangle().fill(npc.palette).frame(width: 26, height: 17)
            HStack(spacing: 5) {
                Rectangle().fill(Color(hex: 0x1E2746)).frame(width: 7, height: 10)
                Rectangle().fill(Color(hex: 0x1E2746)).frame(width: 7, height: 10)
            }
        }
        .overlay(alignment: .topTrailing) {
            Rectangle()
                .fill(Color.metroYellow)
                .frame(width: 7, height: 7)
                .offset(x: 3, y: -2)
        }
        .shadow(color: Color.black.opacity(0.35), radius: 0, x: 3, y: 3)
        .accessibilityLabel("NPC \(npc.name), \(npc.role)")
    }
}
