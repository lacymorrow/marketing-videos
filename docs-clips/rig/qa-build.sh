#!/usr/bin/env bash
# qa-build.sh <path-to-Juno.app> <scene>...: run scenes on a test build, then put the installed Juno back.
# Runs on graphite. The installed app is moved aside, never deleted; an EXIT trap restores it.
set -uo pipefail
export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH
RIG=~/.cache/juno-docs-rig; source "$RIG/lib.sh"; set +e
test_app=$1; shift
keep="$RIG/app-installed"
[ -d "$keep" ] && { echo "app-installed already exists; a previous run did not restore. Stop." >&2; exit 1; }
prof="$RIG/profile/app_settings.json"
put_back() {
  quit_juno
  [ -f "$prof.qa-orig" ] && mv "$prof.qa-orig" "$prof"
  if [ -d "$keep/Juno.app" ]; then
    [ -d /Applications/Juno.app ] && mv /Applications/Juno.app "$RIG/used/Juno-test-$(date +%Y%m%d-%H%M%S).app"
    mv "$keep/Juno.app" /Applications/Juno.app && rmdir "$keep"
    open -a /Applications/Juno.app
    echo "restored $(defaults read /Applications/Juno.app/Contents/Info.plist CFBundleShortVersionString)"
  fi
}
trap put_back EXIT
quit_juno || { echo "Juno would not quit" >&2; exit 1; }
# The test build is older than the release, so the updater would replace it on the first quit.
cp -p "$prof" "$prof.qa-orig"
python3 -c "import json,sys;p=sys.argv[1];d=json.load(open(p));d['updates']['auto_check_enabled']=False;json.dump(d,open(p,'w'),indent=2)" "$prof"
mkdir -p "$keep" "$RIG/used" && mv /Applications/Juno.app "$keep/Juno.app"
ditto "$test_app" /Applications/Juno.app
echo "testing $(defaults read /Applications/Juno.app/Contents/Info.plist CFBundleShortVersionString)"
for s in "$@"; do
  while [ "$(ioreg -c IOHIDSystem | awk '/HIDIdleTime/{print int($NF/1e9); exit}')" -lt 300 ]; do sleep 20; done
  v=$(defaults read /Applications/Juno.app/Contents/Info.plist CFBundleShortVersionString); echo "=== $s on $v"; bash "$RIG/scenes.sh" "$s" 2>&1 | grep -v "^dry run" | tail -8
done
