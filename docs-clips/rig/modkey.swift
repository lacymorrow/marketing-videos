// modkey: press modifier keys the way a keyboard does (flagsChanged events),
// which juno-cua cannot send for fn or for one side of Option.
// usage: modkey down|up <key>... | modkey hold <ms> <key>...
// keys: fn ctrl ropt opt cmd shift   e.g. `modkey hold 1500 fn ctrl`
import CoreGraphics
import Foundation

// Each key also carries its side's device bit (NX_DEVICEL/R*KEYMASK), as a real
// keyboard sends: apps that tell Left from Right Option (Juno does, 0x40) read it.
let table: [String: (CGKeyCode, CGEventFlags)] = [
    "fn": (63, .maskSecondaryFn), "ctrl": (59, [.maskControl, CGEventFlags(rawValue: 0x1)]),
    "opt": (58, [.maskAlternate, CGEventFlags(rawValue: 0x20)]),
    "ropt": (61, [.maskAlternate, CGEventFlags(rawValue: 0x40)]),
    "cmd": (55, [.maskCommand, CGEventFlags(rawValue: 0x8)]),
    "shift": (56, [.maskShift, CGEventFlags(rawValue: 0x2)]),
]
var args = Array(CommandLine.arguments.dropFirst())
guard let verb = args.first else { exit(64) }
args.removeFirst()
var ms = 1200.0
if verb == "hold", let first = args.first, let v = Double(first) { ms = v; args.removeFirst() }
let keys = args.compactMap { table[$0] }
guard !keys.isEmpty, keys.count == args.count else {
    FileHandle.standardError.write("usage: modkey down|up|hold [ms] fn|ctrl|opt|ropt|cmd|shift...\n".data(using: .utf8)!); exit(64)
}
let src = CGEventSource(stateID: .hidSystemState)
func post(_ code: CGKeyCode, _ down: Bool, _ flags: CGEventFlags) {
    guard let e = CGEvent(keyboardEventSource: src, virtualKey: code, keyDown: down) else { exit(2) }
    // 0x100 is the non-coalesced bit hardware sets on every modifier event.
    e.type = .flagsChanged; e.flags = flags.union(CGEventFlags(rawValue: 0x100)); e.post(tap: .cghidEventTap)
}
func press() { var f = CGEventFlags(); for (c, m) in keys { f.insert(m); post(c, true, f); usleep(20_000) } }
func release() { var f = CGEventFlags(); for (_, m) in keys { f.insert(m) }
    for (c, m) in keys.reversed() { f.remove(m); post(c, false, f); usleep(20_000) } }
switch verb {
case "down": press()
case "up": release()
case "hold": press(); usleep(useconds_t(ms * 1000)); release()
default: exit(64)
}
