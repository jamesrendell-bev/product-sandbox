#!/usr/bin/env bash
# One-command update: type-check + build, then commit + push.
# Netlify auto-deploys on push once the repo is linked.
#
# Usage:  ./deploy.sh "your commit message"
set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-Update CERA® MGA engine}"

echo "▶ Type-check + production build…"
npm run build

if [ -z "$(git status --porcelain)" ]; then
  echo "✔ Nothing to commit — working tree clean."
else
  echo "▶ Commit + push…"
  git add -A
  git commit -m "$MSG"
fi

git push
echo "✔ Pushed to GitHub. Netlify will build & deploy automatically (~1–2 min)."
