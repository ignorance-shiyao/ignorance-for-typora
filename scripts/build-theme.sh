#!/bin/zsh
# Build theme/ignorance: theme.toml = base + palette variants; theme.css with
# assets/*.webp inlined as data: URIs (Typora drops other url()s). Fails if a
# one-sided accent bar slips into the sources.
set -euo pipefail
ROOT="${0:A:h:h}"
OUT="$ROOT/theme/ignorance"
mkdir -p "$OUT"
node "$ROOT/scripts/check-styles.mjs"
{ cat "$ROOT/theme/src/base.toml"; python3 -I "$ROOT/scripts/gen-palettes.py"; echo; cat "$ROOT/theme/src/mascot.toml"; cat "$ROOT/theme/src/layout.toml"; } > "$OUT/theme.toml"
python3 -I - "$ROOT/theme/src/theme.css" "$ROOT/theme/assets" "$OUT/theme.css" <<'PY'
import base64, re, sys
src, assets, out = sys.argv[1:]
def inline(m):
    data = base64.b64encode(open(f"{assets}/{m.group(1)}", "rb").read()).decode()
    return f'url("data:image/webp;base64,{data}")'
css = re.sub(r'url\("assets/([\w.-]+\.webp)"\)', inline, open(src).read())
open(out, "w").write(css)
PY
echo "built $OUT"
