#!/bin/bash
# Stop the rails and anything it spawned; restore hidden apps; leave Juno running.
touch ~/.cache/juno-demo-rig/run/abort; sleep 3
pkill -f "^bash rails.sh" 2>/dev/null; pkill -INT -f "avfoundation" 2>/dev/null; pkill -f "claude -p" 2>/dev/null
echo stopped
