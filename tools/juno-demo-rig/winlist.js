ObjC.import("CoreGraphics");
const list = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0);
const arr = ObjC.deepUnwrap(ObjC.castRefToObject(list)) || [];
const out = [];
for (const d of arr) {
  const b = d.kCGWindowBounds || {};
  out.push([d.kCGWindowOwnerName, d.kCGWindowName || "", d.kCGWindowNumber, Math.round(b.X) + "," + Math.round(b.Y) + " " + Math.round(b.Width) + "x" + Math.round(b.Height), "L" + d.kCGWindowLayer].join(" | "));
}
"count=" + arr.length + "\n" + out.join("\n");
