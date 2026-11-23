#!/bin/zsh
# Assemble the packages for typora/typora-extensions under store/ (not committed):
#   store/themes/<theme id>/       from theme/ignorance (built) + theme/store/
#   store/extensions/<id>/         a copy of each folder in advanced/ that is store-ready
# Store images (cover.webp, screenshot.webp) are taken from theme/store/ and the extension folders.
set -euo pipefail
ROOT="${0:A:h:h}"
"$ROOT/scripts/build-theme.sh" >/dev/null
OUT="$ROOT/store"
rm -rf "$OUT" && mkdir -p "$OUT/themes" "$OUT/extensions"
THEME_ID="$(python3 -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["id"])' "$ROOT/theme/store/typora-extension.json")"
T="$OUT/themes/$THEME_ID"
mkdir -p "$T/themes/ignorance"
cp "$ROOT/theme/store/typora-extension.json" "$ROOT/theme/store/README.md" "$T/"
cp "$ROOT/LICENSE" "$T/LICENSE"
cp "$ROOT/theme/ignorance/theme.toml" "$ROOT/theme/ignorance/theme.css" "$T/themes/ignorance/"
for img in cover.webp screenshot.webp; do [[ -f "$ROOT/theme/store/$img" ]] && cp "$ROOT/theme/store/$img" "$T/$img"; done
for ext in ignorance.file-viewers ignorance.advanced; do
  cp -R "$ROOT/advanced/$ext" "$OUT/extensions/$ext"
done
cp -R "$ROOT/advanced/ignorance.property-query" "$OUT/extensions/ignorance.property-query"
cp -R "$ROOT/advanced/ignorance.task-rollup" "$OUT/extensions/ignorance.task-rollup"
cp -R "$ROOT/advanced/ignorance.value-track" "$OUT/extensions/ignorance.value-track"
cp -R "$ROOT/advanced/ignorance.backlinks" "$OUT/extensions/ignorance.backlinks"
cp -R "$ROOT/advanced/ignorance.flashcards" "$OUT/extensions/ignorance.flashcards"
VAULT="$ROOT/advanced/ignorance.vault"
if [[ -f "$VAULT/typora-extension.json" ]]; then
  mkdir -p "$OUT/extensions/ignorance.vault"
  for entry in "$VAULT"/*; do
    [[ "${entry:t}" == experiments ]] || cp -R "$entry" "$OUT/extensions/ignorance.vault/"
  done
fi
GRAPHS="$ROOT/advanced/ignorance.knowledge-graphs"
if [[ -f "$GRAPHS/typora-extension.json" ]]; then
  mkdir -p "$OUT/extensions/ignorance.knowledge-graphs"
  for entry in "$GRAPHS"/*; do cp -R "$entry" "$OUT/extensions/ignorance.knowledge-graphs/"; done
fi
echo "assembled $OUT"
find "$OUT" -type f | sed "s#$OUT/##" | sort | head -60
