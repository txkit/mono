# @txkit/themes

## 0.1.0

Initial release.

- Light theme (base.css) - default
- Dark theme (dark.css)
- Visual variants: soft, sharp, rounded
- CSS custom properties with `--txkit-*` prefix
- Subpath imports: `@txkit/themes/base`, `@txkit/themes/dark`, `@txkit/themes/variants/*`

### Default radii (tightened pre-alpha)

Smaller values feel closer to figma reference and give clear separation
from the `soft` variant.

| Token | Old | New |
|---|---|---|
| `--txkit-radius-sm` | 6px | 4px |
| `--txkit-radius-md` | 8px | 6px |
| `--txkit-radius-lg` | 12px | 8px |
| `--txkit-radius-xl` | 20px | 12px |

`--txkit-radius-full` and `--txkit-radius-button` unchanged.
