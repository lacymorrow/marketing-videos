// fnkey: hold or tap the fn (globe) key, which juno-cua cannot send.
// usage: fnkey down | fnkey up | fnkey hold <ms> [ctrl]
// Posts a flagsChanged event for kVK_Function (63) with the SecondaryFn flag,
// the same shape a real globe key produces, so Juno's trigger tap sees it.
import CoreGraphics
import Foundation

let fnCode: CGKeyCode = 63
let ctrlCode: CGKeyCode = 59

func post(_ code: CGKeyCode, down: Bool, flags: CGEventFlags) {
    let src = CGEventSource(stateID: .hidSystemState)
    guard let e = CGEvent(keyboardEventSource: src, virtualKey: code, keyDown: down) else { exit(2) }
    e.type = .flagsChanged
    e.flags = flags
    e.post(tap: .cghidEventTap)
}

let args = CommandLine.arguments.dropFirst()
let withCtrl = args.contains("ctrl")
func down() {
    post(fnCode, down: true, flags: .maskSecondaryFn)
    if withCtrl { post(ctrlCode, down: true, flags: [.maskSecondaryFn, .maskControl]) }
}
func up() {
    if withCtrl { post(ctrlCode, down: false, flags: .maskSecondaryFn) }
    post(fnCode, down: false, flags: [])
}
switch args.first {
case "down": down()
case "up": up()
case "hold":
    let ms = Double(args.dropFirst().first ?? "1200") ?? 1200
    down(); usleep(useconds_t(ms * 1000)); up()
default:
    FileHandle.standardError.write("usage: fnkey down|up|hold <ms> [ctrl]\n".data(using: .utf8)!); exit(64)
}
