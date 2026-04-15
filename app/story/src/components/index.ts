// Barrel export for all playground UI components, hooks, and providers.
// Each component owns its folder; shared types re-exported here.

// --- Icons (masked SVG from /public/icons) ---
export {
  CopyIcon,
  CheckIcon,
  RotateCcwIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from './Icons/icons'

// --- Layout / chrome ---
export { default as CodeBlock } from './CodeBlock/CodeBlock'
export { default as InfoGrid } from './InfoGrid/InfoGrid'
export { default as StoryTabs } from './StoryTabs/StoryTabs'
export { default as WalletGate } from './WalletGate/WalletGate'
export { default as PropsTable } from './PropsTable/PropsTable'
export { default as SearchModal } from './SearchModal/SearchModal'
export { default as StorySection } from './StorySection/StorySection'
export { default as MemoizedStory } from './MemoizedStory/MemoizedStory'
export { default as StateVisualizer } from './StateVisualizer/StateVisualizer'
export { default as ResponsiveToggle } from './ResponsiveToggle/ResponsiveToggle'
export { default as PlaygroundToolbar } from './PlaygroundToolbar/PlaygroundToolbar'
export { default as StoryErrorBoundary } from './StoryErrorBoundary/StoryErrorBoundary'
export type { StoryName } from './MemoizedStory/MemoizedStory'

// --- Playground state + theme sync ---
export { default as useTxkitThemeClass } from './ThemeSync/useTxkitThemeClass'
export { default as PlaygroundThemeSync } from './ThemeSync/PlaygroundThemeSync'
export { PlaygroundProvider, usePlayground } from './PlaygroundContext/PlaygroundContext'

// --- Controls (dynamic form for story props) ---
export { default as ControlPanel } from './ControlPanel/ControlPanel'
export { default as useControls } from './ControlPanel/useControls'
export type { ControlSchema, ControlDef, ControlEntry } from './ControlPanel/useControls'
