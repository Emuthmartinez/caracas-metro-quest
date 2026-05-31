import Foundation

struct MetroStation: Identifiable, Hashable {
    let id: String
    let name: String
    let lineID: String
    let index: Int
    let isTransfer: Bool
    let transferLineIDs: [String]
    let isOperational: Bool
}
