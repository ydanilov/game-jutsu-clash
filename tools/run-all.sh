#!/bin/bash
# Run every test; retry a suite up to 3x only when the browser itself died (shared/slow CI boxes).
cd "$(dirname "$0")"; bash build-test.sh || exit 1
fail=0
for t in "boot" "run" "mobile" "menus desktop" "menus mobile"; do
  for try in 1 2 3; do
    set -- $t; out=$(timeout 1700 node $1.js $2 2>&1); code=$?
    if [ $code -ne 0 ] && echo "$out" | grep -q "has been closed"; then echo "[$t] browser closed, retry $try"; continue; fi
    break
  done
  echo "$out" | grep -E "^\s+(ok|FAIL)|PASSED|FAILED|Error"; [ $code -eq 0 ] || fail=1
done
exit $fail
