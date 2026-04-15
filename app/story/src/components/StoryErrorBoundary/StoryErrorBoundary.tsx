import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'


type StoryErrorBoundaryState = { hasError: boolean; error: Error | null }

class StoryErrorBoundary extends Component<{ children: ReactNode; storyKey: string }, StoryErrorBoundaryState> {
  state: StoryErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): StoryErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Playground] Story error:', error, info.componentStack)
  }

  componentDidUpdate(prevProps: { storyKey: string }) {
    if (prevProps.storyKey !== this.props.storyKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="story-card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 12 }}>
            <strong>Story Error:</strong> {this.state.error?.message}
          </p>
          <button
            type="button"
            className="story-code-toggle"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}


export default StoryErrorBoundary
