import SwiftUI
import UIKit
import AVFoundation

/// First-person POV shown while Salvo is riding: a seamless looping pixel-art
/// view from inside the carriage. The clip changes per zone of Caracas
/// (`MetroArea`) so the city out the window matches where the train is.
/// Generated with Higgsfield.
struct RidingTunnelView: View {
    /// Bundled mp4 resource name (without extension) for the current zone.
    let resource: String

    var body: some View {
        LoopingVideoView(resource: resource)
            .background(Color(hex: 0x06101D))
            .accessibilityLabel("Riding the metro — the view from inside Salvo's carriage")
    }
}

/// Wraps an AVPlayerLayer that loops a bundled clip, muted, with nearest-neighbor
/// upscaling so the pixel art stays crisp. Reloads when `resource` changes.
private struct LoopingVideoView: UIViewRepresentable {
    let resource: String

    func makeUIView(context: Context) -> LoopingPlayerUIView {
        LoopingPlayerUIView(resource: resource)
    }

    func updateUIView(_ uiView: LoopingPlayerUIView, context: Context) {
        uiView.load(resource: resource) // no-op if already showing this clip
    }

    static func dismantleUIView(_ uiView: LoopingPlayerUIView, coordinator: ()) {
        uiView.stop()
    }
}

final class LoopingPlayerUIView: UIView {
    private let queuePlayer = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private let playerLayer = AVPlayerLayer()
    private var currentResource: String?

    init(resource: String) {
        super.init(frame: .zero)
        backgroundColor = UIColor(red: 0.024, green: 0.063, blue: 0.114, alpha: 1) // 0x06101D
        queuePlayer.isMuted = true                 // real Caracas audio is layered separately
        queuePlayer.actionAtItemEnd = .advance
        playerLayer.player = queuePlayer
        playerLayer.videoGravity = .resizeAspectFill
        playerLayer.magnificationFilter = .nearest // keep chunky pixels chunky
        playerLayer.minificationFilter = .nearest
        layer.addSublayer(playerLayer)
        load(resource: resource)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    /// Swap to a new clip. Falls back to the generic ride loop, then to a dark
    /// panel, so a missing zone asset never blanks the screen.
    func load(resource: String) {
        guard resource != currentResource else { return }
        let url = Bundle.main.url(forResource: resource, withExtension: "mp4")
            ?? Bundle.main.url(forResource: "ride_loop", withExtension: "mp4")
        guard let url else { return }
        currentResource = resource

        let item = AVPlayerItem(url: url)
        queuePlayer.removeAllItems()
        looper = AVPlayerLooper(player: queuePlayer, templateItem: item)
        queuePlayer.play()
    }

    func stop() {
        queuePlayer.pause()
        queuePlayer.removeAllItems()
        looper = nil
        currentResource = nil
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer.frame = bounds
    }
}
