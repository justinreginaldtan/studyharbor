// components/ErrorBoundary.tsx
import React, { ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service like Sentry
    console.error("Uncaught error:", error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen bg-twilight text-parchment p-8">
          <h1 className="text-4xl font-bold text-twilight-blush mb-4">Oops! Something went wrong.</h1>
          <p className="text-lg text-text-muted mb-6">
            We're sorry, an unexpected error occurred. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="w-full max-w-lg p-4 bg-twilight-overlay rounded-lg text-sm text-text-faint whitespace-pre-wrap text-left">
              <summary>Error Details</summary>
              <p className="mt-2">{this.state.error.toString()}</p>
              {this.state.error.stack && <p className="mt-2">{this.state.error.stack}</p>}
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-8 rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
