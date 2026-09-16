import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Global error boundary — prevents a single render crash from white-screening
 * the whole SPA. Shows a recoverable fallback and logs the error for diagnosis.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would be reported to an error-tracking service
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-ink-100 p-10 shadow-card">
          <div className="text-6xl mb-4">😵‍💫</div>
          <h1 className="text-xl font-bold text-ink-900 mb-2">页面开小差了</h1>
          <p className="text-sm text-ink-500 mb-6">
            程序遇到了一点小问题，您可以刷新页面重试，您的购物车和登录状态不会丢失。
          </p>
          {this.state.message && (
            <p className="text-xs text-ink-400 bg-ink-50 rounded-lg p-2 mb-6 break-all">
              {this.state.message}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 h-10 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              刷新页面
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 h-10 rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }
}
