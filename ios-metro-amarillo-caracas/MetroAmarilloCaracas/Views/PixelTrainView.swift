import SwiftUI

struct PixelTrainView: View {
    let line: MetroLine
    let phase: GamePhase

    var body: some View {
        HStack(spacing: 3) {
            trainCar(front: true)
            trainCar(front: false)
            trainCar(front: false)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color(hex: 0x17243A))
        .overlay {
            Rectangle().stroke(line.accent, lineWidth: 3)
        }
        .shadow(color: Color.black.opacity(0.45), radius: 0, x: 5, y: 5)
        .offset(x: phase == .ride ? 0 : 36)
        .opacity(phase == .ride ? 1.0 : 0.82)
        .animation(.spring(response: 0.42, dampingFraction: 0.72), value: phase)
        .accessibilityLabel("Línea \(line.number) train")
    }

    private func trainCar(front: Bool) -> some View {
        VStack(spacing: 3) {
            HStack(spacing: 3) {
                Rectangle().fill(Color(hex: 0xCFE6F5)).frame(width: 14, height: 10)
                Rectangle().fill(Color(hex: 0xCFE6F5)).frame(width: 14, height: 10)
            }
            Rectangle().fill(line.accent).frame(height: 5)
            HStack(spacing: 8) {
                Rectangle().fill(Color.retroInk).frame(width: 5, height: 5)
                Rectangle().fill(Color.retroInk).frame(width: 5, height: 5)
            }
        }
        .frame(width: front ? 44 : 40, height: 35)
        .background(Color(hex: 0xF4F1DF))
        .overlay(alignment: .leading) {
            if front {
                Rectangle().fill(line.darkAccent).frame(width: 6)
            }
        }
    }
}
