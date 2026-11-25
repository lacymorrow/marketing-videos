-- Close every notification banner through its own accessibility action. macOS 26 draws all banners inside one
-- full-screen Notification Center window, so window geometry cannot find them.
-- Only "Clear All" and "Close" are ever performed: banners also offer actions like "Install Tonight".
-- Walks the tree itself: actions read through `entire contents` references come back empty.
-- Prints how many it closed.

on closeOne(el)
	tell application "System Events"
		try
			set n to count of actions of el
			repeat with i from 1 to n
				set d to description of action i of el
				if d is "Clear All" or d is "Close" then
					perform action i of el
					return true
				end if
			end repeat
		end try
		try
			set kids to UI elements of el
		on error
			return false
		end try
	end tell
	repeat with k in kids
		if my closeOne(contents of k) then return true
	end repeat
	return false
end closeOne

set closed to 0
with timeout of 90 seconds
	repeat 8 times
		try
			tell application "System Events" to set w to window "Notification Center" of process "NotificationCenter"
		on error
			exit repeat
		end try
		if not closeOne(w) then exit repeat
		set closed to closed + 1
		delay 1
	end repeat
end timeout
return closed
