import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/lib/dataContext";
import { ThemeProvider } from "@/lib/themeContext";
import { AuthProvider } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { UndoToast } from "@/components/UndoToast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Lancamentos from "./pages/Lancamentos";
import Indicadores from "./pages/Indicadores";
import PosVenda from "./pages/PosVenda";
import Configuracoes from "./pages/Configuracoes";
import Relatorios from "./pages/Relatorios";
import Estoque from "./pages/Estoque";
import Fornecedores from "./pages/Fornecedores";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary fallbackTitle="Erro crítico na aplicação">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <DataProvider>
                        <Layout>
                          <ErrorBoundary fallbackTitle="Erro ao carregar a página">
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/lancamentos" element={<Lancamentos />} />
                              <Route path="/indicadores" element={<Indicadores />} />
                              <Route path="/pos-venda" element={<PosVenda />} />
                              <Route path="/configuracoes" element={<Configuracoes />} />
                              <Route path="/relatorios" element={<Relatorios />} />
                              <Route path="/estoque" element={<Estoque />} />
                              <Route path="/fornecedores" element={<Fornecedores />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </ErrorBoundary>
                        </Layout>
                        <UndoToast />
                      </DataProvider>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
