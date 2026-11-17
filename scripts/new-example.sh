#!/usr/bin/env bash
# Creates the example app of a new plugin by cloning examples/auth-core-example.
#
#   scripts/new-example.sh <dir> <AppName> <android-id-segment> <url-scheme> <npm-name>
#   scripts/new-example.sh linkedin-login-example LinkedInLoginExample linkedinlogin linkedinexample \
#     @franciscodlx/react-native-linkedin-login-example
set -euo pipefail

if [ "$#" -ne 5 ]; then
  sed -n '2,7p' "$0"
  exit 1
fi

DIR=$1 APP=$2 SEGMENT=$3 SCHEME=$4 NPM_NAME=$5
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SRC="$ROOT/examples/auth-core-example"
DEST="$ROOT/examples/$DIR"

[ -e "$DEST" ] && { echo "examples/$DIR already exists" >&2; exit 1; }

# Tracked files only: no Pods, build output or node_modules.
(cd "$SRC" && git ls-files -z) | while IFS= read -r -d '' file; do
  case "$file" in
    ios/Podfile.lock | ios/*.xcworkspace/*) continue ;;
  esac
  target=${file//RnAuthCoreExample/$APP}
  target=${target//franciscodlx\/rnauthcore\/example/franciscodlx\/$SEGMENT\/example}
  mkdir -p "$DEST/$(dirname "$target")"
  cp "$SRC/$file" "$DEST/$target"
  if grep -Iq . "$DEST/$target"; then
    sed -i.bak \
      -e "s/RnAuthCoreExample/$APP/g" \
      -e "s/franciscodlx\.rnauthcore\.example/franciscodlx.$SEGMENT.example/g" \
      -e "s|@franciscodlx/rn-auth-core-example|$NPM_NAME|g" \
      -e "s/\"rnauthcore\"/\"$SCHEME\"/g" \
      -e "s|rnauthcore://|$SCHEME://|g" \
      "$DEST/$target"
    rm "$DEST/$target.bak"
  fi
done

echo "Created examples/$DIR. Next: add the plugin to its package.json, run pnpm install, and edit src/App.tsx."
