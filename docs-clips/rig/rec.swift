// rec: record the main display with ScreenCaptureKit until SIGINT/SIGTERM.
// usage: rec <out.mov> [scale=0.5]
// Writes <out.mov> (H.264, display points * 2 * scale) and <out.mov>.t0, the
// Unix time in seconds of the first frame, so a script's event log (same
// clock) maps onto the video exactly.
import AVFoundation
import CoreMedia
import Foundation
import ScreenCaptureKit

final class Recorder: NSObject, SCStreamOutput {
    let writer: AVAssetWriter
    let input: AVAssetWriterInput
    let t0Path: String
    var started = false
    var stream: SCStream?

    init(out: URL, width: Int, height: Int) throws {
        try? FileManager.default.removeItem(at: out)
        writer = try AVAssetWriter(outputURL: out, fileType: .mov)
        input = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: width, AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 12_000_000],
        ])
        input.expectsMediaDataInRealTime = true
        writer.add(input)
        t0Path = out.path + ".t0"
    }

    func stream(_ s: SCStream, didOutputSampleBuffer sb: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .screen, sb.isValid,
              let att = CMSampleBufferGetSampleAttachmentsArray(sb, createIfNecessary: false) as? [[SCStreamFrameInfo: Any]],
              let raw = att.first?[.status] as? Int, SCFrameStatus(rawValue: raw) == .complete else { return }
        let pts = CMSampleBufferGetPresentationTimeStamp(sb)
        if !started {
            // pts is on the host clock; convert to wall time once.
            let hostNow = CMClockGetTime(CMClockGetHostTimeClock())
            let age = CMTimeGetSeconds(CMTimeSubtract(hostNow, pts))
            let wall = Date().timeIntervalSince1970 - age
            try? String(format: "%.4f", wall).write(toFile: t0Path, atomically: true, encoding: .utf8)
            writer.startWriting()
            writer.startSession(atSourceTime: pts)
            started = true
        }
        if input.isReadyForMoreMediaData { input.append(sb) }
    }

    func finish() {
        let sem = DispatchSemaphore(value: 0)
        stream?.stopCapture { _ in sem.signal() }
        sem.wait()
        input.markAsFinished()
        writer.finishWriting { sem.signal() }
        sem.wait()
    }
}

let args = CommandLine.arguments
guard args.count >= 2 else { FileHandle.standardError.write("usage: rec <out.mov> [scale]\n".data(using: .utf8)!); exit(64) }
let scale = args.count > 2 ? Double(args[2]) ?? 0.5 : 0.5
var recorder: Recorder!

let ready = DispatchSemaphore(value: 0)
Task {
    do {
        let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
        guard let display = content.displays.first(where: { $0.displayID == CGMainDisplayID() }) ?? content.displays.first else { exit(3) }
        let w = Int(Double(display.width) * 2 * scale) & ~1
        let h = Int(Double(display.height) * 2 * scale) & ~1
        let cfg = SCStreamConfiguration()
        cfg.width = w; cfg.height = h
        cfg.minimumFrameInterval = CMTime(value: 1, timescale: 30)
        cfg.showsCursor = true
        cfg.queueDepth = 6
        let filter = SCContentFilter(display: display, excludingWindows: [])
        recorder = try Recorder(out: URL(fileURLWithPath: args[1]), width: w, height: h)
        let stream = SCStream(filter: filter, configuration: cfg, delegate: nil)
        try stream.addStreamOutput(recorder, type: .screen, sampleHandlerQueue: DispatchQueue(label: "rec"))
        try await stream.startCapture()
        recorder.stream = stream
        print("recording \(w)x\(h) points=\(display.width)x\(display.height)")
        fflush(stdout)
    } catch {
        FileHandle.standardError.write("rec failed: \(error)\n".data(using: .utf8)!); exit(1)
    }
    ready.signal()
}
ready.wait()

for sig in [SIGINT, SIGTERM] {
    signal(sig, SIG_IGN)
    let src = DispatchSource.makeSignalSource(signal: sig, queue: .main)
    src.setEventHandler { recorder.finish(); exit(0) }
    src.resume()
    _ = Unmanaged.passRetained(src)
}
dispatchMain()
