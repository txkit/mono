// Ambient declarations for side-effect imports. TypeScript 6 (TS2882) requires
// type declarations for `import 'x'` style side-effect imports of non-code
// modules. The app imports CSS and the @txkit/themes stylesheet entrypoints
// purely for their styling side effects.

declare module '*.css'

declare module '@txkit/themes/base'

declare module '@txkit/themes/dark'
