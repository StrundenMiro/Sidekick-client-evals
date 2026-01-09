#!/bin/bash
# Batch runner for image-to-prototype tests
# Each test runs in a fresh Claude session to avoid context exhaustion

set -e

TOTAL_TESTS=8
START_INDEX=${1:-0}
END_INDEX=${2:-$((TOTAL_TESTS - 1))}

echo "================================================"
echo "Image-to-Prototype Batch Runner"
echo "Running tests $START_INDEX to $END_INDEX"
echo "================================================"

for i in $(seq $START_INDEX $END_INDEX); do
  echo ""
  echo "--- Starting test $i of $END_INDEX ---"
  echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""

  # Run the skill in a fresh Claude session
  # The -p flag runs a prompt non-interactively
  claude -p "/image-to-prototype $i"

  EXIT_CODE=$?

  if [ $EXIT_CODE -ne 0 ]; then
    echo "WARNING: Test $i exited with code $EXIT_CODE"
  fi

  echo ""
  echo "--- Test $i complete ---"

  # Brief pause between tests
  if [ $i -lt $END_INDEX ]; then
    echo "Waiting 3 seconds before next test..."
    sleep 3
  fi
done

echo ""
echo "================================================"
echo "Batch complete! Ran tests $START_INDEX to $END_INDEX"
echo "View results at: http://localhost:5000/image-to-prototype"
echo "================================================"
