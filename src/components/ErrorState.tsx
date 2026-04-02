import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="glass-card p-10 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">Erro ao carregar dados</p>
      <p className="text-sm text-muted-foreground mb-4">
        {message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
