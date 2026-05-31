import SwiftUI

struct ControlPadView: View {
    let game: MetroGameViewModel

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Button {
                    Haptics.tap()
                    game.travelBackward()
                } label: {
                    Label("Prev", systemImage: "chevron.left")
                }
                .buttonStyle(RetroPressStyle(accent: Color.tileCream))

                Button {
                    Haptics.success()
                    game.boardOrExitTrain()
                } label: {
                    Text(game.phase == .ride ? "Exit" : "Board")
                }
                .buttonStyle(RetroPressStyle(accent: game.currentLine.accent))

                Button {
                    Haptics.tap()
                    game.travelForward()
                } label: {
                    Label("Next", systemImage: "chevron.right")
                }
                .buttonStyle(RetroPressStyle(accent: Color.tileCream))
            }

            HStack(spacing: 10) {
                Button {
                    Haptics.tap()
                    game.talk()
                } label: {
                    Label("Talk", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .buttonStyle(RetroPressStyle(accent: Color.metroYellow))

                Button {
                    Haptics.tap()
                    game.clearDialogue()
                } label: {
                    Label("Look", systemImage: "eye.fill")
                }
                .buttonStyle(RetroPressStyle(accent: Color(hex: 0x8FE7FF)))
            }
        }
    }
}
