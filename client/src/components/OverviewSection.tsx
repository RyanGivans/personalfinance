/**
 * OverviewSection — Blueprint Financial Dashboard
 * Reads actual tracker data from localStorage and shows live vs-plan status.
 * Features: on-track indicator, variance alerts, biggest overspend,
 *           streak counter, revised projection, tracker summary panel.
 */

import {
  ALL_MONTHS,
  ACTUAL_STORAGE_KEY,
  CAT_COLORS,
  EXPENSE_CATS,
  STARTING_SAVINGS,
  YEAR_DATA,
  formatCurrency,
  type ExpenseCat,
} from "@/lib/financialData";
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────
function numVal(v: number | "" | undefined): number {
  return !v && v !== 0 ? 0 : Number(v);
}
function loadActuals() {
  try {
    const s = localStorage.getItem(ACTUAL_STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}
type MonthKey = string;
function makeKey(year: number, mi: number): MonthKey {
  return `${year}-${mi}`;
}

// ── static plan data ──────────────────────────────────────────────────────────
const planTrajectory = ALL_MONTHS.map((m) => ({
  label: `${m.month.slice(0, 3)} '${String(m.year).slice(2)}`,
  plan: Math.round(m.savingsBalance),
  school: m.ravenInSchool,
}));

const annualData = YEAR_DATA.map((y) => ({
  year: y.year.toString(),
  income: Math.round(y.totalIncome),
  expenses: Math.round(y.totalExpenses),
  net: Math.round(y.netSavings),
  endSavings: Math.round(y.endSavings),
  school: y.ravenInSchool,
}));

const planFinalBalance = YEAR_DATA[YEAR_DATA.length - 1].endSavings;
const totalPlanIncome = YEAR_DATA.reduce((s, y) => s + y.totalIncome, 0);
const totalPlanExpenses = YEAR_DATA.reduce((s, y) => s + y.totalExpenses, 0);

// ── tooltip ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon, delay = 0 }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode; delay?: number;
}) {
  return (
    <div className="stat-card animate-count" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold number-display" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function OverviewSection() {
  // Read actuals from localStorage on every render
  const actuals = useMemo(() => loadActuals(), []);

  // ── compute actual stats ──────────────────────────────────────────────────
  const actualStats = useMemo(() => {
    let balance = STARTING_SAVINGS;
    let monthsEntered = 0;
    let totalActualInc = 0;
    let totalActualExp = 0;
    let streak = 0; // consecutive months under budget
    let currentStreak = 0;
    const catOverspend: Record<string, number> = {};
    const trajectory: { label: string; plan: number; actual: number | null }[] = [];
    let lastActualBal: number | null = null;

    for (const md of ALL_MONTHS) {
      const key = makeKey(md.year, md.monthIndex);
      const actual = actuals[key];

      // plan balance (always computed)
      const planBal = md.savingsBalance;

      if (actual) {
        // starting override
        if (actual.startingSavingsOverride !== "" && actual.startingSavingsOverride !== undefined) {
          balance = Number(actual.startingSavingsOverride);
        }

        const inc =
          numVal(actual.ryanNet) +
          numVal(actual.ravenNet) +
          numVal(actual.bizIncome) +
          numVal(actual.expectedIncome);
        const exp = EXPENSE_CATS.reduce((s: number, c: ExpenseCat) => {
          const v = actual.expenses?.[c];
          return s + (v === undefined || v === "" ? md.expenses[c] : Number(v));
        }, 0);

        // ending override
        if (actual.endingSavingsOverride !== "" && actual.endingSavingsOverride !== undefined) {
          balance = Number(actual.endingSavingsOverride);
        } else {
          balance += inc - exp;
        }

        totalActualInc += inc;
        totalActualExp += exp;
        monthsEntered++;
        lastActualBal = balance;

        // streak
        if (inc - exp >= md.netMonthly) {
          currentStreak++;
          streak = Math.max(streak, currentStreak);
        } else {
          currentStreak = 0;
        }

        // per-category overspend
        for (const cat of EXPENSE_CATS) {
          const v = actual.expenses?.[cat];
          const actualCat = v === undefined || v === "" ? md.expenses[cat] : Number(v);
          const diff = actualCat - md.expenses[cat];
          if (diff > 0) catOverspend[cat] = (catOverspend[cat] || 0) + diff;
        }

        trajectory.push({ label: `${md.month.slice(0, 3)} '${String(md.year).slice(2)}`, plan: planBal, actual: Math.round(balance) });
      } else {
        trajectory.push({ label: `${md.month.slice(0, 3)} '${String(md.year).slice(2)}`, plan: planBal, actual: null });
      }
    }

    // On-track status
    const planBalAtLastEntry = (() => {
      if (!monthsEntered) return STARTING_SAVINGS;
      let pb = STARTING_SAVINGS;
      let count = 0;
      for (const md of ALL_MONTHS) {
        const key = makeKey(md.year, md.monthIndex);
        if (actuals[key]) {
          pb = md.savingsBalance;
          count++;
          if (count === monthsEntered) break;
        }
      }
      return pb;
    })();

    const balanceDiff = lastActualBal !== null ? lastActualBal - planBalAtLastEntry : 0;
    const pctDiff = planBalAtLastEntry > 0 ? (balanceDiff / planBalAtLastEntry) * 100 : 0;
    const onTrackStatus: "ahead" | "on-track" | "behind" =
      pctDiff > 5 ? "ahead" : pctDiff < -5 ? "behind" : "on-track";

    // Biggest overspend category
    const biggestOverspend = Object.entries(catOverspend).sort((a, b) => b[1] - a[1])[0] || null;

    // Variance alerts (categories > 10% over plan in any entered month)
    const alerts: { cat: string; pct: number }[] = [];
    for (const md of ALL_MONTHS) {
      const key = makeKey(md.year, md.monthIndex);
      const actual = actuals[key];
      if (!actual) continue;
      for (const cat of EXPENSE_CATS) {
        const v = actual.expenses?.[cat];
        const actualCat = v === undefined || v === "" ? md.expenses[cat] : Number(v);
        const plan = md.expenses[cat];
        if (plan > 0) {
          const pct = ((actualCat - plan) / plan) * 100;
          if (pct > 10) {
            const existing = alerts.find((a) => a.cat === cat);
            if (existing) { existing.pct = Math.max(existing.pct, pct); }
            else alerts.push({ cat, pct });
          }
        }
      }
    }
    alerts.sort((a, b) => b.pct - a.pct);

    // Revised projected end balance
    const revisedFinalBalance = (() => {
      if (!monthsEntered || lastActualBal === null) return planFinalBalance;
      // Find remaining months after last entered month
      let foundLast = false;
      let remaining = 0;
      let remainingNet = 0;
      let enteredCount = 0;
      for (const md of ALL_MONTHS) {
        const key = makeKey(md.year, md.monthIndex);
        if (actuals[key]) enteredCount++;
        if (enteredCount === monthsEntered && !foundLast) foundLast = true;
        if (foundLast && !actuals[key]) {
          remaining++;
          remainingNet += md.netMonthly;
        }
      }
      return lastActualBal + remainingNet;
    })();

    return {
      monthsEntered,
      totalActualInc,
      totalActualExp,
      lastActualBal,
      onTrackStatus,
      balanceDiff,
      streak: currentStreak, // current streak (not max)
      biggestOverspend,
      alerts: alerts.slice(0, 3),
      trajectory,
      revisedFinalBalance,
      planBalAtLastEntry,
    };
  }, [actuals]);

  const hasActuals = actualStats.monthsEntered > 0;

  const statusConfig = {
    ahead: { color: "#2a9d8f", bg: "#2a9d8f18", icon: <CheckCircle2 size={15} />, text: "Ahead of Plan" },
    "on-track": { color: "#5b5ea6", bg: "#5b5ea618", icon: <CheckCircle2 size={15} />, text: "On Track" },
    behind: { color: "#e76f51", bg: "#e76f5118", icon: <XCircle size={15} />, text: "Behind Plan" },
  }[actualStats.onTrackStatus];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.15 0.01 240)" }}>
          5-Year Financial Overview
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          July 2026 – December 2031 · Starting savings: {formatCurrency(STARTING_SAVINGS)}
        </p>
      </div>

      {/* School notice */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm"
        style={{ background: "var(--school-light)", borderColor: "oklch(0.88 0.08 65)", color: "oklch(0.45 0.12 65)" }}>
        <GraduationCap size={16} />
        <span>
          <strong>Note:</strong> Raven is in school from January 2028 through December 2031 (LPN 2028–2029, RN 2030–2031). Her income is $0 during this period.
        </span>
      </div>

      {/* ── Live Tracker Status Panel (only when actuals exist) ── */}
      {hasActuals && (
        <div className="rounded-xl border p-5 space-y-4"
          style={{ background: "oklch(0.985 0.003 265)", borderColor: "oklch(0.88 0.01 265)" }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>
              Actual Tracker Status
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: statusConfig.bg, color: statusConfig.color }}>
              {statusConfig.icon}
              <span>{statusConfig.text}</span>
              {actualStats.balanceDiff !== 0 && (
                <span className="font-normal text-xs ml-1">
                  ({actualStats.balanceDiff >= 0 ? "+" : ""}{formatCurrency(actualStats.balanceDiff)} vs plan)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-xl font-bold number-display" style={{ color: "#5b5ea6" }}>
                {formatCurrency(actualStats.lastActualBal!)}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                Plan at this point: {formatCurrency(actualStats.planBalAtLastEntry)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revised End Balance</p>
              <p className="text-xl font-bold number-display" style={{ color: actualStats.revisedFinalBalance >= planFinalBalance ? "#2a9d8f" : "#e76f51" }}>
                {formatCurrency(actualStats.revisedFinalBalance)}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                Plan: {formatCurrency(planFinalBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Months Tracked</p>
              <p className="text-xl font-bold number-display" style={{ color: "#5b5ea6" }}>
                {actualStats.monthsEntered}
                <span className="text-sm font-normal ml-1" style={{ color: "oklch(0.55 0.005 240)" }}>
                  / {ALL_MONTHS.length}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <div className="flex items-center gap-1.5">
                <Zap size={16} style={{ color: "#F59E0B" }} />
                <p className="text-xl font-bold number-display" style={{ color: "#F59E0B" }}>
                  {actualStats.streak}
                </p>
                <span className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>mo under budget</span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {actualStats.alerts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#e76f51" }}>
                <AlertTriangle size={11} className="inline mr-1" />
                Overspend Alerts (&gt;10% over plan)
              </p>
              <div className="flex flex-wrap gap-2">
                {actualStats.alerts.map(({ cat, pct }) => (
                  <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "#e76f5115", color: "#e76f51", border: "1px solid #e76f5130" }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[cat as ExpenseCat] || "#e76f51" }} />
                    {cat}: +{pct.toFixed(0)}% over
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biggest overspend */}
          {actualStats.biggestOverspend && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
              style={{ background: "#e76f5110", border: "1px solid #e76f5120" }}>
              <TrendingDown size={14} style={{ color: "#e76f51" }} />
              <span style={{ color: "#e76f51" }}>
                <strong>Biggest overspend:</strong> {actualStats.biggestOverspend[0]} — {formatCurrency(actualStats.biggestOverspend[1])} over plan total
              </span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={hasActuals ? "Revised End Balance" : "Projected End Balance"}
          value={formatCurrency(hasActuals ? actualStats.revisedFinalBalance : planFinalBalance)}
          sub={hasActuals ? `Plan: ${formatCurrency(planFinalBalance)}` : "Dec 2031"}
          color="var(--savings)"
          icon={<Wallet size={18} />}
          delay={0}
        />
        <KpiCard
          label="Total Income (5.5 yr)"
          value={formatCurrency(hasActuals ? actualStats.totalActualInc : totalPlanIncome, true)}
          sub={hasActuals ? `Plan: ${formatCurrency(totalPlanIncome, true)}` : "Ryan + Raven + Business"}
          color="var(--income)"
          icon={<TrendingUp size={18} />}
          delay={80}
        />
        <KpiCard
          label="Total Expenses (5.5 yr)"
          value={formatCurrency(hasActuals ? actualStats.totalActualExp : totalPlanExpenses, true)}
          sub={hasActuals ? `Plan: ${formatCurrency(totalPlanExpenses, true)}` : "All categories"}
          color="var(--expense)"
          icon={<TrendingDown size={18} />}
          delay={160}
        />
        <KpiCard
          label="Net Saved"
          value={formatCurrency(hasActuals ? actualStats.totalActualInc - actualStats.totalActualExp : totalPlanIncome - totalPlanExpenses, true)}
          sub={hasActuals
            ? `${actualStats.monthsEntered} months actual`
            : `${(((totalPlanIncome - totalPlanExpenses) / totalPlanIncome) * 100).toFixed(1)}% savings rate`}
          color="var(--income)"
          icon={<TrendingUp size={18} />}
          delay={240}
        />
      </div>

      {/* Savings Trajectory Chart — plan + actual overlay */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Savings Balance Over Time
        </h3>
        <p className="text-xs text-muted-foreground mb-5">
          {hasActuals
            ? "Dashed = plan · Solid = actual balance from entered months"
            : "Month-by-month cumulative savings. Amber shading = Raven in school."}
        </p>
        <div className="animate-chart" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hasActuals ? actualStats.trajectory : planTrajectory}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="planGradOv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5b5ea6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5b5ea6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="actualGradOv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, true)} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="plan" name="Plan" stroke="#5b5ea6" strokeWidth={hasActuals ? 1.5 : 2} strokeDasharray={hasActuals ? "5 3" : undefined} fill={hasActuals ? "url(#planGradOv)" : "url(#planGradOv)"} dot={false} />
              {hasActuals && (
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#2a9d8f" strokeWidth={2.5} fill="url(#actualGradOv)" dot={false} connectNulls={false} />
              )}
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Annual Income vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Annual Income vs. Expenses</h3>
          <p className="text-xs text-muted-foreground mb-5">Grouped by year. School years shown with amber border.</p>
          <div className="animate-chart" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, true)} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(val) => <span style={{ color: "oklch(0.4 0.01 240)" }}>{val}</span>} />
                <Bar dataKey="income" name="Income" fill="var(--income)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--expense)" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Net Savings Added Per Year</h3>
          <p className="text-xs text-muted-foreground mb-5">How much is added to savings each year after all expenses.</p>
          <div className="animate-chart" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, true)} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name="Net Savings" radius={[3, 3, 0, 0]} maxBarSize={40}>
                  {annualData.map((entry, index) => (
                    <Cell key={index} fill={entry.net >= 0 ? (entry.school ? "var(--school)" : "var(--income)") : "var(--expense)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Annual Summary Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Annual Summary Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "oklch(0.97 0.003 240)" }}>
                {["Year", "Months", "Ryan Net", "Raven Net", "Business", "Total Income", "Total Expenses", "Net Saved", "End Balance"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: "oklch(0.45 0.01 240)", borderBottom: "1px solid oklch(0.91 0.005 240)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YEAR_DATA.map((y, i) => (
                <tr key={y.year} className="data-row"
                  style={{ background: y.ravenInSchool ? "var(--school-light)" : i % 2 === 0 ? "white" : "oklch(0.985 0.002 240)", borderBottom: "1px solid oklch(0.93 0.004 240)" }}>
                  <td className="px-4 py-3 font-semibold number-display" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>
                    {y.year}
                    {y.ravenInSchool && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--school)", color: "white" }}>School</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{y.numMonths}</td>
                  <td className="px-4 py-3 number-display positive">{formatCurrency(y.ryanAnnualNet)}</td>
                  <td className="px-4 py-3 number-display" style={{ color: y.ravenInSchool ? "oklch(0.6 0.1 65)" : "var(--income)" }}>
                    {y.ravenInSchool ? "—" : formatCurrency(y.ravenAnnualNet)}
                  </td>
                  <td className="px-4 py-3 number-display" style={{ color: "oklch(0.45 0.12 220)" }}>{formatCurrency(y.bizAnnualNet)}</td>
                  <td className="px-4 py-3 font-semibold number-display positive">{formatCurrency(y.totalIncome)}</td>
                  <td className="px-4 py-3 font-semibold number-display negative">{formatCurrency(y.totalExpenses)}</td>
                  <td className="px-4 py-3 font-bold number-display" style={{ color: y.netSavings >= 0 ? "var(--income)" : "var(--expense)" }}>
                    {y.netSavings >= 0 ? "+" : ""}{formatCurrency(y.netSavings)}
                  </td>
                  <td className="px-4 py-3 font-bold number-display" style={{ color: "var(--savings)" }}>{formatCurrency(y.endSavings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
