import Foundation
import Observation

@Observable
final class MetroGameViewModel {
    var selectedLineID: String = "L1"
    var stationIndexByLineID: [String: Int] = ["L1": 11, "L2": 0, "L3": 0, "L4": 0, "L5": 0]
    var phase: GamePhase = .station
    var playerDirection: PlayerDirection = .south
    var dialogueOverride: String?
    var visitedStationIDs: Set<String> = ["L1-Plaza Venezuela"]

    var currentLine: MetroLine {
        MetroData.line(for: selectedLineID)
    }

    var currentStation: MetroStation {
        let line: MetroLine = currentLine
        let fallbackIndex: Int = min(max(stationIndexByLineID[line.id] ?? 0, 0), line.stations.count - 1)
        return line.stations[fallbackIndex]
    }

    var currentNPC: MetroNPC? {
        MetroData.npc(at: currentStation)
    }

    var stationProgress: Double {
        guard currentLine.stations.count > 1 else { return 1 }
        return Double(currentStation.index) / Double(currentLine.stations.count - 1)
    }

    var locationLabel: String {
        switch phase {
        case .station:
            return currentStation.name
        case .ride:
            return "On board Línea \(currentLine.number)"
        }
    }

    var statusMessage: String {
        if let dialogueOverride {
            return dialogueOverride
        }
        if let currentNPC {
            return "\(currentNPC.name): \"\(currentNPC.dialogue)\""
        }
        if currentStation.isTransfer {
            return "Transfer hub detected. Pick a color line and continue your route."
        }
        return "You are at \(currentStation.name). Check the platform, talk to locals, or board the train."
    }

    func boardOrExitTrain() {
        dialogueOverride = nil
        switch phase {
        case .station:
            phase = .ride
        case .ride:
            phase = .station
            visitedStationIDs.insert(currentStation.id)
        }
    }

    func travelForward() {
        travel(step: 1)
    }

    func travelBackward() {
        travel(step: -1)
    }

    func selectLine(_ lineID: String) {
        guard selectedLineID != lineID else { return }
        guard let targetLine = MetroData.lines.first(where: { $0.id == lineID }) else { return }
        selectedLineID = targetLine.id
        playerDirection = .south
        let stationIndex: Int = bestTransferIndex(on: targetLine) ?? (stationIndexByLineID[targetLine.id] ?? 0)
        stationIndexByLineID[targetLine.id] = stationIndex
        phase = .station
        visitedStationIDs.insert(targetLine.stations[stationIndex].id)
        dialogueOverride = "Switched to \(targetLine.displayName). The platform signs flicker in \(targetLine.number)-bit color."
    }

    func talk() {
        if let currentNPC {
            dialogueOverride = "\(currentNPC.name): \"\(currentNPC.dialogue)\""
        } else {
            dialogueOverride = "A quiet rider points at the line map and nods toward the next train."
        }
    }

    func clearDialogue() {
        dialogueOverride = nil
    }

    func isVisited(_ station: MetroStation) -> Bool {
        visitedStationIDs.contains(station.id)
    }

    func stationIndex(for lineID: String) -> Int {
        stationIndexByLineID[lineID] ?? 0
    }

    private func travel(step: Int) {
        guard phase == .ride else {
            dialogueOverride = "Board the train first. The doors blink yellow beside the platform."
            return
        }

        let line: MetroLine = currentLine
        let currentIndex: Int = stationIndexByLineID[line.id] ?? 0
        let nextIndex: Int = min(max(currentIndex + step, 0), line.stations.count - 1)
        guard nextIndex != currentIndex else {
            dialogueOverride = step > 0 ? "End of the line. The driver waits for the return signal." : "This is the first stop on this route."
            return
        }

        stationIndexByLineID[line.id] = nextIndex
        playerDirection = step > 0 ? .east : .west
        let station: MetroStation = line.stations[nextIndex]
        visitedStationIDs.insert(station.id)
        dialogueOverride = "Next stop: \(station.name). The carriage rattles through a cobalt tunnel."
    }

    private func bestTransferIndex(on targetLine: MetroLine) -> Int? {
        let stationName: String = currentStation.name
        if let sameNameIndex = targetLine.stations.firstIndex(where: { $0.name == stationName }) {
            return sameNameIndex
        }

        let currentTransfers: [String] = currentStation.transferLineIDs
        if currentTransfers.contains(targetLine.id), let sharedIndex = targetLine.stations.firstIndex(where: { $0.isTransfer }) {
            return sharedIndex
        }

        return nil
    }
}
