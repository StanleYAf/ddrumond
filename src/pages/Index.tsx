import { useState, useMemo, useEffect } from "react";
import { useAppData } from "@/lib/dataContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/authContext";
import { useSearchParams } from "react-router-dom";
import { CATEGORIA_LABELS, MESES, formatCurrency, daysInMonth, dayOfMonth, getMetasForMonth, type Categoria, type Lancamento } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Package, Wrench, FileText, Puzzle, TrendingUp, ChevronDown, Bell, X, AlertTriangle, Clock, Target, GitCompare, Users, Trophy, Hash, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";

const ICONS: Record<Categoria, React.ElementType> = {
  produto: Package, servico: Wrench, contrato: FileText, acessorio: Puzzle,
};

const CAT_COLORS: Record<Categoria, string> = {
  produto: "#0A84FF", servico: "#30D158", contrato: "#FFD60A", acessorio: "#BF5AF2",
};

function progressColor(pct: number) {
  if (pct >= 90) return "#30D158";
  if (pct >= 70) return "#FFD60A";
  return "#FF453A";
}

function filterByVendedor(items: Lancamento[], vendedor: string | null) {
  if (!vendedor) return items;
  return items.filter(i => i.vendedor === vendedor);
}

function sumByMonth(items: Lancamento[], month: number, year: number, vendedor: string | null = null) {
  return filterByVendedor(items, vendedor)
    .filter((i) => { const d = new Date(i.data); return d.getMonth() === month && d.getFullYear() === year; })
    .reduce((s, i) => s + i.valor, 0);
}

function itemsByMonth(items: Lancamento[], month: number, year: number, vendedor: string | null = null) {
  return filterByVendedor(items, vendedor)
    .filter((i) => { const d = new Date(i.data); return d.getMonth() === month && d.getFullYear() === year; });
}

interface Alert {
  id: string;
  icon: React.ElementType;
  message: string;
  color: string;
  route: string;
}

type CompareMode = "none" | "prev_month" | "prev_year";
type RankSort = "valor" | "count";

interface ClientRank {
  cliente: string;
  valor: number;
  count: number;
}

export default function Dashboard() {
  const { data, loading, error } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();

  const month = parseInt(searchParams.get("mes") || "") - 1;
  const year = parseInt(searchParams.get("ano") || "");
  const currentMonth = isNaN(month) || month < 0 || month > 11 ? now.getMonth() : month;
  const currentYear = isNaN(year) ? now.getFullYear() : year;

  const vendedorParam = searchParams.get("vendedor") || null;

  const [showPicker, setShowPicker] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>("prev_month");
  const [rankSort, setRankSort] = useState<RankSort>("valor");
  const [stockAlerts, setStockAlerts] = useState<Alert[]>([]);

  // Fetch stock alerts from Supabase
  useEffect(() => {
    if (!user) return;
    supabase.from("produtos_estoque").select("nome, estoque_atual, estoque_minimo, ativo")
      .eq("user_id", user.id).eq("ativo", true).then(({ data: prods }) => {
        if (!prods) return;
        const alerts: Alert[] = [];
        const zerado = prods.filter(p => Number(p.estoque_atual) === 0);
        if (zerado.length > 0) {
          alerts.push({
            id: "stock-zerado", icon: AlertTriangle,
            message: `${zerado.length} produto(s) com estoque zerado: ${zerado.slice(0, 3).map(p => p.nome).join(", ")}${zerado.length > 3 ? "..." : ""}`,
            color: "#FF453A", route: "/estoque",
          });
        }
        const baixo = prods.filter(p => Number(p.estoque_atual) > 0 && Number(p.estoque_atual) < Number(p.estoque_minimo));
        if (baixo.length > 0) {
          alerts.push({
            id: "stock-baixo", icon: AlertTriangle,
            message: `${baixo.length} produto(s) abaixo do estoque mínimo`,
            color: "#FFD60A", route: "/estoque",
          });
        }
        setStockAlerts(alerts);
      });
  }, [user]);

  function setMonth(m: number) {
    setSearchParams(prev => { prev.set("mes", String(m + 1)); return prev; }, { replace: true });
  }
  function setYear(y: number) {
    setSearchParams(prev => { prev.set("ano", String(y)); return prev; }, { replace: true });
  }
  function setVendedor(v: string | null) {
    setSearchParams(prev => {
      if (v) prev.set("vendedor", v);
      else prev.delete("vendedor");
      return prev;
    }, { replace: true });
  }

  const { metas: currentMetas } = getMetasForMonth(data.historico_metas, currentMonth, currentYear, data.metas, data.meta_semanal);

  const totals: Record<Categoria, number> = {
    produto: sumByMonth(data.lancamentos.produtos, currentMonth, currentYear, vendedorParam),
    servico: sumByMonth(data.lancamentos.servicos, currentMonth, currentYear, vendedorParam),
    contrato: sumByMonth(data.lancamentos.contratos, currentMonth, currentYear, vendedorParam),
    acessorio: sumByMonth(data.lancamentos.acessorios, currentMonth, currentYear, vendedorParam),
  };

  const totalGeral = Object.values(totals).reduce((a, b) => a + b, 0);
  const metaTotal = Object.values(currentMetas).reduce((a, b) => a + b, 0);
  const pctTotal = metaTotal > 0 ? (totalGeral / metaTotal) * 100 : 0;

  // Comparison
  let compMonth = currentMonth;
  let compYear = currentYear;
  if (compareMode === "prev_month") {
    compMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    compYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  } else if (compareMode === "prev_year") {
    compYear = currentYear - 1;
  }

  const compTotals: Record<Categoria, number> = compareMode !== "none" ? {
    produto: sumByMonth(data.lancamentos.produtos, compMonth, compYear, vendedorParam),
    servico: sumByMonth(data.lancamentos.servicos, compMonth, compYear, vendedorParam),
    contrato: sumByMonth(data.lancamentos.contratos, compMonth, compYear, vendedorParam),
    acessorio: sumByMonth(data.lancamentos.acessorios, compMonth, compYear, vendedorParam),
  } : { produto: 0, servico: 0, contrato: 0, acessorio: 0 };

  const compTotalGeral = Object.values(compTotals).reduce((a, b) => a + b, 0);

  function variation(current: number, previous: number): { pct: number; positive: boolean } | null {
    if (compareMode === "none" || previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return { pct, positive: pct >= 0 };
  }

  // Projections
  const isCurrentMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();
  const totalDays = daysInMonth(currentMonth, currentYear);
  const elapsed = isCurrentMonth ? dayOfMonth(now) : totalDays;

  const projections = useMemo(() => {
    const cats = ["produto", "servico", "contrato", "acessorio"] as Categoria[];
    return cats.map(cat => {
      const atual = totals[cat];
      const proj = elapsed > 0 ? (atual / elapsed) * totalDays : 0;
      const meta = currentMetas[cat];
      const pctProj = meta > 0 ? (proj / meta) * 100 : 0;
      return { cat, atual, proj, meta, pctProj };
    });
  }, [totals, elapsed, totalDays, currentMetas]);

  const totalProj = projections.reduce((s, p) => s + p.proj, 0);
  const pctTotalProj = metaTotal > 0 ? (totalProj / metaTotal) * 100 : 0;

  // Smart Alerts
  const alerts = useMemo(() => {
    const list: Alert[] = [];
    (["produto", "servico", "contrato", "acessorio"] as Categoria[]).forEach(cat => {
      const pct = currentMetas[cat] > 0 ? (totals[cat] / currentMetas[cat]) * 100 : 0;
      if (pct < 50 && isCurrentMonth && now.getDate() > 20) {
        list.push({
          id: `meta-${cat}`, icon: AlertTriangle,
          message: `${CATEGORIA_LABELS[cat]}: apenas ${pct.toFixed(0)}% da meta após dia 20 (${formatCurrency(totals[cat])} / ${formatCurrency(currentMetas[cat])})`,
          color: "#FF453A", route: "/lancamentos",
        });
      }
    });
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const oldPending = data.pos_venda.filter(p => p.status === "Aguardando retorno" && p.data <= sevenDaysAgo);
    if (oldPending.length > 0) {
      list.push({
        id: "pos-venda-old", icon: Clock,
        message: `${oldPending.length} cliente(s) aguardando retorno há mais de 7 dias`,
        color: "#FFD60A", route: "/pos-venda",
      });
    }
    const currentMonthName = MESES[now.getMonth()];
    const lastWeekIndicators = data.indicadores_semanais.filter(i => i.mes === currentMonthName && i.ano === now.getFullYear());
    if (lastWeekIndicators.length > 0) {
      const last = lastWeekIndicators[lastWeekIndicators.length - 1];
      const missed: string[] = [];
      if (last.captacoes < data.meta_semanal.captacoes) missed.push("Captações");
      if (last.orcamentos < data.meta_semanal.orcamentos) missed.push("Orçamentos");
      if (last.visitas < data.meta_semanal.visitas) missed.push("Visitas");
      if (missed.length > 0) {
        list.push({
          id: "indicador-miss", icon: Target,
          message: `Meta semanal não atingida: ${missed.join(", ")} (${last.vendedor}, S${last.semana})`,
          color: "#FFD60A", route: "/indicadores",
        });
      }
    }
    // Add stock alerts
    list.push(...stockAlerts);
    return list;
  }, [data, totals, isCurrentMonth, elapsed, now, currentMetas, stockAlerts]);

  // Client Ranking
  const clientRanking = useMemo(() => {
    const map = new Map<string, ClientRank>();
    const allCats = [
      ...itemsByMonth(data.lancamentos.produtos, currentMonth, currentYear, vendedorParam),
      ...itemsByMonth(data.lancamentos.servicos, currentMonth, currentYear, vendedorParam),
      ...itemsByMonth(data.lancamentos.contratos, currentMonth, currentYear, vendedorParam),
      ...itemsByMonth(data.lancamentos.acessorios, currentMonth, currentYear, vendedorParam),
    ];
    allCats.forEach(l => {
      const existing = map.get(l.cliente);
      if (existing) {
        existing.valor += l.valor;
        existing.count += 1;
      } else {
        map.set(l.cliente, { cliente: l.cliente, valor: l.valor, count: 1 });
      }
    });
    const arr = Array.from(map.values());
    arr.sort((a, b) => rankSort === "valor" ? b.valor - a.valor : b.count - a.count);
    return arr;
  }, [data, currentMonth, currentYear, vendedorParam, rankSort]);

  const chartData = MESES.map((mesNome, i) => {
    const row: Record<string, string | number> = {
      mes: mesNome.substring(0, 3),
      Produtos: sumByMonth(data.lancamentos.produtos, i, currentYear, vendedorParam),
      Serviços: sumByMonth(data.lancamentos.servicos, i, currentYear, vendedorParam),
      Contratos: sumByMonth(data.lancamentos.contratos, i, currentYear, vendedorParam),
      Acessórios: sumByMonth(data.lancamentos.acessorios, i, currentYear, vendedorParam),
    };
    if (compareMode !== "none") {
      const cy = compareMode === "prev_year" ? currentYear - 1 : currentYear;
      row["Prod. Comp."] = sumByMonth(data.lancamentos.produtos, i, cy, vendedorParam);
      row["Serv. Comp."] = sumByMonth(data.lancamentos.servicos, i, cy, vendedorParam);
    }
    return row;
  });

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  // Always compute prev month for the "vs mês anterior" line
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevTotals: Record<Categoria, number> = {
    produto: sumByMonth(data.lancamentos.produtos, prevMonth, prevMonthYear, vendedorParam),
    servico: sumByMonth(data.lancamentos.servicos, prevMonth, prevMonthYear, vendedorParam),
    contrato: sumByMonth(data.lancamentos.contratos, prevMonth, prevMonthYear, vendedorParam),
    acessorio: sumByMonth(data.lancamentos.acessorios, prevMonth, prevMonthYear, vendedorParam),
  };
  const prevTotalGeral = Object.values(prevTotals).reduce((a, b) => a + b, 0);

  function monthVariation(current: number, previous: number): { pct: number; positive: boolean } | null {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { pct: 100, positive: true };
    if (current === 0 && previous > 0) return { pct: -100, positive: false };
    const pct = ((current - previous) / previous) * 100;
    return { pct, positive: pct >= 0 };
  }

  function VariationBadge({ current, previous, showLabel = false }: { current: number; previous: number; showLabel?: boolean }) {
    const v = monthVariation(current, previous);
    if (!v) return <span className="text-[10px] text-muted-foreground">{showLabel ? "Sem dados anteriores" : ""}</span>;
    const color = v.positive ? "#30D158" : "#FF453A";
    const arrow = v.positive ? "▲" : "▼";
    return (
      <span className="text-[10px] font-semibold" style={{ color }}>
        {arrow} {Math.abs(v.pct).toFixed(0)}%{showLabel ? " vs mês anterior" : ""}
      </span>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do faturamento</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground bg-secondary">
              {MESES[currentMonth].substring(0, 3)} {currentYear}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showPicker && (
              <div className="absolute right-0 top-full mt-2 z-50 p-3 rounded-2xl w-64 bg-popover border border-border backdrop-blur-xl">
                <div className="flex gap-2 mb-3">
                  {[2025, 2026, 2027].map(y => (
                    <button key={y} onClick={() => setYear(y)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${y === currentYear ? 'bg-primary text-foreground' : 'text-muted-foreground'}`}>{y}</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MESES.map((m, i) => (
                    <button key={i} onClick={() => { setMonth(i); setShowPicker(false); }}
                      className={`py-2 rounded-lg text-xs font-medium transition ${i === currentMonth ? 'bg-primary text-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                      {m.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="segmented-control">
          <button
            onClick={() => setVendedor(null)}
            className={`segmented-btn ${!vendedorParam ? 'active' : ''}`}>
            Todos
          </button>
          {data.vendedores.map(v => (
            <button key={v}
              onClick={() => setVendedor(v)}
              className={`segmented-btn ${vendedorParam === v ? 'active' : ''}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Banner */}
      {!dismissedAlerts && alerts.length > 0 && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Alertas ({alerts.length})</h3>
            </div>
            <button onClick={() => setDismissedAlerts(true)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          {alerts.map(a => (
            <button key={a.id} onClick={() => { navigate(a.route); setDismissedAlerts(true); }}
              className="w-full text-left flex items-start gap-3 p-3 rounded-xl transition hover:bg-muted"
              style={{ background: a.color + '08', border: `1px solid ${a.color}20` }}>
              <a.icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: a.color }} />
              <span className="text-xs text-foreground leading-relaxed">{a.message}</span>
            </button>
          ))}
        </div>
      )}

      {/* Compare Toggle */}
      <div className="flex items-center gap-2">
        <GitCompare className="h-4 w-4 text-muted-foreground" />
        <div className="segmented-control">
          {([
            { key: "none" as CompareMode, label: "Sem comparação" },
            { key: "prev_month" as CompareMode, label: "Mês anterior" },
            { key: "prev_year" as CompareMode, label: "Ano anterior" },
          ]).map(opt => (
            <button key={opt.key} onClick={() => setCompareMode(opt.key)}
              className={`segmented-btn ${compareMode === opt.key ? 'active' : ''}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total KPI Card */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.15), rgba(10,132,255,0.05))', border: '1px solid rgba(10,132,255,0.2)' }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5" style={{ color: '#0A84FF' }} />
          <span className="text-sm font-medium text-muted-foreground">
            Faturamento Total — {MESES[currentMonth]}
            {vendedorParam && <span className="ml-1 text-[#0A84FF]">({vendedorParam})</span>}
          </span>
        </div>
          <div className="flex items-end justify-between mb-1">
          <div>
            <span className="text-3xl font-bold text-foreground">{formatCurrency(totalGeral)}</span>
            <div className="mt-0.5"><VariationBadge current={totalGeral} previous={prevTotalGeral} showLabel /></div>
          </div>
          <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${progressColor(pctTotal)}20`, color: progressColor(pctTotal) }}>
            {pctTotal.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-secondary">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pctTotal, 100)}%`, background: progressColor(pctTotal) }} />
          </div>
          <span className="text-xs text-muted-foreground">Meta: {formatCurrency(metaTotal)}</span>
        </div>
      </div>

      {/* Category KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(["produto", "servico", "contrato", "acessorio"] as Categoria[]).map((cat) => {
          const Icon = ICONS[cat];
          const val = totals[cat];
          const meta = currentMetas[cat];
          const pct = meta > 0 ? (val / meta) * 100 : 0;
          return (
            <div key={cat} className="glass-card p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: CAT_COLORS[cat] }} />
                  <span className="text-xs font-medium text-muted-foreground">{CATEGORIA_LABELS[cat]}</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${progressColor(pct)}20`, color: progressColor(pct) }}>
                  {pct.toFixed(0)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground mb-0.5">{formatCurrency(val)}</p>
              <VariationBadge current={val} previous={prevTotals[cat]} showLabel />
              <div className="h-1.5 rounded-full overflow-hidden bg-secondary">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pct, 100)}%`, background: CAT_COLORS[cat] }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Projection Section */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Projeção Mensal</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">
            {isCurrentMonth ? `Dia ${elapsed}/${totalDays}` : `${totalDays} dias`}
          </span>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.15)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Projeção Total</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: `${progressColor(pctTotalProj)}20`, color: progressColor(pctTotalProj) }}>
              {pctTotalProj.toFixed(0)}%
            </span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalProj)}</p>
        </div>
        <div className="space-y-2">
          {projections.map(p => (
            <div key={p.cat} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[p.cat] }} />
                <span className="text-xs text-foreground">{CATEGORIA_LABELS[p.cat]}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground">{formatCurrency(p.proj)}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${progressColor(p.pctProj)}20`, color: progressColor(p.pctProj) }}>
                  {p.pctProj.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Ranking */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color: '#FFD60A' }} />
            <h3 className="text-sm font-semibold text-foreground">Ranking de Clientes</h3>
          </div>
          <div className="segmented-control">
            <button onClick={() => setRankSort("valor")}
              className={`segmented-btn ${rankSort === "valor" ? "active" : ""}`}>
              Valor
            </button>
            <button onClick={() => setRankSort("count")}
              className={`segmented-btn ${rankSort === "count" ? "active" : ""}`}>
              Qtd
            </button>
          </div>
        </div>

        {clientRanking.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Nenhum lançamento neste período</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clientRanking.slice(0, 10).map((c, idx) => (
              <div key={c.cliente} className="flex items-center gap-3 p-3 rounded-xl transition hover:bg-muted bg-muted/50 border border-border">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: idx === 0 ? '#FFD60A20' : idx === 1 ? 'rgba(255,255,255,0.08)' : idx === 2 ? '#BF5AF220' : 'rgba(255,255,255,0.04)',
                    color: idx === 0 ? '#FFD60A' : idx === 1 ? '#AEAEB2' : idx === 2 ? '#BF5AF2' : '#8E8E93',
                  }}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.cliente}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      <Hash className="h-3 w-3 inline mr-0.5" />{c.count} lançamento{c.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground flex-shrink-0">{formatCurrency(c.valor)}</span>
              </div>
            ))}
            {clientRanking.length > 10 && (
              <p className="text-center text-[10px] pt-1 text-muted-foreground">
                +{clientRanking.length - 10} clientes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento Mensal — {currentYear}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 11 }} width={50} />
            <Tooltip
              contentStyle={{ background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 12 }}
              formatter={(value: number) => formatCurrency(value)}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="Produtos" fill="#0A84FF" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Serviços" fill="#30D158" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Contratos" fill="#FFD60A" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Acessórios" fill="#BF5AF2" radius={[6, 6, 0, 0]} />
            {compareMode === "prev_year" && (
              <>
                <Bar dataKey="Prod. Comp." fill="#0A84FF" radius={[6, 6, 0, 0]} opacity={0.3} />
                <Bar dataKey="Serv. Comp." fill="#30D158" radius={[6, 6, 0, 0]} opacity={0.3} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {(["produto", "servico", "contrato", "acessorio"] as Categoria[]).map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[cat] }} />
              <span className="text-[11px] text-muted-foreground">{CATEGORIA_LABELS[cat]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
