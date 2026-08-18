import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white bg-[#050505]">
          <div className="glass-panel p-8 rounded-2xl max-w-md space-y-4 border border-emerald-500/30">
            <div className="text-4xl">🚀</div>
            <h2 className="text-xl font-bold">Zaktualizowano MindClash!</h2>
            <p className="text-xs text-gray-400">
              Przeglądarka wczytała poprzednią wersję z pamięci podręcznej. Kliknij przycisk poniżej, aby pobrać najnowszą wersję.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide shadow-lg transition-all active:scale-[0.98]"
            >
              🔄 Odśwież Aplikację
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
