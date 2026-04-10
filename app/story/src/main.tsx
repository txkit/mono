import { createRoot } from 'react-dom/client'
import App from './App'
import '@txkit/themes/index.css'
import './controls/ControlPanel.css'
import './stories/shared/StateVisualizer.css'
import './CodeBlock.css'
import './features.css'
import './App.css'


// StrictMode disabled: wagmi v2's useSyncExternalStore returns unstable object
// references from getSnapshot, causing infinite re-renders with React 19 StrictMode.
// Re-enable after wagmi ships React 19 StrictMode compatibility fix.
createRoot(document.getElementById('root')!).render(
  <App />,
)
