#!/bin/zsh
# Theme -> ~/.config/Typora/Themes/ignorance (a copy; Typora scans themes only at launch, so restart it).
# Extension -> ~/.config/Typora/Extensions/ignorance.advanced (a symlink). Typora caches detail-view
# pages, so restart after changing slides/ files; other changes take Settings ▸ Extensions ▸ Reload.
# Remove both with --remove.
set -euo pipefail
ROOT="${0:A:h:h}"
"$ROOT/scripts/build-theme.sh" >/dev/null
link() {
  local src="$1" target="$2"
  if [[ "${REMOVE:-}" == 1 ]]; then
    [[ -L "$target" ]] && rm "$target" && echo "removed $target"
    return 0
  fi
  mkdir -p "${target:h}"
  if [[ -e "$target" && ! -L "$target" ]]; then
    echo "skip $target: a real folder exists there" >&2
    return 0
  fi
  ln -sfn "$src" "$target"
  echo "linked $target -> $src"
}
[[ "${1:-}" == "--remove" ]] && REMOVE=1
THEME="$HOME/.config/Typora/Themes/ignorance"
if [[ "${REMOVE:-}" == 1 ]]; then
  [[ -d "$THEME" ]] && rm -r "$THEME" && echo "removed $THEME"
else
  mkdir -p "${THEME:h}" && rm -rf "$THEME" && cp -R "$ROOT/theme/ignorance" "$THEME" && echo "copied theme to $THEME"
fi
link "$ROOT/advanced/ignorance.advanced" "$HOME/.config/Typora/Extensions/ignorance.advanced"
