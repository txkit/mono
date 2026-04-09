import React, { Component, type ReactNode } from 'react'


type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

class TxKitErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[txKit] Component error:', error)
    if (errorInfo.componentStack) {
      console.error('[txKit] Component stack:', errorInfo.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="txkit-error-boundary" role="alert">
          <p className="txkit-error-boundary__message">
            <strong>txKit Error:</strong> {this.state.error?.message || 'A component failed to render.'}
          </p>
          <button
            className="txkit-error-boundary__retry"
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


export default TxKitErrorBoundary
