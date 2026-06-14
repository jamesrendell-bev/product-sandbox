#!/usr/bin/env bash
# Build the whole sandbox into ./public for Netlify (served at the site root).
#   /             -> shell
#   /natcat/      -> Property NatCat Pricing
#   /contingency/ -> Contingency Weather
#   /converter/   -> EDM & CEDE Converter
set -euo pipefail

rm -rf public && mkdir -p public

echo "── Shell ──"
( cd shell && npm install --no-audit --no-fund \
  && SANDBOX_BASE=/ \
     VITE_URL_NATCAT=/natcat/ \
     VITE_URL_CONTINGENCY=/contingency/ \
     VITE_URL_EDMCEDE=/converter/ \
     npm run build )
cp -r shell/dist/. public/

echo "── NatCat ──"
( cd apps/natcat && npm install --no-audit --no-fund \
  && APP_BASE=/natcat/ npm run build )
mkdir -p public/natcat && cp -r apps/natcat/dist/. public/natcat/

echo "── Contingency ──"
( cd apps/contingency && npm install --no-audit --no-fund \
  && APP_BASE=/contingency/ npm run build )
mkdir -p public/contingency && cp -r apps/contingency/dist/. public/contingency/

echo "── Converter (static) ──"
mkdir -p public/converter
cp -r apps/converter/index.html apps/converter/app.js apps/converter/style.css \
      apps/converter/lib apps/converter/browser apps/converter/shared \
      apps/converter/vendor apps/converter/sample public/converter/

echo "── Done. public/ assembled. ──"
