---
"@txkit/react": patch
"@txkit/themes": patch
---

Wallet connect UX and client-SPA boot fixes.

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
