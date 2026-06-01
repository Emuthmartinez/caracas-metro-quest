import SwiftUI

struct MetroNPC: Identifiable {
    let id: String
    let name: String
    let role: String
    let stationName: String
    let lineID: String
    let palette: Color
    /// Two or three short lines in caraqueño voice. The player advances through
    /// them by pressing Talk. These are ambient encounters — no quests.
    let dialoguePool: [String]
    /// Composable visual traits (build/skin/hair/headwear/prop), honest to the
    /// character and their zone. Defaults to a generic adult until assigned.
    var visual: NPCVisual = NPCVisual()

    /// The line shown passively (in the dialogue box) before the player taps Talk.
    var dialogue: String { dialoguePool.first ?? "" }
}
