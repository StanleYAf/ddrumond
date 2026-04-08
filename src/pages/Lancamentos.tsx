import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData } from "@/lib/dataContext";
import { CATEGORIA_LABELS, CATEGORIA_ARRAY, CATEGORIA_FIELD, MESES, formatCurrency, formatDate, lancamentoSchema, getMetasForMonth, type Categoria, type Lancamento } from "@/lib/types";
import { applyCurrencyMask, parseCurrencyMask, numberToCurrencyMask } from "@/lib/currencyMask";
import { Trash2, ChevronDown, Search, ChevronUp, Pencil, X, ChevronLeft, ChevronRight, FileX, Download } from "lucide-react";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

const CAT_COLORS: Record<Categoria, string> = {
  produto: "#0A84FF", servico: "#30D158", contrato: "#FFD60A", acessorio: "#BF5AF2",
};

const ITEMS_PER_PAGE = 10;
type SortKey = "data" | "cliente" | "valor" | "descricao";

function getDescricao(e: Lancamento) {
  return e.produto || e.servico || e.item || "";
}

export default function Lancamentos() {
  const { data, setData, loading, error, undoDelete } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();

  const catParam = searchParams.get("categoria") as keyof typeof CATEGORIA_ARRAY | null;
  const mesParam = parseInt(searchParams.get("mes") || "") - 1;
  const anoParam = parseInt(searchParams.get("ano") || "");

  const filterMonth = isNaN(mesParam) || mesParam < 0 || mesParam > 11 ? now.getMonth() : mesParam;
  const filterYear = isNaN(anoParam) ? now.getFullYear() : anoParam;
  const categoria: Categoria | "todos" = catParam && ["produto", "servico", "contrato", "acessorio"].includes(catParam) ? catParam as Categoria : "todos";

  function setFilterMonth(m: number) {
    setSearchParams(prev => { prev.set("mes", String(m + 1)); return prev; }, { replace: true });
  }
  function setFilterYear(y: number) {
    setSearchParams(prev => { prev.set("ano", String(y)); return prev; }, { replace: true });
  }
  function setCategoria(c: Categoria | "todos") {
    setSearchParams(prev => {
      if (c === "todos") prev.delete("categoria");
      else prev.set("categoria", c);
      return prev;
    }, { replace: true });
  }

  const [showForm, setShowForm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("data");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);

  const [cliente, setCliente] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [dataLanc, setDataLanc] = useState(now.toISOString().slice(0, 10));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editItem, setEditItem] = useState<(Lancamento & { cat: Categoria }) | null>(null);
  const [editCliente, setEditCliente] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editData, setEditData] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const formCat = categoria === "todos" ? "produto" : categoria as Categoria;
  const fieldLabel = formCat === "acessorio" ? "Acessório" : formCat === "produto" ? "Produto" : "Serviço";
  const tipoLabel = formCat === "acessorio" ? "Tipo de Acessório" : formCat === "produto" ? "Tipo de Produto" : formCat === "contrato" ? "Tipo de Contrato" : "Tipo de Serviço";

  function validateForm(c: string, d: string, v: string, dt: string) {
    const result = lancamentoSchema.safeParse({ cliente: c, descricao: d, valor: parseFloat(v) || 0, data: dt });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
      return errs;
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(cliente, descricao, String(parseCurrencyMask(valor)), dataLanc);
    if (errs) { setFormErrors(errs); toast.error("Corrija os campos inválidos"); return; }
    setFormErrors({});
    const newItem: Lancamento = {
      id: crypto.randomUUID(), cliente: cliente.trim(), valor: parseCurrencyMask(valor), data: dataLanc,
      [CATEGORIA_FIELD[formCat]]: descricao.trim(),
    };
    setData((prev) => ({
      ...prev,
      lancamentos: { ...prev.lancamentos, [CATEGORIA_ARRAY[formCat]]: [...prev.lancamentos[CATEGORIA_ARRAY[formCat]], newItem] },
    }));
    setCliente(""); setDescricao(""); setValor(""); setShowForm(false);
    toast.success("Lançamento adicionado com sucesso");
  }

  function openEdit(entry: Lancamento & { cat: Categoria }) {
    setEditItem(entry);
    setEditCliente(entry.cliente);
    setEditDescricao(getDescricao(entry));
    setEditValor(numberToCurrencyMask(entry.valor));
    setEditData(entry.data);
    setEditErrors({});
  }

  function handleEditSave() {
    if (!editItem) return;
    const errs = validateForm(editCliente, editDescricao, String(parseCurrencyMask(editValor)), editData);
    if (errs) { setEditErrors(errs); toast.error("Corrija os campos inválidos"); return; }
    setEditErrors({});
    const arrKey = CATEGORIA_ARRAY[editItem.cat];
    const fieldKey = CATEGORIA_FIELD[editItem.cat];
    setData((prev) => ({
      ...prev,
      lancamentos: {
        ...prev.lancamentos,
        [arrKey]: prev.lancamentos[arrKey].map(l =>
          l.id === editItem.id ? { ...l, cliente: editCliente.trim(), valor: parseCurrencyMask(editValor), data: editData, [fieldKey]: editDescricao.trim() } : l
        ),
      },
    }));
    setEditItem(null);
    toast.success("Lançamento atualizado");
  }

  function handleDelete(cat: Categoria, id: string) {
    const arrKey = CATEGORIA_ARRAY[cat];
    const deletedItem = data.lancamentos[arrKey].find(l => l.id === id);
    if (!deletedItem) return;

    setData((prev) => ({
      ...prev,
      lancamentos: { ...prev.lancamentos, [arrKey]: prev.lancamentos[arrKey].filter((l) => l.id !== id) },
    }));

    undoDelete(id, "Lançamento excluído.", (prev) => ({
      ...prev,
      lancamentos: { ...prev.lancamentos, [arrKey]: [...prev.lancamentos[arrKey], deletedItem] },
    }));
  }

  const allEntries = useMemo(() => {
    const entries: (Lancamento & { cat: Categoria })[] = [];
    const catsToShow = categoria === "todos" ? (["produto", "servico", "contrato", "acessorio"] as Categoria[]) : [categoria as Categoria];
    catsToShow.forEach((cat) => {
      data.lancamentos[CATEGORIA_ARRAY[cat]]
        .filter((l) => { const [y, m] = l.data.split("-").map(Number); return (m - 1) === filterMonth && y === filterYear; })
        .forEach((l) => entries.push({ ...l, cat }));
    });
    const q = searchQuery.toLowerCase().trim();
    const searched = q
      ? entries.filter(e => e.cliente.toLowerCase().includes(q) || getDescricao(e).toLowerCase().includes(q))
      : entries;
    searched.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "data") cmp = a.data.localeCompare(b.data);
      else if (sortKey === "cliente") cmp = a.cliente.localeCompare(b.cliente);
      else if (sortKey === "valor") cmp = a.valor - b.valor;
      else cmp = getDescricao(a).localeCompare(getDescricao(b));
      return sortAsc ? cmp : -cmp;
    });
    return searched;
  }, [data, filterMonth, filterYear, categoria, searchQuery, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(allEntries.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedEntries = allEntries.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const totalMes = allEntries.reduce((s, e) => s + e.valor, 0);
  const { metas: currentMetas } = getMetasForMonth(data.historico_metas, filterMonth, filterYear, data.metas, data.meta_semanal);
  const metaCategoria = categoria === "todos"
    ? Object.values(currentMetas).reduce((a, b) => a + b, 0)
    : currentMetas[categoria as Categoria];
  const totalCategoria = totalMes;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
    setPage(0);
  }

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  const editFieldLabel = editItem ? (editItem.cat === "acessorio" ? "Acessório" : editItem.cat === "produto" ? "Produto" : "Serviço") : "";

  function ErrorMsg({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-[11px] mt-1 font-medium" style={{ color: '#FF453A' }}>{msg}</p>;
  }

  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  function exportCSV() {
    const rows = allEntries.map(e => ({
      Data: formatDate(e.data),
      Cliente: e.cliente,
      Descrição: getDescricao(e),
      Categoria: CATEGORIA_LABELS[e.cat],
      Valor: e.valor.toFixed(2),
    }));
    const header = "Data,Cliente,Descrição,Categoria,Valor";
    const csvContent = [header, ...rows.map(r =>
      [r.Data, `"${r.Cliente}"`, `"${r.Descrição}"`, r.Categoria, r.Valor].join(",")
    )].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const mesStr = String(filterMonth + 1).padStart(2, "0");
    a.href = url;
    a.download = `lancamentos_${filterYear}-${mesStr}_${categoria}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>
        <div className="relative">
          <button onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground bg-secondary">
            {MESES[filterMonth].substring(0, 3)} {filterYear}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {showPicker && (
            <div className="absolute right-0 top-full mt-2 z-50 p-3 rounded-2xl w-64 bg-popover border border-border backdrop-blur-xl">
              <div className="flex gap-2 mb-3">
                {[2025, 2026, 2027].map(y => (
                  <button key={y} onClick={() => setFilterYear(y)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${y === filterYear ? 'bg-primary text-foreground' : 'text-muted-foreground'}`}>{y}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {MESES.map((m, i) => (
                  <button key={i} onClick={() => { setFilterMonth(i); setShowPicker(false); setPage(0); }}
                    className={`py-2 rounded-lg text-xs font-medium ${i === filterMonth ? 'bg-primary text-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{m.substring(0, 3)}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        <button onClick={() => setCategoria("todos")}
          className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
          style={{
            background: categoria === "todos" ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
            color: categoria === "todos" ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            border: `1px solid ${categoria === "todos" ? 'hsl(var(--primary) / 0.4)' : 'transparent'}`,
          }}>
          Todos
        </button>
        {(["produto", "servico", "contrato", "acessorio"] as Categoria[]).map(cat => (
          <button key={cat} onClick={() => setCategoria(cat)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: categoria === cat ? CAT_COLORS[cat] + '20' : 'rgba(255,255,255,0.05)',
              color: categoria === cat ? CAT_COLORS[cat] : '#8E8E93',
              border: `1px solid ${categoria === cat ? CAT_COLORS[cat] + '40' : 'transparent'}`,
            }}>
            {CATEGORIA_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="glass-card p-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">Total mês</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalMes)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">{categoria === "todos" ? "Total" : CATEGORIA_LABELS[categoria as Categoria]}</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalCategoria)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">Falta</p>
          <p className="text-lg font-bold" style={{ color: '#FF453A' }}>{formatCurrency(Math.max(0, metaCategoria - totalCategoria))}</p>
        </div>
      </div>

      {/* New Entry Button / Form */}
      {!showForm ? (
        <button onClick={() => { setShowForm(true); setFormErrors({}); }}
          className="w-full py-3 rounded-2xl text-base font-semibold text-foreground bg-primary">
          + Novo Lançamento
        </button>
      ) : (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Novo Lançamento</h3>
            <button onClick={() => setShowForm(false)} className="text-sm text-primary">Cancelar</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium block mb-1 text-muted-foreground">Cliente</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)} className="ios-input w-full" placeholder="Nome do cliente" />
              <ErrorMsg msg={formErrors.cliente} />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1 text-muted-foreground">{fieldLabel}</label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} className="ios-input w-full" placeholder={fieldLabel} />
              <ErrorMsg msg={formErrors.descricao} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium block mb-1 text-muted-foreground">Valor (R$)</label>
                <input inputMode="numeric" value={valor} onChange={e => setValor(applyCurrencyMask(e.target.value))} className="ios-input w-full" placeholder="R$ 0,00" />
                <ErrorMsg msg={formErrors.valor} />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1 text-muted-foreground">Data</label>
                <input type="date" value={dataLanc} onChange={e => setDataLanc(e.target.value)} className="ios-input w-full" />
                <ErrorMsg msg={formErrors.data} />
              </div>
            </div>
            <button type="submit" className="w-full h-12 rounded-xl text-base font-semibold text-foreground bg-primary">
              Lançar
            </button>
          </form>
        </div>
      )}

      {/* Search + Sort Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            className="ios-input w-full pl-10" placeholder="Buscar cliente ou produto..." />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {([
            { key: "data" as SortKey, label: "Data" },
            { key: "cliente" as SortKey, label: "Cliente" },
            { key: "valor" as SortKey, label: "Valor" },
            { key: "descricao" as SortKey, label: "Descrição" },
          ]).map(s => (
            <button key={s.key} onClick={() => toggleSort(s.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
              style={{
                background: sortKey === s.key ? 'rgba(10,132,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: sortKey === s.key ? '#0A84FF' : '#8E8E93',
              }}>
              {s.label}<SortIcon field={s.key} />
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="ios-section-title">LANÇAMENTOS — {MESES[filterMonth].toUpperCase()} ({allEntries.length})</p>
          {allEntries.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-muted transition">
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          )}
        </div>
        {allEntries.length === 0 ? (
          <EmptyState icon={FileX} title="Nenhum lançamento" description="Adicione um lançamento para este mês." />
        ) : (
          <div className="ios-list-group">
            {paginatedEntries.map((e) => (
              <div key={e.id} className="ios-list-item">
                <button className="flex-1 min-w-0 text-left" onClick={() => openEdit(e)}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[e.cat] }} />
                    <span className="text-sm font-medium text-foreground truncate">{e.cliente}</span>
                  </div>
                  <p className="text-xs mt-0.5 ml-3.5 truncate text-muted-foreground">
                    {getDescricao(e)} · {formatDate(e.data)}
                  </p>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold" style={{ color: '#30D158' }}>{formatCurrency(e.valor)}</span>
                  <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5 text-primary" />
                  </button>
                  <button onClick={() => handleDelete(e.cat, e.id)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Trash2 className="h-3.5 w-3.5" style={{ color: '#FF453A' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
              className="p-2 rounded-lg disabled:opacity-30 bg-muted">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-xs font-medium text-muted-foreground">{currentPage + 1} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg disabled:opacity-30 bg-muted">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 space-y-4 bg-popover border border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Editar Lançamento</h3>
              <button onClick={() => setEditItem(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="px-1.5 py-1 rounded-full text-[10px] font-medium inline-block"
              style={{ background: CAT_COLORS[editItem.cat] + '20', color: CAT_COLORS[editItem.cat] }}>
              {CATEGORIA_LABELS[editItem.cat]}
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1 text-muted-foreground">Cliente</label>
              <input value={editCliente} onChange={e => setEditCliente(e.target.value)} className="ios-input w-full" />
              <ErrorMsg msg={editErrors.cliente} />
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1 text-muted-foreground">{editFieldLabel}</label>
              <input value={editDescricao} onChange={e => setEditDescricao(e.target.value)} className="ios-input w-full" />
              <ErrorMsg msg={editErrors.descricao} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium block mb-1 text-muted-foreground">Valor (R$)</label>
                <input inputMode="numeric" value={editValor} onChange={e => setEditValor(applyCurrencyMask(e.target.value))} className="ios-input w-full" placeholder="R$ 0,00" />
                <ErrorMsg msg={editErrors.valor} />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1 text-muted-foreground">Data</label>
                <input type="date" value={editData} onChange={e => setEditData(e.target.value)} className="ios-input w-full" />
                <ErrorMsg msg={editErrors.data} />
              </div>
            </div>
            <button onClick={handleEditSave} className="w-full h-12 rounded-xl text-base font-semibold text-foreground bg-primary">
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
