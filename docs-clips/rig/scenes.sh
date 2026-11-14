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
  # activate puts Juno's menu bar in front so Command-Comma reaches it; capped at
  # 5 s because a busy Juno once let it hang for the default 2 minutes.
  osascript -e 'with timeout of 5 seconds' -e 'tell application "Juno" to activate' -e 'end timeout' >/dev/null 2>&1 \
    || open -a /Applications/Juno.app
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
  caption "Hold your talk key and say what you want." 3
  AS=talk keys_down fn
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


# --- hero batch helpers ------------------------------------------------------
dumpui() { [ -n "${DEBUG:-}" ] || return 0; mkdir -p "$RIG/dumps"; locate Juno x --all > "$RIG/dumps/$1.txt" || true; }
sidebar() { # sidebar <section>: click a Settings section
  caption "Go to $1." 2   # covers the AX lookup, which takes a few seconds
  local x y w h; read -r x y w h < <(need Juno "$1" --role button)
  click_at $(center "$x" "$y" "$w" "$h"); sleep 1.3
}
advanced_on() { # turn the sidebar switch on if it is off
  local x y w h; read -r x y w h < <(need Juno "Show advanced settings" --role AXCheckBox)
  caption "Turn on Show advanced settings." 2.5
  focus "$((x - 170))" "$((y - 6))" "$((w + 180))" "$((h + 12))" "Show advanced settings" 2
  click_at $(center "$x" "$y" "$w" "$h"); sleep 1.2
}
tap() { # tap <label> <caption> [role]: focus a control, then click it
  local x y w h; read -r x y w h < <(need Juno "$1" ${3:+--role "$3"})
  caption "$2" 2.5
  focus "$x" "$y" "$w" "$h" "$1" 2
  click_at $(center "$x" "$y" "$w" "$h"); sleep 1.2
}
scroll_page() { # scroll_page <px>: scroll Settings content (+ down), visibly
  # (1150, 760) is inside the Settings pane and clear of the Juno bar's window,
  # which sits over the middle of the screen and would take the wheel instead.
  glide 1150 760; local t0; t0=$(now)
  "$BIN/modkey" scroll "$1"; sleep 0.6
  printf '{"t":%s,"duration":%s}\n' "$t0" "$(echo "$(now) - $t0" | bc | sed 's/^\./0./')" >> "$CLIP/busy.jsonl"
}
watch_for() { # watch_for <s>: something changes on screen with no overlay event; squeeze.py keeps it
  local t0; t0=$(now); sleep "$1"
  printf '{"t":%s,"duration":%s}\n' "$t0" "$1" >> "$CLIP/busy.jsonl"
}
type_into() { # type_into <label> <text>: click a text field and type
  local x y w h; read -r x y w h < <(need Juno "$1" --role textfield)
  click_at $(center "$x" "$y" "$w" "$h"); sleep 0.5
  local t0; t0=$(now)
  cua type-text --text "$2" >/dev/null; sleep 0.6
  # Typing is not an overlay event, but squeeze.py must not cut it.
  printf '{"t":%s,"duration":%s}\n' "$t0" "$(echo "$(now) - $t0" | bc | sed 's/^\./0./')" >> "$CLIP/busy.jsonl"
}

# Getting started: first command by voice.
scene_first_command() {
  reset_juno
  begin first-command "Your first command" 1
  caption "Hold the talk key and say something simple." 3
  AS=talk keys_down fn
  sleep 0.5
  say_line "Open Safari"
  sleep 0.4
  keys_up fn
  caption "Let go, and Juno does it." 4
  for _ in $(seq 1 30); do pgrep -qx Safari && break; sleep 0.5; done
  sleep 3
  end_clip
  osascript -e 'quit app "Safari"' >/dev/null 2>&1 || true
}

# Dictation: Settings > Audio > Words to spell right.
scene_dictation_words() {
  reset_juno
  begin dictation-words-to-spell-right "Words to spell right" 5
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  sidebar Audio
  dumpui audio
  dumpui audio2
  read -r x y w h < <(need Juno "Words to spell right")
  caption "Find Words to spell right in Audio." 2.5
  focus "$x" "$y" "$((w + 240))" "$((h + 70))" "Words to spell right" 2.2
  sleep 2.4
  caption "Type the word the way you want it, and press Return." 3.5
  type_into "Words to spell right" "Kokoro"
  press return
  sleep 2.5
  end_clip
  close_settings
}

# Voice: Settings > Audio > Don't speak.
scene_voice_dont_speak() {
  reset_juno
  begin voice-dont-speak "Make Juno quiet" 5
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  sidebar Audio
  tap "Don't speak" "Turn on Don't speak. Juno replies in text instead." AXCheckBox
  sleep 2.5
  end_clip
  close_settings
}

# providers-claude-cli is not recorded: the Providers pane shows the signed-in
# Claude account email under "No API key needed" from the moment it opens, so
# any clip of it would show a personal address. Needs a UI change in Juno
# (or a throwaway signed-in account on graphite) before it can be filmed.

# Permissions: Settings > Security & Privacy > When Juno needs permission.
scene_permissions_choose_mode() {
  reset_juno
  begin permissions-choose-mode "Choose how often Juno asks" 5
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  sidebar "Security & Privacy"
  dumpui sec
  tap "Ask me first" "Pick how often Juno checks with you." 
  sleep 2.5
  end_clip
  close_settings
}

# Computer use: a task that needs the screen. A recipe is open in TextEdit;
# Juno reads it, opens a new document and types the shopping list. (Not
# arithmetic or a lookup: Juno would just answer those out loud.)
# TextEdit is driven through System Events (already allowed for clear_stage),
# never by Apple Events to TextEdit itself: that needs its own Automation
# permission, and the prompt for it hangs the scene with nobody there to click.
textedit_quit() { pkill -x TextEdit 2>/dev/null || true; sleep 1; }
te() { osascript -e "tell application \"System Events\" to tell process \"TextEdit\" to $1" 2>/dev/null; }
textedit_windows() { te 'count windows' || echo 0; }
textedit_chars() { # total characters across TextEdit's text areas
  osascript -e 'tell application "System Events" to tell process "TextEdit"' -e 'set n to 0' \
    -e 'repeat with w in windows' -e 'try' -e 'set n to n + (length of (value of text area 1 of scroll area 1 of w as text))' -e 'end try' -e 'end repeat' \
    -e 'return n' -e 'end tell' 2>/dev/null || echo 0
}
scene_computer_use_first_task() {
  reset_juno
  textedit_quit
  open -F -a TextEdit "$RIG/fixtures/Banana Bread.txt"   # -F: no restored windows
  for _ in $(seq 1 20); do [ "$(textedit_windows)" = 1 ] && break; sleep 0.5; done
  te 'set position of window 1 to {140, 120}' >/dev/null; te 'set size of window 1 to {620, 700}' >/dev/null
  sleep 1
  KEEP=TextEdit begin computer-use-first-task "Ask Juno to use your computer" 1
  caption "Hold the talk key and ask for something on your screen." 3
  AS=talk keys_down fn
  sleep 0.5
  say_line "Make me a shopping list from this recipe in a new document"
  sleep 0.4
  keys_up fn
  caption "Juno reads the screen, then clicks and types for you." 5
  # Done when a second document exists and its text has stopped growing.
  local last=-1 same=0
  for _ in $(seq 1 90); do
    n=$(textedit_chars)
    if [ "$(textedit_windows)" -ge 2 ] && [ "$n" = "$last" ]; then
      same=$((same + 1)); [ $same -ge 6 ] && break
    else same=0; fi
    last=$n; sleep 0.5
  done
  sleep 2
  end_clip
  textedit_quit
  # Juno saves the list under ~/Juno; it is the clip's, not graphite's owner's.
  find "$HOME/Juno" -maxdepth 1 -iname '*shopping*' -newer "$CLIP/raw.mov.t0" -exec trash {} + 2>/dev/null || true
}

# Automations: Settings > Automations > New automation > fill in > Create.
scene_automations_create() {
  reset_juno
  begin automations-create "Create an automation" 6
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  advanced_on
  sidebar Automations
  tap "New automation" "Click New automation." button
  dumpui auto-form
  type_into "Name" "Morning news"
  type_into "Agent query" "Summarize the top five stories on Hacker News"
  type_into "Schedule (cron)" "0 8 * * MON-FRI"
  caption "Fill in the name, the request and the schedule." 3
  dumpui auto-filled
  tap "Create" "Click Create." button
  sleep 2.5
  end_clip
  close_settings
}

# MCP: Settings > Network > Add a server > paste JSON.
scene_mcp_add_server() {
  reset_juno
  begin mcp-add-server "Add an MCP server" 6
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  advanced_on
  sidebar Network
  dumpui net
  type_into "Server Configuration (JSON)" '{"memory": {"command": "npx", "args": ["@modelcontextprotocol/server-memory"]}}'
  dumpui net-filled
  caption "Paste the server's setup into Server Configuration." 3
  sleep 1.5
  scroll_page 500
  tap "Add Server" "Click Add Server." button
  # The server starts (npx fetches it the first time) and moves up into Active MCP Servers.
  scroll_page -700
  watch_for 8
  dumpui net-added
  end_clip
  close_settings
}

# Appearance: Settings > General > Appearance, step through the looks.
scene_appearance_bar_look() {
  reset_juno
  begin appearance-bar-look "Choose a look" 5
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  sidebar General
  read -r x y w h < <(need Juno "Next appearance")
  caption "Use the arrows to move through the looks." 3
  focus "$x" "$y" "$w" "$h" "Next appearance" 2
  click_at $(center "$x" "$y" "$w" "$h"); sleep 2.2
  read -r x y w h < <(need Juno "Next appearance")
  click_at $(center "$x" "$y" "$w" "$h"); sleep 2.2
  caption "A look applies as soon as you land on it." 3
  sleep 3
  end_clip
  close_settings
}

# Troubleshooting: Settings > Security & Privacy > macOS Permissions.
scene_fix_juno_cannot_click() {
  reset_juno
  begin fix-juno-cannot-click "Check Juno's permissions" 5
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  sidebar "Security & Privacy"
  scroll_page 500
  read -r x y w h < <(need Juno "macOS Permissions")
  caption "macOS Permissions shows what is granted and what is still needed." 4
  focus "$x" "$y" "$((w + 330))" "200" "macOS Permissions" 3.5
  sleep 4
  end_clip
  close_settings
}

[ "${BASH_SOURCE[0]}" = "$0" ] || return 0   # sourced: define scenes only
# A scene that fails midway must not leave its recorder holding the screen.
stop_rec() { [ -n "${REC_PID:-}" ] && kill -INT "$REC_PID" 2>/dev/null; REC_PID=; }
trap 'stop_rec; restore_juno' EXIT
case "${1:-all}" in
  talk-to-juno) scene_talk_to_juno ;;
  change-talk-key) scene_change_talk_key ;;
  show-advanced-settings) scene_show_advanced_settings ;;
  first-command) scene_first_command ;;
  dictation-words-to-spell-right) scene_dictation_words ;;
  voice-dont-speak) scene_voice_dont_speak ;;
  permissions-choose-mode) scene_permissions_choose_mode ;;
  computer-use-first-task) scene_computer_use_first_task ;;
  automations-create) scene_automations_create ;;
  mcp-add-server) scene_mcp_add_server ;;
  appearance-bar-look) scene_appearance_bar_look ;;
  fix-juno-cannot-click) scene_fix_juno_cannot_click ;;
  all) scene_talk_to_juno; scene_change_talk_key; scene_show_advanced_settings
       scene_first_command; scene_dictation_words; scene_voice_dont_speak;
       scene_permissions_choose_mode; scene_computer_use_first_task; scene_automations_create
       scene_mcp_add_server; scene_appearance_bar_look; scene_fix_juno_cannot_click ;;
  *) echo "unknown scene: $1" >&2; exit 64 ;;
esac
