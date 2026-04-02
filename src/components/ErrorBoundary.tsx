import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {this.props.fallbackTitle || "Algo deu errado"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Ocorreu um erro inesperado. Tente recarregar ou voltar à página anterior.
          </p>
          {this.state.error && (
            <details className="mb-4 text-xs text-muted-foreground max-w-sm">
              <summary className="cursor-pointer hover:text-foreground">Detalhes do erro</summary>
              <pre className="mt-2 p-3 rounded-lg bg-secondary text-left overflow-auto max-h-32 text-[11px]">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary text-muted-foreground"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
