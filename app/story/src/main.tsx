import { createRoot } from 'react-dom/client'
import App from './App'
import '@txkit/themes/index.css'
import './components/ControlPanel/ControlPanel.css'
import './components/StateVisualizer/StateVisualizer.css'
import './components/CodeBlock/CodeBlock.css'
import './features.css'
import './App.css'


// StrictMode disabled: wagmi v2's useSyncExternalStore returns unstable object
// references from getSnapshot, causing infinite re-renders with React 19 StrictMode.
// Re-enable after wagmi ships React 19 StrictMode compatibility fix.
createRoot(document.getElementById('root')!).render(
  <App />,
)
