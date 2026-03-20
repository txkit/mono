<p align="center">
  <img src="https://txkit.dev/logo.svg" width="64" height="64" alt="txKit" />
</p>

<h1 align="center">@txkit/themes</h1>

<p align="center">
  CSS themes for txKit components.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@txkit/themes"><img src="https://img.shields.io/npm/v/@txkit/themes.svg" alt="npm version" /></a>
  <a href="https://github.com/txkit/mono/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@txkit/themes.svg" alt="license" /></a>
</p>

---

## Overview

CSS custom property themes for txKit components. Includes light and dark themes with visual variants.

## Install

```bash
npm install @txkit/themes
```

## Usage

```tsx
// Import all themes (light + dark)
import '@txkit/themes'

// Or import individually
import '@txkit/themes/base'  // light theme (default)
import '@txkit/themes/dark'  // dark theme
```

## Visual Variants

```tsx
import '@txkit/themes/variants/soft'     // softer shadows and borders
import '@txkit/themes/variants/sharp'    // sharp corners, no radius
import '@txkit/themes/variants/rounded'  // fully rounded elements
```

## Customization

Override any `--txkit-*` CSS custom property:

```css
:root {
  --txkit-color-primary: #4338ca;
  --txkit-radius-md: 8px;
  --txkit-font-family: 'Inter', sans-serif;
}
```

## Documentation

Visit [txkit.dev](https://txkit.dev) for the full theming guide.

## License

[MIT](./LICENSE)
