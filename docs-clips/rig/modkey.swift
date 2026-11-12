// modkey: press modifier keys the way a keyboard does (flagsChanged events),
// which juno-cua cannot send for fn or for one side of Option.
// usage: modkey down|up <key>... | modkey hold <ms> <key>...
// keys: fn ctrl ropt opt cmd shift   e.g. `modkey hold 1500 fn ctrl`
import CoreGraphics
import Foundation

let table: [String: (CGKeyCode, CGEventFlags)] = [
    "fn": (63, .maskSecondaryFn), "ctrl": (59, .maskControl),
    "opt": (58, .maskAlternate), "ropt": (61, .maskAlternate),
    "cmd": (55, .maskCommand), "shift": (56, .maskShift),
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
    e.type = .flagsChanged; e.flags = flags; e.post(tap: .cghidEventTap)
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
