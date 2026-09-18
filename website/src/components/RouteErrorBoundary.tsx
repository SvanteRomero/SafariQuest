import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Without this, an uncaught error anywhere in a routed page's render tree
 * unmounts the *entire* app — the visitor sees a blank white page with zero
 * indication anything went wrong, and there's nothing in the browser's UI to
 * screenshot for diagnosis. Catches at the route level (wrapped around each
 * layout's <Outlet />) so one broken page doesn't take the whole shell with
 * it, and shows the actual error so it's at least reportable. Must be a
 * class component — React only supports error boundaries via
 * componentDidCatch/getDerivedStateFromError, there's no hook equivalent. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center px-5 py-16">
          <h2 className="font-headline-md text-[20px] text-on-surface mb-2">Something went wrong on this page</h2>
          <p className="text-on-surface-variant text-sm max-w-md mb-4">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="min-h-[44px] px-6 py-2 bg-savanna-green text-on-primary rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
