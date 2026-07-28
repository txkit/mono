# @txkit/themes

## 0.1.0-alpha.5

### Patch Changes

- Wallet connect UX and client-SPA boot fixes.
  - `ConnectWallet` exposes a headless `WalletList`, so host apps can render the
    wallet picker inside their own sheet or modal.
  - New opt-in `cookiePersistence` config: persists the wagmi store to a cookie and
    hydrates it as `initialState`, so a client-only SPA reconnects on the first
    render instead of flashing the disconnected state.
  - The account dropdown now dismisses on capture-phase `pointerdown` instead of
    bubble-phase `mousedown`, so it closes when a react-aria (or other Pointer
    Events based) overlay opens. Previously two overlays could be open at once.
  - Connect skeleton settles its grace window once per app load.
  - Mask-icon fixes in the chain mismatch flow, wider dropdown and wallet gap.
  - `@txkit/themes` aligns its forced-colors skeleton fallback with `@txkit/react`.

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

| Token               | Old  | New  |
| ------------------- | ---- | ---- |
| `--txkit-radius-sm` | 6px  | 4px  |
| `--txkit-radius-md` | 8px  | 6px  |
| `--txkit-radius-lg` | 12px | 8px  |
| `--txkit-radius-xl` | 20px | 12px |

`--txkit-radius-full` and `--txkit-radius-button` unchanged.
