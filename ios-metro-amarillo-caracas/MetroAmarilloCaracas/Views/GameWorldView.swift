import SwiftUI

struct GameWorldView: View {
    let line: MetroLine
    let station: MetroStation
    let npc: MetroNPC?
    let phase: GamePhase
    let direction: PlayerDirection

    private let tiles: [TileCoordinate] = TileCoordinate.grid(width: 12, height: 9)
    private let columns: [GridItem] = Array(repeating: GridItem(.flexible(), spacing: 0), count: 12)

    var body: some View {
        ZStack {
            LazyVGrid(columns: columns, spacing: 0) {
                ForEach(tiles) { tile in
                    PixelTileView(coordinate: tile, station: station, line: line, phase: phase)
                        .aspectRatio(1, contentMode: .fit)
                }
            }
            .overlay(alignment: .top) {
                stationSign
            }
            .overlay(alignment: .bottom) {
                PlatformTickerView(line: line, station: station)
                    .padding(.bottom, 8)
            }

            PixelTrainView(line: line, phase: phase)
                .offset(x: phase == .ride ? 4 : 112, y: -10)

            if let npc, phase == .station {
                PixelNPCView(npc: npc)
                    .offset(x: -86, y: 46)
                    .transition(.scale.combined(with: .opacity))
            }

            PixelPlayerView(direction: direction, accent: line.accent)
                .offset(x: phase == .ride ? -6 : 18, y: phase == .ride ? -4 : 56)
        }
        .padding(8)
        .background(Color(hex: 0x06101D))
        .overlay {
            Rectangle().stroke(Color.white.opacity(0.35), lineWidth: 4)
        }
        .shadow(color: Color.black.opacity(0.45), radius: 0, x: 7, y: 7)
        .animation(.spring(response: 0.35, dampingFraction: 0.75), value: station.id)
        .animation(.spring(response: 0.38, dampingFraction: 0.72), value: phase)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Retro station view for \(station.name) on Línea \(line.number)")
    }

    private var stationSign: some View {
        HStack(spacing: 8) {
            Text("L\(line.number)")
                .font(.system(size: 12, weight: .black, design: .monospaced))
                .foregroundStyle(Color.retroInk)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(line.accent)
            Text(station.name)
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(Color.tileCream)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
            if station.isTransfer {
                Text("TRANSFER")
                    .font(.system(size: 8, weight: .black, design: .monospaced))
                    .foregroundStyle(Color.retroInk)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 3)
                    .background(Color.metroYellow)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity)
        .background(Color.retroInk.opacity(0.92))
    }
}

private struct PlatformTickerView: View {
    let line: MetroLine
    let station: MetroStation

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<min(line.stations.count, 14), id: \.self) { index in
                Rectangle()
                    .fill(index <= station.index ? line.accent : Color.white.opacity(0.22))
                    .frame(width: index == station.index ? 16 : 7, height: 5)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(Color.retroInk.opacity(0.82))
    }
}
