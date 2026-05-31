import SwiftUI

struct LineMapView: View {
    let game: MetroGameViewModel

    var body: some View {
        RetroGlassPanel(accent: game.currentLine.accent) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("All current lines")
                        .font(.system(size: 16, weight: .black, design: .monospaced))
                        .foregroundStyle(Color.tileCream)
                        .textCase(.uppercase)
                    Spacer()
                    Text("\(game.visitedStationIDs.count)/\(MetroData.allStations.count)")
                        .font(.system(size: 12, weight: .black, design: .monospaced))
                        .foregroundStyle(Color.retroInk)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.metroYellow)
                }

                VStack(spacing: 12) {
                    ForEach(MetroData.lines) { line in
                        LineStripView(line: line, game: game)
                    }
                }
            }
        }
    }
}

private struct LineStripView: View {
    let line: MetroLine
    let game: MetroGameViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 8) {
                Text("L\(line.number)")
                    .font(.system(size: 12, weight: .black, design: .monospaced))
                    .foregroundStyle(Color.retroInk)
                    .frame(width: 32, height: 24)
                    .background(line.accent)
                Text(line.name)
                    .font(.system(size: 11, weight: .heavy, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.86))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Spacer()
                Text("\(line.stations.count)")
                    .font(.system(size: 10, weight: .black, design: .monospaced))
                    .foregroundStyle(line.accent)
            }

            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.white.opacity(0.16))
                        .frame(height: 4)
                        .position(x: proxy.size.width / 2, y: 14)
                    Rectangle()
                        .fill(line.accent)
                        .frame(width: progressWidth(in: proxy.size.width), height: 4)
                        .position(x: progressWidth(in: proxy.size.width) / 2, y: 14)
                    ForEach(line.stations) { station in
                        let xPosition: CGFloat = stationPosition(station.index, count: line.stations.count, width: proxy.size.width)
                        Circle()
                            .fill(dotColor(for: station))
                            .frame(width: station.index == game.stationIndex(for: line.id) && game.selectedLineID == line.id ? 15 : 10)
                            .overlay {
                                Circle().stroke(station.isTransfer ? Color.metroYellow : Color.retroInk, lineWidth: station.isTransfer ? 2 : 1)
                            }
                            .position(x: xPosition, y: 14)
                    }
                }
            }
            .frame(height: 28)

            ScrollView(.horizontal) {
                HStack(spacing: 6) {
                    ForEach(line.stations) { station in
                        Text(station.name)
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .foregroundStyle(station.id == game.currentStation.id ? Color.retroInk : Color.tileCream.opacity(0.82))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 4)
                            .background(station.id == game.currentStation.id ? line.accent : Color.retroInk.opacity(0.68))
                    }
                    ForEach(line.plannedStations, id: \.self) { plannedStation in
                        Text("\(plannedStation)*")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.46))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.08))
                    }
                }
            }
            .scrollIndicators(.hidden)

            if line.id == "L5" {
                Text("* planned eastward stations shown for route awareness")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.52))
            }
        }
        .padding(10)
        .background(line.id == game.selectedLineID ? line.darkAccent.opacity(0.38) : Color.black.opacity(0.18))
        .overlay {
            Rectangle().stroke(line.accent.opacity(line.id == game.selectedLineID ? 0.75 : 0.25), lineWidth: 1)
        }
    }

    private func stationPosition(_ index: Int, count: Int, width: CGFloat) -> CGFloat {
        guard count > 1 else { return width / 2 }
        return CGFloat(index) / CGFloat(count - 1) * width
    }

    private func progressWidth(in width: CGFloat) -> CGFloat {
        let count: Int = line.stations.count
        guard count > 1 else { return width }
        let currentIndex: Int = game.stationIndex(for: line.id)
        return CGFloat(currentIndex) / CGFloat(count - 1) * width
    }

    private func dotColor(for station: MetroStation) -> Color {
        if station.id == game.currentStation.id && line.id == game.selectedLineID { return Color.metroYellow }
        if game.isVisited(station) { return line.accent }
        return Color(hex: 0x26344D)
    }
}
