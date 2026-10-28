#!/bin/bash
# Build tools/test.html from ../src.html with the CDN three.js swapped for the local node_modules copy (offline tests).
set -e
cd "$(dirname "$0")"
{
  echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'
  sed -e 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#node_modules/three/build/three.min.js#' \
      -e 's#url(assets/#url(../assets/#g' -e "s#'assets/#'../assets/#g" ../src.html
  echo '</body></html>'
} > test.html
grep -q 'node_modules/three/build/three.min.js' test.html || { echo "three swap failed"; exit 1; }
echo "test.html built"
