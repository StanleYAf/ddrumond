import { useAuth } from "@/lib/authContext";
import { Navigate } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, aprovado, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User exists but not approved yet
  if (aprovado === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Conta Pendente</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sua conta foi criada com sucesso, mas está aguardando aprovação do administrador.
            Você receberá acesso assim que for aprovado.
          </p>
          <button
            onClick={signOut}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleGuard({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const { cargo } = useAuth();
  if (!cargo) return <>{children}</>;
  if (cargo === "admin") return <>{children}</>;
  if (allowed.includes(cargo)) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        Seu cargo não tem permissão para acessar esta área. Fale com o administrador ou altere seu cargo em Configurações.
      </p>
    </div>
  );
}
