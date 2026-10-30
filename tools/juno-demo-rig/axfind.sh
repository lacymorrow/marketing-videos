#!/bin/bash
# axfind.sh <AXRole> <name/description/placeholder substring> -> "x y w h | name | placeholder" for matches in any Juno window (no depth cap)
osascript - "$1" "$2" <<'APPLESCRIPT'
on run argv
  set wantRole to item 1 of argv
  set wantText to item 2 of argv
  set out to {}
  with timeout of 240 seconds
  tell application "System Events"
    tell process "juno"
      repeat with w in windows
        try
          set L to entire contents of w
        on error
          set L to {}
        end try
        repeat with e in L
          try
            if (role of e as text) is wantRole then
              set n to ""
              try
                set n to (name of e as text)
              end try
              if n is "" or n is "missing value" then
                try
                  set n to (description of e as text)
                end try
              end if
              set ph to ""
              try
                set ph to (value of attribute "AXPlaceholderValue" of e as text)
              end try
              if wantText is "" or n contains wantText or ph contains wantText then
                set p to position of e
                set s to size of e
                set end of out to ((item 1 of p) as text) & " " & ((item 2 of p) as text) & " " & ((item 1 of s) as text) & " " & ((item 2 of s) as text) & " | " & n & " | " & ph
              end if
            end if
          end try
        end repeat
      end repeat
    end tell
  end tell
  end timeout
  set AppleScript's text item delimiters to linefeed
  return out as text
end run
APPLESCRIPT
