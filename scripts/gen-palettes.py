"""Generate the palette variants block of theme.toml from the eight palette presets."""
import sys

PRESETS = [
    ("azure", "天蓝", "#3B6FE8", "#FAF8F4", "#0E1420", "#123258", "#EAF3FF"),
    ("pine", "松绿", "#2E7D5B", "#F7FAF7", "#0F1A16", "#1F2C26", "#E6F0EA"),
    ("book", "书卷", "#8B5E34", "#FBF7EE", "#1C1914", "#2F2A22", "#EFE7D8"),
    ("graphite", "石墨", "#4A5568", "#FAFAFA", "#121315", "#1F2328", "#E8E9EB"),
    ("terracotta", "赤陶", "#B4533C", "#FBF6F2", "#1E1715", "#33241F", "#F3E7E1"),
    ("teal", "深海青", "#177E89", "#F5F9FA", "#0D1A1D", "#1B2E31", "#E3F1F2"),
    ("wisteria", "紫藤", "#6A55B5", "#F9F8FC", "#16131F", "#282339", "#ECE8F7"),
    ("amber", "琥珀", "#B26B12", "#FCF8F0", "#1D1812", "#33291B", "#F3EADB"),
]


def rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def hexa(c):
    return "#" + "".join(f"{max(0, min(255, round(v))):02X}" for v in c)


def mix(a, b, t):
    """t share of b mixed into a."""
    return hexa([x * (1 - t) + y * t for x, y in zip(rgb(a), rgb(b))])


def lum(h):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = map(ch, rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def readable(fg, bg, toward, target=4.5):
    t = 0.0
    while contrast(fg, bg) < target and t < 1:
        t += 0.04
        fg = mix(fg, toward, 0.04 / (1 - t + 0.04))
    return fg


out = ['[variants.palette]', 'label = "配色"', 'default = "azure"', '']
for pid, label, accent, lp, dp, li, di in PRESETS:
    la = readable(accent, lp, "#000000")
    da = readable(mix(accent, "#FFFFFF", 0.35), dp, "#FFFFFF", 5.0)
    mode = {
        "light": dict(bg=lp, text=li, heading=li, muted=mix(li, lp, 0.42), accent=la, link=la,
                      surface=mix(lp, la, 0.04), **{"surface-hover": mix(lp, la, 0.08)},
                      **{"code-bg": mix(lp, li, 0.035), "inline-code-bg": mix(lp, la, 0.07)},
                      border=mix(lp, li, 0.11), highlight=mix(lp, "#F5C518", 0.32),
                      selection=mix(lp, la, 0.18), caret=la,
                      **{"diagram-fill": mix(lp, li, 0.05), "diagram-border": mix(lp, li, 0.28)}),
        "dark": dict(bg=dp, text=di, heading=di, muted=mix(di, dp, 0.4), accent=da, link=da,
                     surface=mix(dp, da, 0.06), **{"surface-hover": mix(dp, da, 0.11)},
                     **{"code-bg": mix(dp, "#000000", 0.18), "inline-code-bg": mix(dp, da, 0.12)},
                     border=mix(dp, di, 0.16), highlight=mix(dp, "#F5C518", 0.28),
                     selection=mix(dp, da, 0.3), caret=da,
                     **{"diagram-fill": mix(dp, di, 0.1), "diagram-border": mix(dp, di, 0.4)}),
    }
    out += [f'[variants.palette.choices.{pid}]', f'label = "{label}"', f'swatch = "{accent}"', '']
    for m, v in mode.items():
        out.append(f'[variants.palette.choices.{pid}.vars.{m}]')
        out += [f'{k} = "{val}"' for k, val in v.items()]
        out.append('')
    for m, bgc in (("light", lp), ("dark", dp)):
        ink = li if m == "light" else di
        acc = mode[m]["accent"]
        out.append(f'[variants.palette.choices.{pid}.chrome.{m}]')
        side = mix(bgc, ink, 0.035 if m == "light" else 0.05)
        out += [f'sidebar-bg = "{side}"', f'page-bg = "{bgc}"', f'accent = "{acc}"',
                f'tree-selected-bg = "{mix(bgc, acc, 0.14)}"', f'tree-selected-fg = "{ink}"',
                f'hover-bg = "{mix(bgc, acc, 0.07)}"', f'panel-bg = "{side}"',
                f'tree-fg = "{mix(ink, bgc, 0.12)}"', f'tree-dir-fg = "{ink}"', f'tree-icon = "{mix(acc, bgc, 0.2)}"',
                f'surface-border = "{mix(bgc, ink, 0.1)}"', f'panel-border = "{mix(bgc, ink, 0.1)}"', '']
sys.stdout.write("\n".join(out))
