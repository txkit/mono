# @txkit/themes

## [0.1.0-alpha.0] - 2026-04-29

Initial alpha release.

- Light theme (base.css) - default
- Dark theme (dark.css)
- Visual variants: soft, sharp, rounded
- CSS custom properties with `--txkit-*` prefix
- Subpath imports: `@txkit/themes/base`, `@txkit/themes/dark`, `@txkit/themes/variants/*`

### Changed
- Default radii tightened: `sm 6→4`, `md 8→6`, `lg 12→8`, `xl 20→12`. `--txkit-radius-full` and `--txkit-radius-button` unchanged. Smaller values feel closer to figma reference and give clear separation from the `soft` variant.

### Fixed
- Primary tokens scoped to `:root` only in `base.css`. Inner TxKitProvider scopes (e.g. `.txkit-color-blue`) no longer shadow user color schemes.

### Default radii

| Token | Old | New |
|---|---|---|
| `--txkit-radius-sm` | 6px | 4px |
| `--txkit-radius-md` | 8px | 6px |
| `--txkit-radius-lg` | 12px | 8px |
| `--txkit-radius-xl` | 20px | 12px |

`--txkit-radius-full` and `--txkit-radius-button` unchanged.
