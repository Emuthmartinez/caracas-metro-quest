import SwiftUI

/// A small, fixed vocabulary of visual traits. The pixel sprite is *composed*
/// from these at render time rather than hand-drawn per character — so 48 NPCs
/// stay distinct and honest to their zone without 48 bespoke sprites. The
/// per-character values are stored as data (see design/npcs.json).
struct NPCVisual: Hashable {
    enum Build: String { case child, adult, elder, heavy }
    enum Skin: String { case light, medium, brown, dark }
    enum Hair: String { case short, long, bun, bald, gray, curly }
    enum Headwear: String { case none, cap, sombrero, panuelo, beret, hardhat, veil, feathers, conductor, crown, scarf, hood }
    enum Prop: String { case none, flute, cuatro, tickets, newspaper, candle, wrench, briefcase, cane, basket, bird, book, broom, shoeBrush, guitar, sack }

    var build: Build = .adult
    var skin: Skin = .medium
    var hair: Hair = .short
    var headwear: Headwear = .none
    var prop: Prop = .none

    init(build: Build = .adult, skin: Skin = .medium, hair: Hair = .short, headwear: Headwear = .none, prop: Prop = .none) {
        self.build = build; self.skin = skin; self.hair = hair; self.headwear = headwear; self.prop = prop
    }

    /// Data-driven construction from the research JSON (unknown values fall back safely).
    init(buildRaw: String, skinRaw: String, hairRaw: String, headwearRaw: String, propRaw: String) {
        build = Build(rawValue: buildRaw) ?? .adult
        skin = Skin(rawValue: skinRaw) ?? .medium
        hair = Hair(rawValue: hairRaw) ?? .short
        headwear = Headwear(rawValue: headwearRaw) ?? .none
        prop = Prop(rawValue: propRaw) ?? .none
    }

    var skinColor: Color {
        switch skin {
        case .light:  return Color(hex: 0xF1C49A)
        case .medium: return Color(hex: 0xCE9A6B)
        case .brown:  return Color(hex: 0x9C6B43)
        case .dark:   return Color(hex: 0x6E4A30)
        }
    }

    var hairColor: Color {
        switch hair {
        case .gray: return Color(hex: 0xCBCDD2)
        case .bald: return .clear
        default:    return Color(hex: 0x2B1A12)
        }
    }
}
