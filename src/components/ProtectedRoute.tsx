import { useAuth } from "@/lib/authContext";
import { Navigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
}

export function RoleGuard({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const { cargo } = useAuth();
  // If no cargo set yet, allow access (user needs to set up profile first)
  if (!cargo) return <>{children}</>;
  // Admin sees everything
  if (cargo === "admin") return <>{children}</>;
  // Check if user's cargo is in allowed list
  if (allowed.includes(cargo)) return <>{children}</>;
  // Access denied
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
