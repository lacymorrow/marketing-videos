// usage: osascript -l JavaScript holdkey.js down|up [keycode]   (default 61 = Right Option, the Juno talk key)
// modifier keys reach apps as flagsChanged events, so the event is retyped and carries the Option flags;
// cliclick kd:/ku: only knows the left Option key, and Juno's talk trigger is bound to the right one
ObjC.import("CoreGraphics");
function run(argv) {
  var down = argv[0] !== "up";
  var code = argv.length > 1 ? parseInt(argv[1], 10) : 61;
  var e = $.CGEventCreateKeyboardEvent(null, code, down);
  if (code === 61 || code === 58) {
    $.CGEventSetType(e, 12);
    $.CGEventSetFlags(e, down ? (0x80000 | (code === 61 ? 0x40 : 0x20) | 0x100) : 0x100);
  }
  $.CGEventPost(0, e);
  return (down ? "down" : "up") + " " + code;
}
