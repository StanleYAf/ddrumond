import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, FilePlus, BarChart3, PhoneCall, Settings, FileBarChart, Sun, Moon, Package, Truck } from "lucide-react";
import { useTheme } from "@/lib/themeContext";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lançamentos", url: "/lancamentos", icon: FilePlus },
  { title: "Indicadores", url: "/indicadores", icon: BarChart3 },
  { title: "Pós-venda", url: "/pos-venda", icon: PhoneCall },
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Config", url: "/configuracoes", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { mode, toggleMode } = useTheme();
  const isDark = mode === "dark";

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 z-40 border-r border-border bg-sidebar"
        style={{ backdropFilter: 'blur(20px)' }}>
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Painel Comercial</h1>
            <p className="text-xs mt-0.5 text-muted-foreground">Equipamentos Médicos</p>
          </div>
          <button onClick={toggleMode}
            className="p-2 rounded-xl transition-colors bg-secondary hover:bg-secondary/80">
            {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url);
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'text-foreground font-medium bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
                activeClassName="bg-secondary text-foreground font-medium"
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-5 md:px-6 md:py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-nav safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const isActive = item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url);
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-[3.5rem]"
                activeClassName=""
              >
                <item.icon
                  className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
