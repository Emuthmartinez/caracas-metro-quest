import SwiftUI

struct NPCPanelView: View {
    let npc: MetroNPC?
    let accent: Color

    var body: some View {
        RetroGlassPanel(accent: accent) {
            HStack(spacing: 12) {
                if let npc {
                    PixelNPCView(npc: npc)
                        .frame(width: 48, height: 54)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(npc.name)
                            .font(.system(size: 15, weight: .black, design: .monospaced))
                            .foregroundStyle(Color.tileCream)
                        Text(npc.role)
                            .font(.system(size: 11, weight: .heavy, design: .monospaced))
                            .foregroundStyle(npc.palette)
                            .textCase(.uppercase)
                        Text("Waiting at \(npc.stationName)")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.58))
                    }
                } else {
                    Rectangle()
                        .fill(Color.white.opacity(0.14))
                        .frame(width: 42, height: 42)
                        .overlay {
                            Text("?")
                                .font(.system(size: 20, weight: .black, design: .monospaced))
                                .foregroundStyle(Color.tileCream.opacity(0.7))
                        }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("No NPC here")
                            .font(.system(size: 15, weight: .black, design: .monospaced))
                            .foregroundStyle(Color.tileCream)
                        Text("Keep riding to find local characters")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.58))
                    }
                }
                Spacer()
            }
        }
    }
}
