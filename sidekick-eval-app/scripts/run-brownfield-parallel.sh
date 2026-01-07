#!/bin/bash

# Run multiple brownfield flow tests in parallel using tmux
# Usage: ./scripts/run-brownfield-parallel.sh [formats...]
# Example: ./scripts/run-brownfield-parallel.sh document table flowchart

set -e

# Default formats if none provided
if [ $# -eq 0 ]; then
  FORMATS=(document table flowchart)
else
  FORMATS=("$@")
fi

echo "Starting brownfield tests for: ${FORMATS[*]}"

# Clean up any stale locks
rm -rf /tmp/clipboard.lock /tmp/runs-json.lock 2>/dev/null || true

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
  echo "Error: tmux is required. Install with: brew install tmux"
  exit 1
fi

SESSION="brownfield-tests"

# Kill existing session if it exists
tmux kill-session -t $SESSION 2>/dev/null || true

# Create new tmux session with first format
FIRST_FORMAT="${FORMATS[0]}"
tmux new-session -d -s $SESSION -n "$FIRST_FORMAT" "claude --dangerously-skip-permissions '/brownfield-flow-test $FIRST_FORMAT'; read -p 'Press enter to close...'"

# Add windows for remaining formats
for format in "${FORMATS[@]:1}"; do
  tmux new-window -t $SESSION -n "$format" "claude --dangerously-skip-permissions '/brownfield-flow-test $format'; read -p 'Press enter to close...'"
done

echo ""
echo "Started ${#FORMATS[@]} tests in tmux session '$SESSION'"
echo ""
echo "To view: tmux attach -t $SESSION"
echo "Switch windows: Ctrl+B then 0/1/2 or n/p"
echo "Detach: Ctrl+B then d"
echo ""

# Attach to session
tmux attach -t $SESSION
