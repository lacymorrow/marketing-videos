#!/usr/bin/env bash
# One function per docs clip. Run on graphite: `bash scenes.sh <scene>|all`.
# Each scene starts from the clip profile (reset_juno), so it comes out the
# same every release. A missing AX target fails the scene, which is the point:
# the docs page then needs a new clip instead of silently showing an old UI.
here=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=lib.sh
source "$here/lib.sh"

need() { # need <app> <text> -> "x y w h", or fail the scene
  local r; r=$(locate "$@") || { echo "scene failed: no AX element '$2' in $1" >&2; exit 2; }
  echo "$r"
}
open_settings() {
  osascript -e 'tell application "Juno" to activate' >/dev/null
  sleep 0.4
  ev keydown '"key":"cmd"'; ev keydown '"key":","'
  cua press-key --key comma --modifier cmd >/dev/null
  sleep 0.15
  ev keyup '"key":","'; ev keyup '"key":"cmd"'
  for _ in $(seq 1 20); do locate Juno "Settings sections" >/dev/null && break; sleep 0.25; done
  sleep 0.6
}
close_settings() { cua press-key --key w --modifier cmd >/dev/null || true; }

# 01 · Talk to Juno: hold fn, say it, let go, Juno does it.
scene_talk_to_juno() {
  reset_juno
  begin talk-to-juno "Talk to Juno" 1
  caption "Hold fn and say what you want." 3
  keys_down fn
  sleep 0.5
  say_line "Open Calculator"
  sleep 0.4
  keys_up fn
  caption "Let go, and Juno does it." 4
  for _ in $(seq 1 30); do pgrep -qx Calculator && break; sleep 0.5; done
  sleep 2.5
  end_clip
  osascript -e 'quit app "Calculator"' >/dev/null 2>&1 || true
}

# 03 · Change the talk key: Settings > Shortcuts > click the key > press Right Option.
scene_change_talk_key() {
  reset_juno
  begin change-talk-key "Change the talk key" 3
  caption "Open Settings with Command-Comma." 2.5
  open_settings

  read -r x y w h < <(need Juno "Shortcuts" --role button)
  caption "Choose Shortcuts." 2
  focus "$x" "$y" "$w" "$h" "Shortcuts" 1.6
  click_at $(center "$x" "$y" "$w" "$h")
  sleep 1.2

  read -r x y w h < <(need Juno "Edit binding for Hold to talk to Juno")
  caption "Click the key on Hold to talk to Juno." 2.5
  focus "$x" "$y" "$w" "$h" "Hold to talk to Juno" 2.5
  click_at $(center "$x" "$y" "$w" "$h")
  sleep 1.0

  caption "Press the new key. A single key is saved when you let go." 3.5
  hold_keys 350 ropt
  sleep 1.6
  read -r x y w h < <(need Juno "Edit binding for Hold to talk to Juno")
  focus "$x" "$y" "$w" "$h" "Hold to talk to Juno" 2.2
  caption "Now hold Right Option to talk to Juno." 3
  sleep 2.6
  end_clip
  close_settings
}

# Show advanced settings: the switch at the bottom of the Settings sidebar.
scene_show_advanced_settings() {
  reset_juno
  begin show-advanced-settings "Show advanced settings" 5
  caption "Open Settings with Command-Comma." 2.5
  open_settings

  read -r x y w h < <(need Juno "Show advanced settings" --role AXCheckBox)
  caption "Turn on Show advanced settings, at the bottom of the sidebar." 3
  focus "$((x - 170))" "$((y - 6))" "$((w + 180))" "$((h + 12))" "Show advanced settings" 2.4
  click_at $(center "$x" "$y" "$w" "$h")
  sleep 1.0

  read -r tx ty _ _ < <(need Juno "Tools" --role button)
  read -r ax ay aw ah < <(need Juno "Advanced" --role button)
  caption "Tools, Automations, Network and Advanced appear." 3
  focus "$tx" "$ty" "$aw" "$((ay + ah - ty))" "Advanced sections" 2.6
  sleep 3
  end_clip
  close_settings
}

[ "${BASH_SOURCE[0]}" = "$0" ] || return 0   # sourced: define scenes only
trap restore_juno EXIT
case "${1:-all}" in
  talk-to-juno) scene_talk_to_juno ;;
  change-talk-key) scene_change_talk_key ;;
  show-advanced-settings) scene_show_advanced_settings ;;
  all) scene_talk_to_juno; scene_change_talk_key; scene_show_advanced_settings ;;
  *) echo "unknown scene: $1" >&2; exit 64 ;;
esac
