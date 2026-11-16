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


# --- section batch 1 ---------------------------------------------------------
reveal() { # reveal <label> [role]: scroll Settings until the control is in view
  local i r x y w h
  for i in 1 2 3 4 5 6; do
    if ! r=$(locate Juno "$1" ${2:+--role "$2"}); then scroll_page 500; continue; fi
    read -r x y w h <<< "$r"
    if [ "$y" -gt 790 ]; then scroll_page $(( y - 560 > 600 ? 600 : y - 560 ))
    elif [ "$y" -lt 330 ]; then scroll_page $(( y - 420 ))
    else return 0; fi
  done
  echo "scene failed: could not bring '$1' into view" >&2; exit 2
}
flip() { # flip <label> <caption> [role]: tap a switch, hold, tap it back
  tap "$1" "$2" "${3:-AXCheckBox}"; sleep 1.2
  local x y w h; read -r x y w h < <(need Juno "$1" --role "${3:-AXCheckBox}")
  click_at $(center "$x" "$y" "$w" "$h"); sleep 1.4
}
settings_clip() { # settings_clip <slug> <title> [advanced]: profile, record, open Settings
  reset_juno
  begin "$1" "$2" 5
  caption "Open Settings with Command-Comma." 2.5
  open_settings
  [ -n "${3:-}" ] && advanced_on
  return 0
}
done_clip() { sleep 2.2; end_clip; close_settings; }

scene_advanced_beta_features() {
  settings_clip advanced-beta-features "Turn on Beta features" adv
  sidebar Advanced; reveal "Beta features" AXCheckBox
  tap "Beta features" "Turn on Beta features." AXCheckBox
  done_clip
}
scene_advanced_reset_settings() {
  settings_clip advanced-reset-settings "Reset Settings" adv
  sidebar Advanced; reveal "Reset Settings" button
  tap "Reset Settings" "Open Reset Settings." button
  scroll_page 250
  local x y w h; read -r x y w h < <(need Juno "Reset All Settings")
  caption "Reset All Settings asks before it changes anything." 3
  focus "$x" "$y" "$w" "$h" "Reset All Settings" 3
  sleep 3
  done_clip
}
scene_settings_search() {
  settings_clip settings-search "Search Settings"
  caption "Type in Search at the top of the sidebar." 2.5
  type_into "Search settings" "cursor"
  watch_for 1.5
  local x y w h; read -r x y w h < <(need Juno "Cursor color" --role AXRadioGroup)
  caption "Settings jumps to the matching row." 3
  focus "$((x - 220))" "$((y - 16))" "$((w + 230))" "$((h + 40))" "Cursor color" 3
  sleep 3
  done_clip
}
scene_appearance_follow_displays() {
  settings_clip appearance-follow-displays "Follow me across displays"
  sidebar General; reveal "Follow me across displays" AXCheckBox
  flip "Follow me across displays" "Follow me across displays is on by default."
  done_clip
}
scene_appearance_cursor_color() {
  settings_clip appearance-cursor-color "Cursor color"
  sidebar General; reveal "Purple" AXRadioButton
  tap "Pink" "Pick a Cursor color." AXRadioButton
  tap "Green" "It shows where Juno is working." AXRadioButton
  tap "Blue" "Blue is the default." AXRadioButton
  done_clip
}
scene_appearance_show_juno_in() {
  settings_clip appearance-show-juno-in "Show Juno in" adv
  sidebar Advanced; reveal "Both" AXRadioButton
  tap "Dock" "Show Juno in the Dock, the menu bar, or both." AXRadioButton
  watch_for 1.5
  tap "Both" "Both is the default." AXRadioButton
  done_clip
}
scene_dictation_insert_mode() {
  settings_clip dictation-insert-mode "How the words get typed" adv
  sidebar Audio; reveal "How the words get typed" AXComboBox
  tap "How the words get typed" "Choose how dictated words get typed." AXComboBox
  DEBUG=1 dumpui insert
  local x y w h; read -r x y w h < <(need Juno "Type them")
  caption "Type them never touches your clipboard." 3
  click_at $(center "$x" "$y" "$w" "$h"); sleep 1.6
  done_clip
}
scene_dictation_play_sounds() {
  settings_clip dictation-play-sounds "Play sounds"
  sidebar Audio; reveal "Play sounds" AXCheckBox
  flip "Play sounds" "Play sounds cues the start and end of dictation."
  done_clip
}
scene_permissions_ask_before_send() {
  settings_clip permissions-ask-before-send "Ask before Juno sends" adv
  sidebar "Security & Privacy"; reveal "Ask before Juno sends" AXCheckBox
  tap "Ask before Juno sends" "See an email or message before it goes out." AXCheckBox
  done_clip
}
scene_permissions_work_in_background() {
  settings_clip permissions-work-in-background "Work in the background" adv
  sidebar Advanced; reveal "Work in the background" AXCheckBox
  flip "Work in the background" "Juno works without taking your cursor."
  done_clip
}
scene_permissions_mouse_control() {
  settings_clip permissions-mouse-control "Mouse control" adv
  sidebar Advanced; reveal "Ask each time" AXRadioButton
  tap "Ask each time" "Ask each time: Juno asks before it takes the pointer." AXRadioButton
  tap "Always allow" "Always allow: it takes the pointer when it needs to." AXRadioButton
  done_clip
}
scene_permissions_companion_mode() {
  settings_clip permissions-companion-mode "Companion Mode" adv
  sidebar Tools
  tap "Enable Companion Mode" "Turn on Companion Mode. Juno looks but never touches." AXCheckBox
  watch_for 2.5
  done_clip
}
scene_open_shortcuts_settings() {
  settings_clip open-shortcuts-settings "Open Shortcuts"
  sidebar Shortcuts
  local x y w h; read -r x y w h < <(need Juno "Edit binding for Hold to talk to Juno")
  caption "Each row is a key and what it does." 3
  focus "$((x - 200))" "$((y - 8))" "430" "110" "Shortcuts" 3
  sleep 3
  done_clip
}
scene_shortcuts_add_tap() {
  settings_clip shortcuts-add-tap "Add a tap shortcut"
  sidebar Shortcuts
  tap "Add shortcut" "Choose Add shortcut." button
  DEBUG=1 dumpui addshort
  local x y w h; read -r x y w h < <(need Juno "Tap to talk to Juno")
  caption "Pick Tap to talk to Juno." 2.5
  click_at $(center "$x" "$y" "$w" "$h"); sleep 1.4
  caption "Press the key you want for it." 2.5
  hold_keys 350 ropt
  sleep 1.4
  caption "Press once to start, and again to finish." 3
  watch_for 2
  DEBUG=1 dumpui addshort2
  done_clip
}
scene_shortcuts_turn_off_remove() {
  settings_clip shortcuts-turn-off-remove "Turn off or remove a shortcut"
  sidebar Shortcuts
  tap "Enable Hold to dictate" "Turn a shortcut off with its switch." AXCheckBox
  tap "Delete Hold to dictate" "Or delete it with the trash button." button
  watch_for 2
  done_clip
}
scene_voice_mic_speaker() {
  settings_clip voice-mic-speaker "Microphone and speaker"
  sidebar Audio; reveal "Microphone and speaker" button
  tap "Microphone and speaker" "Open Microphone and speaker." button
  DEBUG=1 dumpui mic
  local x y w h; read -r x y w h < <(need Juno "Listen through")
  caption "Listen through picks the microphone. Speak through picks the speaker." 3.5
  focus "$x" "$y" "$((w + 300))" "$((h + 90))" "Listen through" 3.5
  sleep 3
  done_clip
}
scene_voice_siri_voice() {
  settings_clip voice-siri-voice "Use a Siri voice" adv
  sidebar Audio; reveal "Open Read & Speak" button
  tap "Open Read & Speak" "Juno speaks with your Mac's Siri voice. Open Read & Speak to pick one." button
  watch_for 4
  sleep 1; end_clip
  osascript -e 'quit app "System Settings"' >/dev/null 2>&1 || true
  close_settings
}
make_automation() { # off camera: Settings is open with advanced on
  sidebar Automations
  tap "New automation" "" button
  type_into "Name" "Morning news"
  type_into "Agent query" "Summarize the top five stories on Hacker News"
  type_into "Schedule (cron)" "0 8 * * MON-FRI"
  tap "Create" "" button; sleep 1.5
}
automation_clip() { # automation_clip <slug> <title>
  reset_juno
  DRY=1 begin "$1-setup" setup 0
  open_settings; advanced_on; make_automation
  begin "$1" "$2" 6
  DEBUG=1 dumpui "$1"
}
scene_automations_run_now() {
  automation_clip automations-run-now "Run an automation now"
  tap "Run now" "Click Run now to try it without waiting." button
  watch_for 3
  done_clip
}
scene_automations_edit() {
  automation_clip automations-edit "Edit an automation"
  tap "Edit" "Click Edit on the row." button
  local x y w h; read -r x y w h < <(need Juno "Schedule (cron)" --role textfield)
  click_at $(center "$x" "$y" "$w" "$h"); sleep 0.4
  cua press-key --key a --modifier cmd >/dev/null
  caption "Change anything, like the schedule." 3
  local t0; t0=$(now); cua type-text --text "0 7 * * *" >/dev/null; sleep 0.6
  printf '{"t":%s,"duration":%s}\n' "$t0" "$(echo "$(now) - $t0" | bc | sed 's/^\./0./')" >> "$CLIP/busy.jsonl"
  tap "Save changes" "Click Save changes." button
  done_clip
}
scene_automations_pause() {
  automation_clip automations-pause "Pause an automation"
  # The row's switch has no label of its own; it sits just right of Delete.
  local x y w h; read -r x y w h < <(need Juno "Delete" --role button)
  local sx=$((x + w + 6)) sy=$((y + 6))
  caption "Turn off the switch on the row to pause it." 3
  focus "$sx" "$sy" 33 20 "Pause" 2
  click_at $((sx + 16)) $((sy + 10)); sleep 1
  caption "The row shows Paused." 2.5
  watch_for 2.5
  done_clip
}
BATCH1="advanced-beta-features advanced-reset-settings settings-search appearance-follow-displays appearance-cursor-color appearance-show-juno-in dictation-insert-mode dictation-play-sounds permissions-ask-before-send permissions-work-in-background permissions-mouse-control permissions-companion-mode open-shortcuts-settings shortcuts-add-tap shortcuts-turn-off-remove voice-mic-speaker voice-siri-voice automations-run-now automations-edit automations-pause"

# --- section batch 2: the bar, voice, and apps ---------------------------------
# The bar is not in Juno's AX tree; its window sits centred, pill at (896, 572).
BAR_X=896; BAR_Y=572
fresh_note() { # an empty TextEdit document, staged at the left
  textedit_quit; local f="$RIG/stage/Note.txt"; mkdir -p "$RIG/stage"; : > "$f"
  open -F -a TextEdit "$f"
  for _ in $(seq 1 20); do [ "$(textedit_windows)" = 1 ] && break; sleep 0.5; done
  te 'set position of window 1 to {140, 120}' >/dev/null; te 'set size of window 1 to {620, 600}' >/dev/null
  sleep 1
}
wait_text_settled() { # until TextEdit has text and it stopped changing
  local last=-1 same=0 n
  for _ in $(seq 1 60); do
    n=$(textedit_chars)
    if [ "$n" -gt 0 ] && [ "$n" = "$last" ]; then same=$((same + 1)); [ $same -ge 4 ] && break; else same=0; fi
    last=$n; sleep 0.5
  done
}
dictate() { # dictate "<words>": hold the dictation key, speak, let go
  AS=dictation keys_down fn ctrl; sleep 0.5
  say_line "$1"; sleep 0.4
  keys_up fn ctrl
}
ask_by_voice() { AS=talk keys_down fn; sleep 0.5; say_line "$1"; sleep 0.4; keys_up fn; }

scene_type_to_juno() {
  # A question Juno answers in the bar: nothing private on screen (a Finder
  # window would show the owner's file names).
  reset_juno
  begin type-to-juno "Type to Juno" 2
  caption "Click the bar." 2
  click_at $BAR_X $BAR_Y; sleep 1.2
  caption "Type where it says Ask Juno, and press Return." 3
  local t0; t0=$(now); cua type-text --text "How many days until Christmas?" >/dev/null; sleep 0.5
  printf '{"t":%s,"duration":%s}\n' "$t0" "$(echo "$(now) - $t0" | bc | sed 's/^\./0./')" >> "$CLIP/busy.jsonl"
  press return
  caption "Juno answers in the bar. Type again to follow up." 3.5
  watch_for 12
  end_clip
}
scene_dictate_into_app() {
  reset_juno; fresh_note
  KEEP=TextEdit begin dictate-into-app "Dictate into any app" 2
  caption "Click where the words should go." 2
  click_at 450 400; sleep 0.6
  caption "Hold your dictation key and speak." 3
  dictate "Pick up milk and eggs on the way home."
  caption "Let go, and the words are typed where your cursor is." 3.5
  wait_text_settled; watch_for 1.5
  end_clip; textedit_quit
}
scene_dictation_show_words() {
  reset_juno
  DRY=1 begin show-words-setup setup 0
  open_settings; advanced_on; sidebar Audio; reveal "Show words as I speak" AXCheckBox
  tap "Show words as I speak" "" AXCheckBox; close_settings; sleep 1
  fresh_note
  KEEP=TextEdit begin dictation-show-words "See words as you speak" 4
  click_at 450 400; sleep 0.6
  caption "With Show words as I speak on, the bar shows words as you talk." 3.5
  dictate "Book a table for two at seven tonight."
  caption "Only the final result is typed." 3
  wait_text_settled; watch_for 1.5
  end_clip; textedit_quit
}
scene_computer_use_escape_stop() {
  reset_juno
  textedit_quit
  open -F -a TextEdit "$RIG/fixtures/Banana Bread.txt"
  for _ in $(seq 1 20); do [ "$(textedit_windows)" = 1 ] && break; sleep 0.5; done
  te 'set position of window 1 to {140, 120}' >/dev/null; te 'set size of window 1 to {620, 700}' >/dev/null
  sleep 1
  KEEP=TextEdit begin computer-use-escape-stop "Stop Juno with Escape" 3
  caption "Juno is working on a task." 2.5
  ask_by_voice "Make me a shopping list from this recipe in a new document"
  # Stop once Juno has started acting: the second document appears.
  for _ in $(seq 1 60); do [ "$(textedit_windows)" -ge 2 ] && break; sleep 0.5; done
  sleep 1.5
  caption "Press Escape. Juno stops right away." 3
  press escape
  watch_for 3
  end_clip
  textedit_quit
  find "$HOME/Juno" -maxdepth 1 -iname '*shopping*' -newer "$CLIP/raw.mov.t0" -exec trash {} + 2>/dev/null || true
}
scene_automations_ask_juno() {
  reset_juno
  begin automations-ask-juno "Ask Juno to schedule it" 6
  caption "Just ask, with the schedule in the sentence." 3
  ask_by_voice "Every weekday at 8 AM, summarize the top stories on Hacker News"
  watch_for 14
  caption "Juno sets up the automation." 2.5
  open_settings; advanced_on; sidebar Automations
  watch_for 3
  done_clip
}
scene_permissions_approval_card() {
  reset_juno
  DRY=1 begin approval-setup setup 0
  open_settings; sidebar "Security & Privacy"; tap "Ask me first" "" ; close_settings; sleep 1
  begin permissions-approval-card "Juno needs your OK" 5
  caption "In Ask me first, Juno checks before it changes anything." 3
  ask_by_voice "Make a folder called Trip on my Desktop"
  local r="" x y w h
  for _ in $(seq 1 40); do r=$(locate Juno "Allow" --role button) && break; sleep 1; done
  DEBUG=1 dumpui approval
  [ -n "$r" ] || { echo "scene failed: no Allow button" >&2; exit 2; }
  read -r x y w h <<< "$r"
  caption "Read what it wants to do, then choose Allow." 3
  focus "$x" "$y" "$w" "$h" "Allow" 2
  click_at $(center "$x" "$y" "$w" "$h")
  for _ in $(seq 1 30); do [ -d "$HOME/Desktop/Trip" ] && break; sleep 0.5; done
  watch_for 2.5
  end_clip
  [ -d "$HOME/Desktop/Trip" ] && [ "$HOME/Desktop/Trip" -nt "$CLIP/raw.mov.t0" ] && trash "$HOME/Desktop/Trip"
  true
}
scene_shortcuts_mouse_button() {
  settings_clip shortcuts-mouse-button "Use a mouse button"
  sidebar Shortcuts
  tap "Edit binding for Hold to talk to Juno" "Click the key on a row." button
  tap "Mouse" "Switch to the Mouse tab." AXRadioButton
  local x y w h; read -r x y w h < <(need Juno "Click any mouse button here to bind it" --role button)
  caption "Click the button you want inside the box." 3
  focus "$x" "$y" "$w" "$h" "Mouse button" 2
  click_at $(center "$x" "$y" "$w" "$h") middle; sleep 1.4
  watch_for 2
  done_clip
}
scene_shortcuts_wake_phrase() {
  settings_clip shortcuts-wake-phrase "Add a wake phrase" adv
  sidebar Shortcuts; reveal "Add wake phrase" button
  tap "Add wake phrase" "Choose Add wake phrase." button
  local x y w h; read -r x y w h < <(need Juno "Wake phrase" --role textfield)
  caption "Juno listens for the phrase. Experimental, and the mic stays on." 3.5
  focus "$((x - 80))" "$((y - 6))" "$((w + 330))" "80" "Wake phrase" 3.5
  sleep 3
  done_clip
}
scene_voice_speaking_speed() {
  reset_juno
  DRY=1 begin speed-setup setup 0
  open_settings; advanced_on; sidebar Advanced; reveal "Beta features" AXCheckBox
  tap "Beta features" "" AXCheckBox
  begin voice-speaking-speed "Speaking speed" 5
  sidebar Audio; reveal "Speaking speed" group
  local x y w h; read -r x y w h < <(need Juno "Speaking speed" --role group)
  caption "Drag Speaking speed. It is marked Beta." 3
  focus "$((x - 4))" "$((y - 60))" "$((w + 80))" "80" "Speaking speed" 2.5
  local t0; t0=$(now); glide $((x + 36)) $((y + 3)); sleep 0.3
  ev click "\"x\":$((x + 36)),\"y\":$((y + 3)),\"button\":\"left\""
  "$BIN/modkey" drag $((x + 36)) $((y + 3)) $((x + w - 20)) $((y + 3)); sleep 0.8
  printf '{"t":%s,"duration":%s}\n' "$t0" "$(echo "$(now) - $t0" | bc | sed 's/^\./0./')" >> "$CLIP/busy.jsonl"
  watch_for 1.5
  done_clip
}
scene_appearance_drag_bar() {
  reset_juno
  begin appearance-drag-bar "Move the bar" 4
  caption "Drag the bar anywhere." 2.5
  glide $BAR_X $BAR_Y; sleep 0.3
  local t0; t0=$(now)
  ev click "\"x\":$BAR_X,\"y\":$BAR_Y,\"button\":\"left\""
  "$BIN/modkey" drag $BAR_X $BAR_Y 1560 980; sleep 0.4
  printf '{"t":%s,"duration":%s}\n' "$t0" "$(echo "$(now) - $t0" | bc | sed 's/^\./0./')" >> "$CLIP/busy.jsonl"
  caption "Let go, and it settles into the nearest corner or edge." 3
  watch_for 2.5
  end_clip
}
scene_dictation_pick_model() {
  settings_clip dictation-pick-model "Pick a dictation model" adv
  sidebar Models; DEBUG=1 dumpui models-before; reveal "Download: Whisper small.en" button
  tap "Download: Whisper small.en" "Choose Download on a model. It runs on your Mac." button
  local r=""
  for _ in $(seq 1 240); do r=$(locate Juno "Use: Whisper small.en" --role button || locate Juno "Use" --role button) && break; sleep 1; done
  DEBUG=1 dumpui models-after
  [ -n "$r" ] || { echo "scene failed: no Use button" >&2; exit 2; }
  local x y w h; read -r x y w h <<< "$r"
  caption "When it has finished, choose Use." 2.5
  focus "$x" "$y" "$w" "$h" "Use" 2
  click_at $(center "$x" "$y" "$w" "$h"); sleep 1.4
  watch_for 2
  done_clip
}
BATCH2="type-to-juno dictate-into-app dictation-show-words computer-use-escape-stop automations-ask-juno permissions-approval-card shortcuts-mouse-button shortcuts-wake-phrase voice-speaking-speed appearance-drag-bar dictation-pick-model"

scene_survey2() { # no recording: the bar, beta rows, Models, wake phrase, Mouse tab
  reset_juno
  DRY=1 begin survey2 "survey2" 0
  DEBUG=1 dumpui bar; screencapture -x "$RIG/dumps/bar.png"
  open_settings; advanced_on
  sidebar Advanced; reveal "Beta features" AXCheckBox; tap "Beta features" "" AXCheckBox
  sidebar Audio
  for i in 0 1 2 3; do DEBUG=1 dumpui "beta-audio-$i"; scroll_page 500; done
  sidebar Models; DEBUG=1 dumpui models; screencapture -x "$RIG/dumps/models.png"
  sidebar Network; DEBUG=1 dumpui net2
  sidebar Shortcuts
  tap "Add wake phrase" "" button; DEBUG=1 dumpui wake; screencapture -x "$RIG/dumps/wake.png"
  press escape
  tap "Edit binding for Hold to talk to Juno" "" button
  tap "Mouse" "" AXRadioButton; DEBUG=1 dumpui mouse; screencapture -x "$RIG/dumps/mouse.png"
  press escape
  close_settings
}

# survey: no recording. Visit every Settings section and dump its AX tree and a
# screenshot to $RIG/dumps, so scenes can be written against real labels.
scene_survey() {
  reset_juno
  DRY=1 DEBUG=1 begin survey "survey" 0
  open_settings
  advanced_on
  local s n
  for s in General Shortcuts Audio Providers "Security & Privacy" Tools Automations Network Advanced; do
    sidebar "$s"; n=$(echo "$s" | tr -cd 'A-Za-z')
    for i in 0 1 2; do
      DEBUG=1 dumpui "s-$n-$i"; screencapture -x "$RIG/dumps/s-$n-$i.png"
      scroll_page 600
    done
    scroll_page -2000
  done
  close_settings
}

[ "${BASH_SOURCE[0]}" = "$0" ] || return 0   # sourced: define scenes only
# A scene that fails midway must not leave its recorder holding the screen.
stop_rec() { if [ -n "${REC_PID:-}" ]; then kill -INT "$REC_PID" 2>/dev/null || true; fi; REC_PID=; }
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
  survey) scene_survey ;;
  all) scene_talk_to_juno; scene_change_talk_key; scene_show_advanced_settings
       scene_first_command; scene_dictation_words; scene_voice_dont_speak;
       scene_permissions_choose_mode; scene_computer_use_first_task; scene_automations_create
       scene_mcp_add_server; scene_appearance_bar_look; scene_fix_juno_cannot_click ;;
  *) f=scene_$(echo "$1" | tr - _); declare -F "$f" >/dev/null || { echo "unknown scene: $1" >&2; exit 64; }; "$f" ;;
esac
