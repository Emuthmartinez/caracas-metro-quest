import SwiftUI

/// A pixel NPC composed from `npc.visual` traits, so each character looks honest
/// to who they are and where in Caracas they live — built from a small vocabulary
/// rather than hand-drawn per character.
struct PixelNPCView: View {
    let npc: MetroNPC
    private var v: NPCVisual { npc.visual }

    private var bodyWidth: CGFloat {
        switch v.build {
        case .child: return 20
        case .heavy: return 30
        default:     return 26
        }
    }
    private var headWidth: CGFloat { v.build == .child ? 18 : 20 }
    private var legColor: Color { Color(hex: 0x2A3550) }

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                head
                torso
                legs
            }
            .overlay(alignment: .top) { headwear.offset(y: -3) }
            prop
        }
        .frame(width: 42, height: 54)
        .scaleEffect(v.build == .child ? 0.82 : 1.0, anchor: .bottom)
        .shadow(color: Color.black.opacity(0.35), radius: 0, x: 3, y: 3)
        .accessibilityLabel("NPC \(npc.name), \(npc.role)")
    }

    // MARK: - Head

    private var head: some View {
        VStack(spacing: 0) {
            Rectangle().fill(v.hair == .bald ? v.skinColor : v.hairColor)
                .frame(width: headWidth, height: 4)
            HStack(spacing: 0) {
                Rectangle().fill(sideHair).frame(width: 4, height: 13)
                Rectangle().fill(v.skinColor).frame(width: headWidth - 8, height: 13)
                Rectangle().fill(sideHair).frame(width: 4, height: 13)
            }
            .overlay {
                HStack(spacing: 4) {
                    Rectangle().fill(Color.retroInk).frame(width: 3, height: 3)
                    Rectangle().fill(Color.retroInk).frame(width: 3, height: 3)
                }
                .offset(y: -1)
            }
        }
        .overlay(alignment: .bottom) { hairExtra }
    }

    private var sideHair: Color { v.hair == .bald ? v.skinColor : v.hairColor }

    @ViewBuilder private var hairExtra: some View {
        switch v.hair {
        case .long, .curly:
            HStack {
                Rectangle().fill(v.hairColor).frame(width: 4, height: 9)
                Spacer()
                Rectangle().fill(v.hairColor).frame(width: 4, height: 9)
            }
            .frame(width: headWidth + 2)
            .offset(y: 7)
        case .bun:
            Rectangle().fill(v.hairColor).frame(width: 9, height: 7).offset(y: -19)
        default:
            EmptyView()
        }
    }

    // MARK: - Torso & legs

    private var torso: some View {
        ZStack {
            Rectangle().fill(npc.palette).frame(width: bodyWidth, height: 17)
            Rectangle().fill(Color.white.opacity(0.16)).frame(width: 6, height: 17)
        }
        .overlay(alignment: .bottomLeading) {
            Rectangle().fill(v.skinColor).frame(width: 4, height: 7).offset(x: 1, y: 5)
        }
        .overlay(alignment: .bottomTrailing) {
            Rectangle().fill(v.skinColor).frame(width: 4, height: 7).offset(x: -1, y: 5)
        }
    }

    private var legs: some View {
        HStack(spacing: 4) {
            Rectangle().fill(legColor).frame(width: 7, height: v.build == .elder ? 9 : 11)
            Rectangle().fill(legColor).frame(width: 7, height: v.build == .elder ? 9 : 11)
        }
    }

    // MARK: - Headwear

    @ViewBuilder private var headwear: some View {
        switch v.headwear {
        case .none:
            EmptyView()
        case .cap, .conductor:
            VStack(spacing: 0) {
                Rectangle().fill(Color(hex: v.headwear == .conductor ? 0x16213A : 0x365E9E))
                    .frame(width: headWidth + 2, height: 5)
                Rectangle().fill(Color(hex: v.headwear == .conductor ? 0x0F1729 : 0x274879))
                    .frame(width: headWidth + 8, height: 3)
            }
        case .sombrero:
            VStack(spacing: 0) {
                Rectangle().fill(Color(hex: 0xC79A4E)).frame(width: 12, height: 6)
                Rectangle().fill(Color(hex: 0xB5853C)).frame(width: headWidth + 18, height: 4)
            }
        case .hardhat:
            Rectangle().fill(Color(hex: 0xFFCE3A)).frame(width: headWidth + 4, height: 7)
                .clipShape(.rect(topLeadingRadius: 6, topTrailingRadius: 6))
        case .panuelo, .scarf:
            Rectangle().fill(Color(hex: v.headwear == .scarf ? 0xC23B3B : 0xE86A8E))
                .frame(width: headWidth + 2, height: 7)
        case .beret:
            Rectangle().fill(Color(hex: 0x9A2D3A)).frame(width: headWidth + 2, height: 5)
                .offset(x: 4)
        case .veil:
            VStack(spacing: 0) {
                Rectangle().fill(Color(hex: 0xEDEDF2)).frame(width: headWidth + 4, height: 6)
                HStack {
                    Rectangle().fill(Color(hex: 0xEDEDF2)).frame(width: 4, height: 16)
                    Spacer()
                    Rectangle().fill(Color(hex: 0xEDEDF2)).frame(width: 4, height: 16)
                }
                .frame(width: headWidth + 8)
            }
        case .hood:
            VStack(spacing: 0) {
                Rectangle().fill(Color(hex: 0x55606E)).frame(width: headWidth + 6, height: 6)
                HStack {
                    Rectangle().fill(Color(hex: 0x55606E)).frame(width: 4, height: 14)
                    Spacer()
                    Rectangle().fill(Color(hex: 0x55606E)).frame(width: 4, height: 14)
                }
                .frame(width: headWidth + 8)
            }
        case .feathers:
            HStack(spacing: 2) {
                Rectangle().fill(Color(hex: 0x3FA9F5)).frame(width: 3, height: 10)
                Rectangle().fill(Color(hex: 0xFFD34F)).frame(width: 3, height: 13)
                Rectangle().fill(Color(hex: 0x35B96F)).frame(width: 3, height: 9)
            }
            .offset(y: -4)
        case .crown:
            HStack(spacing: 1) {
                ForEach(0..<5, id: \.self) { _ in
                    Rectangle().fill(Color(hex: 0xFFD34F)).frame(width: 3, height: 6)
                }
            }
        }
    }

    // MARK: - Prop

    @ViewBuilder private var prop: some View {
        switch v.prop {
        case .none:
            EmptyView()
        case .sack:
            FlourSackView(scale: 0.65).offset(x: -15, y: 4)
        case .flute:
            Rectangle().fill(Color(hex: 0xE8D8A0)).frame(width: 18, height: 3).offset(x: 12, y: -4)
        case .cuatro, .guitar:
            ZStack(alignment: .bottomTrailing) {
                Rectangle().fill(Color(hex: 0xB5772E)).frame(width: 14, height: 12)
                Rectangle().fill(Color(hex: 0x8A5A22)).frame(width: 3, height: 16).offset(x: 1, y: -10)
            }
            .offset(x: 15, y: 2)
        case .tickets:
            HStack(spacing: 1) {
                ForEach(0..<3, id: \.self) { i in
                    Rectangle().fill(Color(hex: 0xF2E59A)).frame(width: 4, height: 12).rotationEffect(.degrees(Double(i - 1) * 12))
                }
            }
            .offset(x: -15, y: 2)
        case .newspaper:
            Rectangle().fill(Color(hex: 0xE8E4D8)).frame(width: 14, height: 11)
                .overlay { Rectangle().stroke(Color.retroInk.opacity(0.4), lineWidth: 1) }
                .offset(x: 0, y: -6)
        case .candle:
            VStack(spacing: 0) {
                Rectangle().fill(Color(hex: 0xFF8A3C)).frame(width: 3, height: 4)
                Rectangle().fill(Color(hex: 0xF0E6C8)).frame(width: 5, height: 12)
            }
            .offset(x: -14, y: 0)
        case .briefcase:
            Rectangle().fill(Color(hex: 0x6E4A2A)).frame(width: 13, height: 11)
                .overlay(alignment: .top) { Rectangle().fill(Color(hex: 0x4A3019)).frame(width: 5, height: 2).offset(y: -2) }
                .offset(x: -16, y: 8)
        case .cane:
            Rectangle().fill(Color(hex: 0x7A4B22)).frame(width: 3, height: 22).offset(x: 15, y: 4)
        case .basket:
            Trapezoid().fill(Color(hex: 0xB5853C)).frame(width: 18, height: 11)
                .overlay(alignment: .top) { Rectangle().fill(Color(hex: 0xE8C06A)).frame(width: 12, height: 3).offset(y: -1) }
                .offset(x: -15, y: 8)
        case .bird:
            Rectangle().fill(Color(hex: 0x3FA9F5)).frame(width: 7, height: 6)
                .overlay(alignment: .trailing) { Rectangle().fill(Color(hex: 0xFFD34F)).frame(width: 2, height: 2) }
                .offset(x: 15, y: -34)
        case .book:
            Rectangle().fill(Color(hex: 0x9A2D3A)).frame(width: 10, height: 8).offset(x: -14, y: 2)
        case .broom:
            VStack(spacing: 0) {
                Rectangle().fill(Color(hex: 0x7A4B22)).frame(width: 2, height: 16)
                Rectangle().fill(Color(hex: 0xC79A4E)).frame(width: 8, height: 5)
            }
            .offset(x: 16, y: 2)
        case .shoeBrush:
            Rectangle().fill(Color(hex: 0x4A3019)).frame(width: 10, height: 4).offset(x: -14, y: 6)
        case .wrench:
            Rectangle().fill(Color(hex: 0x9AA3AD)).frame(width: 4, height: 14).offset(x: 14, y: 2)
        }
    }
}

/// Simple pixel trapezoid for baskets.
private struct Trapezoid: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let inset = rect.width * 0.18
        p.move(to: CGPoint(x: rect.minX + inset, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX - inset, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        p.closeSubpath()
        return p
    }
}
