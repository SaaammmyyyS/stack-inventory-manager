import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorService } from '../services/errorService';
import { AppError } from '../types/errors';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    const appError: AppError = {
      code: 'REACT_ERROR_BOUNDARY',
      message: error.message || 'An unexpected error occurred in the application',
      category: 'server',
      recoverable: true,
      details: {
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
        errorId: this.state.errorId,
      },
    };

    errorService.logError(appError, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                An unexpected error occurred. We've been notified and are working on it.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              {this.state.error && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                If this problem persists, please contact support with the Error ID above.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const useErrorBoundary = () => {
  const handleError = (error: Error, context?: string) => {
    const appError: AppError = {
      code: 'HOOK_ERROR',
      message: error.message,
      category: 'server',
      recoverable: true,
      details: { context },
    };

    errorService.logError(appError, { context });
    errorService.displayError(appError);
  };

  return { handleError };
};
