#!/bin/bash
# Regenerate ../index.html (full page for Vercel) from ../src.html (artifact body). Never hand-edit index.html.
set -e
cd "$(dirname "$0")/.."
{
  echo '<!doctype html>'
  echo '<html lang="en"><head><meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  echo '<meta name="theme-color" content="#2A1F2E"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">'
  echo '<meta name="description" content="Jutsu Clash by Diego Danylov: a cozy low-poly elemental tower defense. Build, fuse and clash.">'
  echo '<meta name="author" content="Diego Danylov">'
  echo '</head><body>'
  cat src.html
  echo '</body></html>'
} > index.html
echo "index.html rebuilt ($(wc -c < index.html) bytes)"
