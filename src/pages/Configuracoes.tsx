import { useState, useRef, useEffect, useCallback } from "react";
import { useAppData } from "@/lib/dataContext";
import { useAuth } from "@/lib/authContext";
import { useTheme, accentMap, type AccentColor, type ThemeMode } from "@/lib/themeContext";
import { CATEGORIA_LABELS, type Categoria, type AppData } from "@/lib/types";
import { applyCurrencyMask, parseCurrencyMask, numberToCurrencyMask } from "@/lib/currencyMask";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Download, Upload, AlertTriangle, Sun, Moon, Check, User, Shield, Users, Search, Clock, CheckCircle } from "lucide-react";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "sonner";

const CARGOS = [
  { value: "dash", label: "Dash", desc: "Dashboard, lançamentos, indicadores e pós-venda" },
  { value: "estoque", label: "Estoque", desc: "Estoque e fornecedores" },
  { value: "admin", label: "Admin", desc: "Acesso completo" },
];

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  cargo: string | null;
  aprovado: boolean;
  created_at: string;
}

export default function Configuracoes() {
  const { data, setData, loading, error, undoDelete } = useAppData();
  const { user, refreshProfile, cargo: currentCargo, displayName: currentDisplayName } = useAuth();
  const { mode, accent, setMode, setAccent, toggleMode } = useTheme();
  const [novoVendedor, setNovoVendedor] = useState("");
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileCargo, setProfileCargo] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Admin: user management
  const [allUsers, setAllUsers] = useState<ProfileRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const isAdmin = currentCargo === "admin";

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, cargo").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.display_name || "");
          setProfileCargo(data.cargo || "");
        }
        setProfileLoading(false);
      });
  }, [user]);

  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    const { data, error } = await supabase.from("profiles").select("id, user_id, display_name, cargo, aprovado, created_at").order("created_at", { ascending: true });
    if (!error && data) setAllUsers(data as ProfileRow[]);
    setUsersLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

  async function updateUserCargo(profileUserId: string, newCargo: string) {
    setSavingUserId(profileUserId);
    const { error } = await supabase.from("profiles").update({ cargo: newCargo || null }).eq("user_id", profileUserId);
    if (error) {
      toast.error("Erro ao atualizar cargo");
    } else {
      setAllUsers(prev => prev.map(u => u.user_id === profileUserId ? { ...u, cargo: newCargo || null } : u));
      if (profileUserId === user?.id) {
        setProfileCargo(newCargo);
        await refreshProfile();
      }
      toast.success("Cargo atualizado");
    }
    setSavingUserId(null);
  }

  async function saveProfile() {
    if (!user) return;
    setProfileSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profileName.trim() || null,
      cargo: profileCargo || null,
    }).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar perfil");
      setProfileSaving(false);
      return;
    }
    await refreshProfile();
    setProfileSaving(false);
    toast.success("Perfil atualizado");
  }

  function updateMeta(cat: Categoria, masked: string) {
    const numVal = parseCurrencyMask(masked);
    setData((prev) => {
      const newMetas = { ...prev.metas, [cat]: numVal };
      const updatedHistorico = upsertHistoricoMetas(prev, currentMonth, currentYear, newMetas, prev.meta_semanal);
      return { ...prev, metas: newMetas, historico_metas: updatedHistorico };
    });
  }

  function updateMetaSemanal(field: string, value: string) {
    const numVal = parseInt(value) || 0;
    setData((prev) => {
      const newMetaSemanal = { ...prev.meta_semanal, [field]: numVal };
      const updatedHistorico = upsertHistoricoMetas(prev, currentMonth, currentYear, prev.metas, newMetaSemanal);
      return { ...prev, meta_semanal: newMetaSemanal, historico_metas: updatedHistorico };
    });
  }

  function upsertHistoricoMetas(prev: AppData, mes: number, ano: number, metas: AppData["metas"], meta_semanal: AppData["meta_semanal"]) {
    const existing = prev.historico_metas.findIndex(h => h.mes === mes && h.ano === ano);
    const entry = { id: `meta-${mes}-${ano}`, mes, ano, metas: { ...metas }, meta_semanal: { ...meta_semanal } };
    if (existing >= 0) {
      return prev.historico_metas.map((h, i) => i === existing ? entry : h);
    }
    return [...prev.historico_metas, entry];
  }

  function addVendedor() {
    if (!novoVendedor.trim()) return;
    setData((prev) => ({ ...prev, vendedores: [...prev.vendedores, novoVendedor.trim()] }));
    setNovoVendedor("");
    toast.success("Vendedor adicionado");
  }

  function removeVendedor(name: string) {
    setData((prev) => ({ ...prev, vendedores: prev.vendedores.filter((v) => v !== name) }));
    undoDelete(name, `Vendedor "${name}" removido.`, (prev) => ({
      ...prev, vendedores: [...prev.vendedores, name],
    }));
  }

  function handleExport() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comercial_data_backup_${now.toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados com sucesso");
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const importData: AppData = Array.isArray(parsed) ? parsed[0] : parsed;
        if (!importData.metas || !importData.lancamentos) {
          toast.error("Arquivo inválido: estrutura não reconhecida");
          return;
        }
        if (!importData.historico_metas) importData.historico_metas = [];
        setPendingImport(importData);
        setShowImportConfirm(true);
      } catch {
        toast.error("Erro ao ler o arquivo JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function confirmImport() {
    if (!pendingImport) return;
    setData(() => pendingImport);
    setShowImportConfirm(false);
    setPendingImport(null);
    toast.success("Dados importados com sucesso");
  }

  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      {/* Perfil do Usuário */}
      <div>
        <p className="ios-section-title">PERFIL DO USUÁRIO</p>
        <div className="ios-list-group">
          <div className="ios-list-item">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Nome</span>
            </div>
            <input
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              placeholder="Seu nome"
              className="text-right text-sm font-medium text-primary bg-transparent outline-none w-40"
            />
          </div>
          <div className="ios-list-item">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Cargo</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {CARGOS.find(c => c.value === profileCargo)?.label || "Não definido"}
            </span>
          </div>
          <div className="p-3">
            <button onClick={saveProfile} disabled={profileSaving || profileLoading}
              className="w-full h-10 rounded-xl text-sm font-semibold text-primary-foreground bg-primary disabled:opacity-50">
              {profileSaving ? "Salvando..." : "Salvar Perfil"}
            </button>
          </div>
        </div>
      </div>

      {/* Admin: Gerenciamento de Usuários */}
      {isAdmin && (
        <div>
          <p className="ios-section-title">GERENCIAMENTO DE USUÁRIOS</p>
          <div className="ios-list-group">
            {/* Search */}
            <div className="ios-list-item gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Buscar por nome ou email"
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder-muted-foreground"
              />
            </div>

            {usersLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Carregando usuários...</div>
            ) : (
              allUsers
                .filter(u => {
                  if (!userSearch.trim()) return true;
                  const q = userSearch.toLowerCase();
                  return (u.display_name || "").toLowerCase().includes(q) || u.user_id.toLowerCase().includes(q);
                })
                .map(u => (
                  <div key={u.id} className="p-4 border-b border-border/30 last:border-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {u.display_name || "Sem nome"}
                            {u.user_id === user?.id && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">Você</span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {CARGOS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => updateUserCargo(u.user_id, c.value)}
                          disabled={savingUserId === u.user_id}
                          className="p-2 rounded-xl text-center transition disabled:opacity-50"
                          style={{
                            background: u.cargo === c.value ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                            border: u.cargo === c.value ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid transparent',
                          }}
                        >
                          <p className="text-xs font-semibold" style={{ color: u.cargo === c.value ? 'hsl(var(--primary))' : undefined }}>{c.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
            )}

            <div className="p-3 text-center">
              <p className="text-[11px] text-muted-foreground">{allUsers.length} usuário(s) cadastrado(s)</p>
            </div>
          </div>
        </div>
      )}

      {/* Aparência */}
      <div>
        <p className="ios-section-title">APARÊNCIA</p>
        <div className="ios-list-group">
          <div className="ios-list-item">
            <span className="text-sm text-foreground">Tema</span>
            <div className="segmented-control">
              <button onClick={() => setMode("light")}
                className={`segmented-btn flex items-center gap-1.5 ${mode === "light" ? "active" : ""}`}>
                <Sun className="h-3.5 w-3.5" />Claro
              </button>
              <button onClick={() => setMode("dark")}
                className={`segmented-btn flex items-center gap-1.5 ${mode === "dark" ? "active" : ""}`}>
                <Moon className="h-3.5 w-3.5" />Escuro
              </button>
            </div>
          </div>
          <div className="ios-list-item">
            <span className="text-sm text-foreground">Cor de acento</span>
            <div className="flex gap-2">
              {(Object.keys(accentMap) as AccentColor[]).map((color) => (
                <button key={color} onClick={() => setAccent(color)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: accentMap[color].hex }}>
                  {accent === color && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metas Mensais */}
      <div>
        <p className="ios-section-title">METAS MENSAIS (R$)</p>
        <div className="ios-list-group">
          {(["produto", "servico", "contrato", "acessorio"] as Categoria[]).map((cat) => (
            <div key={cat} className="ios-list-item">
              <span className="text-sm text-foreground">{CATEGORIA_LABELS[cat]}</span>
              <input inputMode="numeric" value={numberToCurrencyMask(data.metas[cat])}
                onChange={(e) => updateMeta(cat, e.target.value)}
                className="text-right text-sm font-medium text-primary bg-transparent outline-none w-36" />
            </div>
          ))}
        </div>
      </div>

      {/* Metas Semanais */}
      <div>
        <p className="ios-section-title">METAS SEMANAIS</p>
        <div className="ios-list-group">
          {[
            { key: "captacoes", label: "Captações" },
            { key: "orcamentos", label: "Orçamentos" },
            { key: "visitas", label: "Visitas" },
          ].map(({ key, label }) => (
            <div key={key} className="ios-list-item">
              <span className="text-sm text-foreground">{label}</span>
              <input type="number"
                value={data.meta_semanal[key as keyof typeof data.meta_semanal]}
                onChange={(e) => updateMetaSemanal(key, e.target.value)}
                className="text-right text-sm font-medium text-primary bg-transparent outline-none w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Vendedores */}
      <div>
        <p className="ios-section-title">VENDEDORES</p>
        <div className="ios-list-group">
          {data.vendedores.map((v) => (
            <div key={v} className="ios-list-item">
              <span className="text-sm text-foreground">{v}</span>
              <button onClick={() => removeVendedor(v)} className="p-1 rounded-full bg-destructive/15">
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
          <div className="ios-list-item gap-2">
            <input value={novoVendedor} onChange={(e) => setNovoVendedor(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addVendedor()}
              placeholder="Novo vendedor" className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder-muted-foreground" />
            <button onClick={addVendedor} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/15 text-primary">
              <Plus className="h-3.5 w-3.5" />Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Dados */}
      <div>
        <p className="ios-section-title">DADOS</p>
        <div className="ios-list-group">
          <button onClick={handleExport} className="ios-list-item w-full text-left">
            <div className="flex items-center gap-3">
              <Download className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Exportar Dados (JSON)</span>
            </div>
          </button>
          <button onClick={handleImportClick} className="ios-list-item w-full text-left">
            <div className="flex items-center gap-3">
              <Upload className="h-4 w-4 text-success" />
              <span className="text-sm text-foreground">Importar Dados (JSON)</span>
            </div>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
      </div>

      {/* Import Confirm Modal */}
      {showImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4 text-center glass-card">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-destructive/15">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Substituir dados?</h3>
            <p className="text-sm text-muted-foreground">
              Todos os dados atuais serão substituídos pelos dados do arquivo importado. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowImportConfirm(false); setPendingImport(null); }}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-secondary text-muted-foreground">
                Cancelar
              </button>
              <button onClick={confirmImport}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-destructive">
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Save Note */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 md:left-60 p-4 z-30 glass-nav">
        <p className="text-center text-xs text-muted-foreground">As alterações são salvas automaticamente</p>
      </div>
    </div>
  );
}
