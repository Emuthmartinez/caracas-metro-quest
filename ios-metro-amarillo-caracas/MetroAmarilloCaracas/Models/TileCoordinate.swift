import Foundation

struct TileCoordinate: Identifiable, Hashable {
    let x: Int
    let y: Int

    var id: String { "\(x)-\(y)" }

    static func grid(width: Int, height: Int) -> [TileCoordinate] {
        (0..<height).flatMap { row in
            (0..<width).map { column in
                TileCoordinate(x: column, y: row)
            }
        }
    }
}
