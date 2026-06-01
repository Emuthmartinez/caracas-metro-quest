import Foundation
import Observation

@Observable
final class MetroGameViewModel {
    var selectedLineID: String = Protagonist.homeLineID
    var stationIndexByLineID: [String: Int] = ["L1": 0, "L2": 0, "L3": Protagonist.homeStationIndex, "L4": 0, "L5": 0]
    var phase: GamePhase = .station
    var playerDirection: PlayerDirection = .south
    var dialogueOverride: String? = Protagonist.intro
    var visitedStationIDs: Set<String> = [Protagonist.homeStationID]
    var npcLineIndex: [String: Int] = [:]

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
        if currentStation.id == Protagonist.homeStationID {
            return Protagonist.homePlatformLine
        }
        if currentStation.isTransfer {
            return "Transfer hub detected. Pick a color line and continue your route."
        }
        return "Estás en \(currentStation.name). Revisa el andén, habla con la gente, o móntate en el tren."
    }

    func boardOrExitTrain() {
        dialogueOverride = nil
        AudioManager.shared.playDoorChime()
        switch phase {
        case .station:
            phase = .ride
            AudioManager.shared.enterRide(area: MetroArea.area(forStationID: currentStation.id).rawValue)
        case .ride:
            phase = .station
            visitedStationIDs.insert(currentStation.id)
            AudioManager.shared.enterStation()
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
        AudioManager.shared.playLineBlip(line: Int(targetLine.number) ?? 1)
        AudioManager.shared.enterStation()
        dialogueOverride = "Cambiaste a \(targetLine.displayName). Los carteles del andén titilan en su color."
    }

    func talk() {
        AudioManager.shared.playTalkBlip()
        guard let npc = currentNPC, !npc.dialoguePool.isEmpty else {
            dialogueOverride = "Un pasajero callado señala el mapa y mira hacia el próximo tren."
            return
        }
        let nextIndex = ((npcLineIndex[npc.id] ?? 0) + 1) % npc.dialoguePool.count
        npcLineIndex[npc.id] = nextIndex
        dialogueOverride = "\(npc.name): \"\(npc.dialoguePool[nextIndex])\""
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
            dialogueOverride = "Móntate primero, chamo. Las puertas parpadean en amarillo al lado del andén."
            return
        }

        let line: MetroLine = currentLine
        let currentIndex: Int = stationIndexByLineID[line.id] ?? 0
        let nextIndex: Int = min(max(currentIndex + step, 0), line.stations.count - 1)
        guard nextIndex != currentIndex else {
            dialogueOverride = step > 0 ? "Fin de la línea. El conductor espera la señal de regreso." : "Esta es la primera parada de la ruta."
            return
        }

        stationIndexByLineID[line.id] = nextIndex
        playerDirection = step > 0 ? .east : .west
        let station: MetroStation = line.stations[nextIndex]
        visitedStationIDs.insert(station.id)
        AudioManager.shared.playArrival()
        AudioManager.shared.maybeGuacamaya()
        AudioManager.shared.enterRide(area: MetroArea.area(forStationID: station.id).rawValue) // rumble follows the zone
        dialogueOverride = "Próxima estación: \(station.name). El vagón traquetea por el túnel."
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
