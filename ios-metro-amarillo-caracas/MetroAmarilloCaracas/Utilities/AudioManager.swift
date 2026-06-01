import Foundation
import AVFoundation

/// The sounds of Caracas — fully synthesized 4-bit-style chiptune so it matches
/// the Game Boy aesthetic and carries no sample-licensing baggage. One real-ish
/// texture: the guacamaya (macaw) shriek, the signature sound of the Caracas sky.
///
/// Uses an `.ambient` session so it respects the hardware silent switch and
/// mixes with whatever music the player already has going.
final class AudioManager {
    static let shared = AudioManager()

    private let engine = AVAudioEngine()
    private let sfxNode = AVAudioPlayerNode()     // door, arrival, guacamaya
    private let blipNode = AVAudioPlayerNode()    // talk + line-select blips
    private let ambientNode = AVAudioPlayerNode() // looping platform / ride bed
    private let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
    private let sampleRate: Double = 44_100

    private var started = false
    private var currentAmbient: String?

    // Pre-rendered buffers (built lazily, once).
    private lazy var doorBuf = renderDoorChime()
    private lazy var talkBuf = renderTalkBlip()
    private lazy var arrivalBuf = renderArrivalArpeggio()
    private lazy var platformBuf = renderPlatformHum()
    private lazy var guacamayaBuf = renderGuacamaya()
    private var rumbleCache: [String: AVAudioPCMBuffer] = [:]

    var isMuted: Bool {
        didSet {
            UserDefaults.standard.set(isMuted, forKey: Self.muteKey)
            if started { engine.mainMixerNode.outputVolume = isMuted ? 0 : 1 }
        }
    }
    private static let muteKey = "cmq_audio_muted"

    private init() {
        isMuted = UserDefaults.standard.bool(forKey: Self.muteKey)
    }

    // MARK: - Lifecycle

    func start() {
        guard !started else { return }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            return
        }
        for node in [sfxNode, blipNode, ambientNode] {
            engine.attach(node)
            engine.connect(node, to: engine.mainMixerNode, format: format)
        }
        engine.mainMixerNode.outputVolume = isMuted ? 0 : 1
        do { try engine.start() } catch { return }
        sfxNode.play(); blipNode.play(); ambientNode.play()
        started = true
    }

    // MARK: - One-shots

    func playDoorChime() { schedule(doorBuf, on: sfxNode) }
    func playTalkBlip()  { schedule(talkBuf, on: blipNode) }
    func playArrival()   { schedule(arrivalBuf, on: sfxNode) }
    func playGuacamaya() { schedule(guacamayaBuf, on: sfxNode) }
    func playLineBlip(line: Int) { schedule(renderLineBlip(line: line), on: blipNode) }

    /// Occasionally let a macaw cross the sky (≈1 in 4 arrivals).
    func maybeGuacamaya() { if Int.random(in: 0..<4) == 0 { playGuacamaya() } }

    // MARK: - Ambient bed

    func enterStation() { loopAmbient(platformBuf, key: "platform") }

    /// Ride bed, tinted per zone: deep underground, airy on the aerial viaduct,
    /// sparse and ghostly on the frozen Línea 5.
    func enterRide(area: String = "deep") {
        let variant = Self.rumbleVariant(for: area)
        loopAmbient(rumbleBuffer(variant), key: "ride-\(variant)")
    }

    private static func rumbleVariant(for area: String) -> String {
        switch area {
        case "oeste": return "aerial"
        case "phantom": return "ghost"
        default: return "deep"
        }
    }

    private func rumbleBuffer(_ variant: String) -> AVAudioPCMBuffer? {
        if let cached = rumbleCache[variant] { return cached }
        let buffer: AVAudioPCMBuffer?
        switch variant {
        case "aerial": buffer = renderRideRumble(level: 0.9, baseFreq: 66, noiseLP: 0.020, wind: 0.05)
        case "ghost":  buffer = renderRideRumble(level: 0.4, baseFreq: 50, noiseLP: 0.008, wind: 0.0)
        default:       buffer = renderRideRumble(level: 1.0, baseFreq: 58, noiseLP: 0.012, wind: 0.0)
        }
        rumbleCache[variant] = buffer
        return buffer
    }

    private func schedule(_ buffer: AVAudioPCMBuffer?, on node: AVAudioPlayerNode) {
        guard started, let buffer else { return }
        node.scheduleBuffer(buffer, at: nil, options: .interrupts, completionHandler: nil)
    }

    private func loopAmbient(_ buffer: AVAudioPCMBuffer?, key: String) {
        guard started, let buffer, currentAmbient != key else { return }
        currentAmbient = key
        ambientNode.stop()
        ambientNode.scheduleBuffer(buffer, at: nil, options: .loops, completionHandler: nil)
        ambientNode.play()
    }

    // MARK: - Synthesis

    private func makeBuffer(seconds: Double) -> AVAudioPCMBuffer? {
        let frames = AVAudioFrameCount(seconds * sampleRate)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else { return nil }
        buffer.frameLength = frames
        return buffer
    }

    private func square(_ phase: Double, duty: Double = 0.5) -> Float {
        phase.truncatingRemainder(dividingBy: 1.0) < duty ? 1.0 : -1.0
    }
    private func triangle(_ phase: Double) -> Float {
        let p: Double = phase - floor(phase + 0.5)
        return Float(2.0 * abs(2.0 * p) - 1.0)
    }
    private func saw(_ phase: Double) -> Float {
        Float(2.0 * (phase - floor(phase)) - 1.0)
    }

    /// Attack/release envelope to kill clicks.
    private func env(_ i: Int, total: Int, attack: Double = 0.006, release: Double = 0.03) -> Float {
        let t = Double(i) / sampleRate
        let dur = Double(total) / sampleRate
        let a = min(1, t / attack)
        let r = min(1, (dur - t) / release)
        return Float(max(0, min(a, r)))
    }

    /// Two descending buzzing tones — the "cierre de puertas" warning, Caracas/Paris
    /// flavor (NOT the NYC ascending bing-bong).
    private func renderDoorChime() -> AVAudioPCMBuffer? {
        guard let buf = makeBuffer(seconds: 0.46) else { return nil }
        let p = buf.floatChannelData![0]
        let n = Int(buf.frameLength)
        let t1End = Int(0.18 * sampleRate)
        let t2Start = Int(0.22 * sampleRate)
        var ph1 = 0.0, ph2 = 0.0, phBuzz = 0.0
        let f1 = 466.0, f2 = 349.0, buzz = 42.0
        for i in 0..<n {
            var s: Float = 0
            phBuzz += buzz / sampleRate
            let buzzMod = 0.84 + 0.16 * Double(square(phBuzz)) // gentler buzz, less rattly
            if i < t1End {
                ph1 += f1 / sampleRate
                s = square(ph1, duty: 0.5) * env(i, total: t1End) * Float(buzzMod) * 0.15
            } else if i >= t2Start {
                ph2 += f2 / sampleRate
                let j = i - t2Start
                s = square(ph2, duty: 0.5) * env(j, total: n - t2Start) * Float(buzzMod) * 0.15
            }
            p[i] = s
        }
        return buf
    }

    private func renderTalkBlip() -> AVAudioPCMBuffer? {
        guard let buf = makeBuffer(seconds: 0.07) else { return nil }
        let p = buf.floatChannelData![0]
        let n = Int(buf.frameLength)
        var ph = 0.0
        for i in 0..<n {
            ph += 520.0 / sampleRate
            let decay = Float(pow(1 - Double(i) / Double(n), 1.5))
            p[i] = square(ph, duty: 0.5) * decay * 0.12
        }
        return buf
    }

    /// Two-note blip; pitch rises per line so each color sounds distinct.
    private func renderLineBlip(line: Int) -> AVAudioPCMBuffer? {
        guard let buf = makeBuffer(seconds: 0.13) else { return nil }
        let p = buf.floatChannelData![0]
        let n = Int(buf.frameLength)
        let step: Double = Double(max(1, min(line, 5)) - 1)
        let base: Double = 294.0 * pow(2.0, step / 6.0) // ~D4, up a step per line
        let half = n / 2
        var ph = 0.0
        for i in 0..<n {
            let freq = i < half ? base : base * 9.0 / 8.0 // up a major second
            ph += freq / sampleRate
            p[i] = square(ph, duty: 0.5) * env(i, total: n, attack: 0.004, release: 0.02) * 0.15
        }
        return buf
    }

    /// A little plucked four-string (cuatro) arpeggio on arrival.
    private func renderArrivalArpeggio() -> AVAudioPCMBuffer? {
        let notes = [220.0, 277.18, 329.63, 440.0] // A3 C#4 E4 A4
        let noteFrames = Int(0.085 * sampleRate)
        guard let buf = makeBuffer(seconds: Double(noteFrames * notes.count) / sampleRate) else { return nil }
        let p = buf.floatChannelData![0]
        for (idx, freq) in notes.enumerated() {
            var ph = 0.0
            let start = idx * noteFrames
            for j in 0..<noteFrames {
                ph += freq / sampleRate
                let decay = Float(pow(1 - Double(j) / Double(noteFrames), 2.2)) // plucked
                p[start + j] = triangle(ph) * decay * 0.22
            }
        }
        return buf
    }

    /// Low warm station hum — 2s seamless loop (integer periods at 110/55 Hz).
    private func renderPlatformHum() -> AVAudioPCMBuffer? {
        guard let buf = makeBuffer(seconds: 2.0) else { return nil }
        let p = buf.floatChannelData![0]
        let n = Int(buf.frameLength)
        var ph1 = 0.0, ph2 = 0.0, lp: Float = 0
        for i in 0..<n {
            ph1 += 110.0 / sampleRate
            ph2 += 55.0 / sampleRate
            let noise = Float.random(in: -1...1)
            lp += 0.02 * (noise - lp) // heavy low-pass → distant murmur
            let driftD: Double = 0.85 + 0.15 * sin(Double(i) / sampleRate * 2.0 * .pi * 0.5)
            let toneD: Double = sin(2.0 * .pi * ph1) * 0.045 + sin(2.0 * .pi * ph2) * 0.04
            let sample: Double = (toneD + Double(lp) * 0.5) * driftD
            p[i] = Float(sample)
        }
        return buf
    }

    /// Steel-wheel tunnel rumble — 2s seamless loop, low brown-ish noise + a low
    /// fundamental. Parametrized so each zone gets its own character.
    private func renderRideRumble(level: Double = 1.0, baseFreq: Double = 58, noiseLP: Double = 0.012, wind: Double = 0.0) -> AVAudioPCMBuffer? {
        guard let buf = makeBuffer(seconds: 2.0) else { return nil }
        let p = buf.floatChannelData![0]
        let n = Int(buf.frameLength)
        var ph = 0.0, brown: Float = 0, windLP: Float = 0
        let lp = Float(noiseLP)
        for i in 0..<n {
            ph += baseFreq / sampleRate
            let white = Float.random(in: -1...1)
            brown += lp * (white - brown)              // darker = lower coefficient
            let gust = Float.random(in: -1...1)
            windLP += 0.08 * (gust - windLP)           // airy high-passed wind for the viaduct
            let swayD: Double = 0.82 + 0.18 * sin(Double(i) / sampleRate * 2.0 * .pi * 1.5)
            let tickPhase: Double = (Double(i) / sampleRate).truncatingRemainder(dividingBy: 0.7)
            let tick: Double = tickPhase < 0.008 ? (1.0 - tickPhase / 0.008) * 0.03 : 0.0
            let toneD: Double = Double(brown) * 1.7 + sin(2.0 * .pi * ph) * 0.06 + Double(windLP) * wind
            p[i] = Float((toneD * swayD + tick) * level)
        }
        return buf
    }

    /// The guacamaya — a harsh descending squawk, the sound of the Caracas sky.
    private func renderGuacamaya() -> AVAudioPCMBuffer? {
        guard let buf = makeBuffer(seconds: 0.5) else { return nil }
        let p = buf.floatChannelData![0]
        let n = Int(buf.frameLength)
        let chirps = 2
        let chirpFrames = n / chirps
        for c in 0..<chirps {
            var ph = 0.0
            let start = c * chirpFrames
            for j in 0..<chirpFrames {
                let frac = Double(j) / Double(chirpFrames)
                let freq = 1300.0 - 650.0 * frac                       // descending
                let vibrato = 1 + 0.06 * sin(Double(j) / sampleRate * 2 * .pi * 30)
                ph += (freq * vibrato) / sampleRate
                let body = saw(ph) * 0.72 + Float.random(in: -1...1) * 0.28 // raspy but less hissy
                p[start + j] = body * env(j, total: chirpFrames, attack: 0.01, release: 0.06) * 0.15
            }
        }
        return buf
    }
}
