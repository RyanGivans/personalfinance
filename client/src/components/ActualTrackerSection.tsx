/**
 * ActualTrackerSection — Blueprint Financial Dashboard
 * Month-by-month actual income + expense entry vs. plan
 * Features: auto-save to localStorage, export/import JSON, monthly infographics
 */

import {
  ALL_MONTHS,
  EXPENSE_CATS,
  YEAR_DATA,
  formatCurrency,
  type ExpenseCat,
} from "@/lib/financialData";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STORAGE_KEY = "rr_actual_tracker_v1";
type MonthKey = string; // "2026-6"

interface MonthActual {
  ryanNet: number | "";
  ravenNet: number | "";
  bizIncome: number | "";
  expenses: Partial<Record<ExpenseCat, number | "">>;
}
type ActualData = Record<MonthKey, MonthActual>;

function makeKey(year: number, monthIndex: number): MonthKey {
  return `${year}-${monthIndex}`;
}
function emptyMonth(): MonthActual {
  return { ryanNet: "", ravenNet: "", bizIncome: "", expenses: {} };
}
function fillFromPlan(year: number, monthIndex: number): MonthActual {
  const yd = YEAR_DATA.find((y) => y.year === year)!;
  const md = yd.months.find((m) => m.monthIndex === monthIndex)!;
  const expenses: Partial<Record<ExpenseCat, number>> = {};
  for (const cat of EXPENSE_CATS) expenses[cat] = md.expenses[cat];
  return {
    ryanNet: Math.round(md.ryanNet),
    ravenNet: Math.round(md.ravenNet),
    bizIncome: Math.round(md.bizIncome),
    expenses,
  };
}
function numVal(v: number | "" | undefined): number {
  return !v && v !== 0 ? 0 : Number(v);
}

const teal = "oklch(0.55 0.12 195)";
const rose = "oklch(0.58 0.18 15)";
const indigo = "oklch(0.5 0.18 265)";
const amber = "oklch(0.72 0.15 65)";

// CSS color hex equivalents for recharts (which doesn't support oklch)
const TEAL_HEX = "#2a9d8f";
const ROSE_HEX = "#e76f51";
const INDIGO_HEX = "#5b5ea6";
const AMBER_HEX = "#e9c46a";

const PIE_COLORS = [
  "#2a9d8f", "#e76f51", "#5b5ea6", "#e9c46a", "#264653",
  "#f4a261", "#a8dadc", "#457b9d", "#1d3557", "#e63946",
];

export default function ActualTrackerSection() {
  const [actuals, setActuals] = useState<ActualData>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });
  const [expandedKey, setExpandedKey] = useState<MonthKey | null>(null);
  const [activeYear, setActiveYear] = useState(2026);
  const importRef = useRef<HTMLInputElement>(null);

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actuals));
    } catch {}
  }, [actuals]);

  const setField = (key: MonthKey, field: keyof Omit<MonthActual, "expenses">, value: string) => {
    setActuals((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || emptyMonth()), [field]: value === "" ? "" : Number(value) },
    }));
  };
  const setExpense = (key: MonthKey, cat: ExpenseCat, value: string) => {
    setActuals((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || emptyMonth()),
        expenses: { ...(prev[key]?.expenses || {}), [cat]: value === "" ? "" : Number(value) },
      },
    }));
  };
  const fillPlan = (year: number, mi: number) =>
    setActuals((prev) => ({ ...prev, [makeKey(year, mi)]: fillFromPlan(year, mi) }));
  const clearMonth = (year: number, mi: number) =>
    setActuals((prev) => {
      const n = { ...prev };
      delete n[makeKey(year, mi)];
      return n;
    });

  // Export
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(actuals, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ryan-raven-actuals-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setActuals(parsed);
      } catch {
        alert("Invalid file — please select a valid actuals JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Savings trajectory
  const trajectoryData = useMemo(() => {
    const data: { label: string; plan: number; actual: number | null }[] = [];
    let planBal = YEAR_DATA[0].startSavings;
    let actualBal = YEAR_DATA[0].startSavings;
    let hasActual = true;
    for (const md of ALL_MONTHS) {
      const key = makeKey(md.year, md.monthIndex);
      const actual = actuals[key];
      planBal += md.netMonthly;
      if (hasActual && actual) {
        const totalInc = numVal(actual.ryanNet) + numVal(actual.ravenNet) + numVal(actual.bizIncome);
        const totalExp = EXPENSE_CATS.reduce((s, c) => {
          const v = actual.expenses[c];
          return s + (v === undefined || v === "" ? md.expenses[c] : Number(v));
        }, 0);
        actualBal += totalInc - totalExp;
        data.push({
          label: `${md.month.slice(0, 3)} '${String(md.year).slice(2)}`,
          plan: Math.round(planBal),
          actual: Math.round(actualBal),
        });
      } else {
        hasActual = false;
        data.push({
          label: `${md.month.slice(0, 3)} '${String(md.year).slice(2)}`,
          plan: Math.round(planBal),
          actual: null,
        });
      }
    }
    return data;
  }, [actuals]);

  const yearData = YEAR_DATA.find((y) => y.year === activeYear)!;
  const enteredCounts = useMemo(() => {
    const c: Record<number, number> = {};
    for (const yd of YEAR_DATA)
      c[yd.year] = yd.months.filter((m) => !!actuals[makeKey(m.year, m.monthIndex)]).length;
    return c;
  }, [actuals]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ClipboardList size={22} style={{ color: indigo }} />
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.01 240)" }}
            >
              Actual Tracker
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter real monthly income and expenses to compare against your plan. Saves automatically in your browser.
          </p>
        </div>

        {/* Export / Import */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors"
            style={{ borderColor: indigo, color: indigo, background: "white" }}
            title="Download your actual data as a JSON file — use this to back up or transfer to another device"
          >
            <Download size={13} /> Export Data
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-colors"
            style={{ borderColor: "oklch(0.75 0.005 240)", color: "oklch(0.45 0.005 240)", background: "white" }}
            title="Load a previously exported JSON file to restore your data on this device"
          >
            <Upload size={13} /> Import Data
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Year tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {YEAR_DATA.map((yd) => {
          const count = enteredCounts[yd.year] || 0;
          const isActive = activeYear === yd.year;
          return (
            <button
              key={yd.year}
              onClick={() => setActiveYear(yd.year)}
              className="flex flex-col items-center px-4 py-2 rounded-lg border transition-all duration-150"
              style={{
                background: isActive ? indigo : "white",
                borderColor: isActive ? indigo : "oklch(0.88 0.005 240)",
                color: isActive ? "white" : "oklch(0.35 0.01 240)",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                minWidth: 72,
              }}
            >
              <span className="text-sm font-semibold">{yd.year}</span>
              <span
                className="text-xs mt-0.5"
                style={{ color: isActive ? "rgba(255,255,255,0.75)" : "oklch(0.55 0.005 240)" }}
              >
                {count}/{yd.numMonths} mo
              </span>
              {count > 0 && (
                <div
                  className="w-full h-1 rounded-full mt-1"
                  style={{ background: isActive ? "rgba(255,255,255,0.3)" : "oklch(0.93 0.005 240)" }}
                >
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${(count / yd.numMonths) * 100}%`,
                      background: isActive ? "white" : TEAL_HEX,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Month rows */}
      <div className="space-y-2 mb-8">
        {yearData.months.map((md) => {
          const key = makeKey(md.year, md.monthIndex);
          const actual = actuals[key];
          const isOpen = expandedKey === key;
          const hasData = !!actual;
          const actualTotalInc = actual
            ? numVal(actual.ryanNet) + numVal(actual.ravenNet) + numVal(actual.bizIncome)
            : null;
          const actualTotalExp = actual
            ? EXPENSE_CATS.reduce((s, c) => {
                const v = actual.expenses[c];
                return s + (v === undefined || v === "" ? md.expenses[c] : Number(v));
              }, 0)
            : null;
          const actualNet =
            actualTotalInc !== null && actualTotalExp !== null
              ? actualTotalInc - actualTotalExp
              : null;
          const netDiff = actualNet !== null ? actualNet - md.netMonthly : null;

          // Infographic data for this month
          const expensePieData = EXPENSE_CATS.map((cat) => {
            const val = actual?.expenses[cat];
            const v = val === undefined || val === "" ? md.expenses[cat] : Number(val);
            return { name: cat, value: v };
          }).filter((d) => d.value > 0);

          const incomeBarData = [
            {
              name: "Ryan",
              actual: actual ? numVal(actual.ryanNet) : 0,
              plan: Math.round(md.ryanNet),
            },
            {
              name: "Raven",
              actual: actual ? numVal(actual.ravenNet) : 0,
              plan: Math.round(md.ravenNet),
            },
            {
              name: "Business",
              actual: actual ? numVal(actual.bizIncome) : 0,
              plan: Math.round(md.bizIncome),
            },
          ];

          return (
            <div
              key={key}
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: isOpen ? indigo : hasData ? "oklch(0.88 0.005 240)" : "oklch(0.92 0.003 240)",
                background: "white",
                boxShadow: isOpen ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <button
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                onClick={() => setExpandedKey(isOpen ? null : key)}
              >
                <div className="w-24 flex-shrink-0">
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.25 0.01 240)" }}
                  >
                    {md.month}
                  </span>
                </div>
                {hasData ? (
                  <div className="flex gap-6 flex-1 flex-wrap">
                    <div>
                      <span className="text-xs text-muted-foreground block">Income</span>
                      <span className="text-sm font-semibold number-display" style={{ color: teal }}>
                        {formatCurrency(actualTotalInc!)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Expenses</span>
                      <span className="text-sm font-semibold number-display" style={{ color: rose }}>
                        {formatCurrency(actualTotalExp!)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Net vs Plan</span>
                      <span
                        className="text-sm font-semibold number-display"
                        style={{ color: netDiff! >= 0 ? teal : rose }}
                      >
                        {netDiff! >= 0 ? "+" : ""}
                        {formatCurrency(netDiff!)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground flex-1">
                    No data — click to add actuals
                  </span>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasData && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "oklch(0.94 0.06 150)", color: "oklch(0.35 0.1 150)" }}
                    >
                      Entered
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp size={16} style={{ color: "oklch(0.55 0.005 240)" }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: "oklch(0.55 0.005 240)" }} />
                  )}
                </div>
              </button>

              {isOpen && (
                <div
                  className="border-t px-5 py-5"
                  style={{ borderColor: "oklch(0.92 0.005 240)", background: "oklch(0.985 0.002 240)" }}
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Income inputs */}
                    <div>
                      <h4
                        className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: teal }}
                      >
                        Income (Net / Take-Home)
                      </h4>
                      <div className="space-y-3">
                        {(
                          [
                            { field: "ryanNet" as const, label: "Ryan Net Pay", plan: md.ryanNet },
                            {
                              field: "ravenNet" as const,
                              label: "Raven Net Pay",
                              plan: md.ravenNet,
                              note: md.ravenInSchool ? "School year — enter any side income" : undefined,
                            },
                            { field: "bizIncome" as const, label: "Business Income", plan: md.bizIncome },
                          ] as const
                        ).map(({ field, label, plan, note }) => {
                          const val = actual?.[field] ?? "";
                          const numActual = val === "" ? null : Number(val);
                          const diff = numActual !== null ? numActual - plan : null;
                          return (
                            <div key={field}>
                              <div className="flex justify-between items-center mb-1">
                                <label
                                  className="text-xs font-medium"
                                  style={{ color: "oklch(0.35 0.01 240)" }}
                                >
                                  {label}
                                  {note && (
                                    <span className="ml-1 font-normal" style={{ color: amber }}>
                                      {" "}
                                      ({note})
                                    </span>
                                  )}
                                </label>
                                <span className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                                  Plan: {formatCurrency(plan)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <span
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                                    style={{ color: "oklch(0.55 0.005 240)" }}
                                  >
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    value={val}
                                    onChange={(e) => setField(key, field, e.target.value)}
                                    placeholder={String(Math.round(plan))}
                                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border outline-none"
                                    style={{
                                      borderColor:
                                        numActual !== null
                                          ? diff! >= 0
                                            ? "oklch(0.7 0.1 150)"
                                            : "oklch(0.7 0.15 15)"
                                          : "oklch(0.88 0.005 240)",
                                      background: "white",
                                    }}
                                  />
                                </div>
                                {diff !== null && (
                                  <span
                                    className="text-xs font-semibold w-16 text-right number-display"
                                    style={{ color: diff >= 0 ? teal : rose }}
                                  >
                                    {diff >= 0 ? "+" : ""}
                                    {formatCurrency(diff)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expense inputs */}
                    <div>
                      <h4
                        className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: rose }}
                      >
                        Expenses
                      </h4>
                      <div className="space-y-2">
                        {EXPENSE_CATS.map((cat) => {
                          const plan = md.expenses[cat];
                          const val = actual?.expenses[cat] ?? "";
                          const numActual = val === "" ? null : Number(val);
                          const diff = numActual !== null ? numActual - plan : null;
                          return (
                            <div key={cat} className="flex items-center gap-2">
                              <label
                                className="text-xs w-20 flex-shrink-0"
                                style={{ color: "oklch(0.45 0.01 240)" }}
                              >
                                {cat}
                              </label>
                              <div className="relative flex-1">
                                <span
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs"
                                  style={{ color: "oklch(0.55 0.005 240)" }}
                                >
                                  $
                                </span>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={(e) => setExpense(key, cat, e.target.value)}
                                  placeholder={String(plan)}
                                  className="w-full pl-6 pr-2 py-1.5 rounded-lg border outline-none"
                                  style={{
                                    fontSize: 12,
                                    borderColor:
                                      numActual !== null
                                        ? diff! <= 0
                                          ? "oklch(0.7 0.1 150)"
                                          : "oklch(0.7 0.15 15)"
                                        : "oklch(0.88 0.005 240)",
                                    background: "white",
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs w-14 text-right number-display flex-shrink-0"
                                style={{ color: "oklch(0.55 0.005 240)" }}
                              >
                                {formatCurrency(plan)}
                              </span>
                              {diff !== null && (
                                <span
                                  className="text-xs w-14 text-right number-display flex-shrink-0"
                                  style={{ color: diff <= 0 ? teal : rose }}
                                >
                                  {diff > 0 ? "+" : ""}
                                  {formatCurrency(diff)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Monthly summary strip */}
                  {actual && (
                    <div
                      className="mt-5 p-4 rounded-xl flex flex-wrap gap-6"
                      style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">Actual Income</p>
                        <p className="text-base font-bold number-display" style={{ color: teal }}>
                          {formatCurrency(actualTotalInc!)}
                        </p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                          Plan: {formatCurrency(md.totalIncome)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Actual Expenses</p>
                        <p className="text-base font-bold number-display" style={{ color: rose }}>
                          {formatCurrency(actualTotalExp!)}
                        </p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                          Plan: {formatCurrency(md.totalExpenses)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net This Month</p>
                        <p
                          className="text-base font-bold number-display"
                          style={{ color: actualNet! >= 0 ? teal : rose }}
                        >
                          {formatCurrency(actualNet!)}
                        </p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                          Plan: {formatCurrency(md.netMonthly)}
                        </p>
                      </div>
                      {netDiff !== null && (
                        <div>
                          <p className="text-xs text-muted-foreground">vs. Plan</p>
                          <p
                            className="text-base font-bold number-display"
                            style={{ color: netDiff >= 0 ? teal : rose }}
                          >
                            {netDiff >= 0 ? "+" : ""}
                            {formatCurrency(netDiff)}
                          </p>
                          <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                            {netDiff >= 0 ? "Ahead" : "Behind"} of plan
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Monthly Infographics */}
                  {actual && (
                    <div className="mt-5 grid md:grid-cols-2 gap-4">
                      {/* Expense Donut */}
                      <div
                        className="rounded-xl p-4"
                        style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: "oklch(0.45 0.005 240)" }}
                        >
                          Expense Breakdown
                        </p>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={expensePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {expensePieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v: number) => [formatCurrency(v)]}
                              contentStyle={{ fontSize: 11, borderRadius: 8 }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: 10 }}
                              iconSize={8}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Income Actual vs Plan bar */}
                      <div
                        className="rounded-xl p-4"
                        style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: "oklch(0.45 0.005 240)" }}
                        >
                          Income: Actual vs. Plan
                        </p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={incomeBarData}
                            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                            barCategoryGap="30%"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis
                              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip
                              formatter={(v: number) => [formatCurrency(v)]}
                              contentStyle={{ fontSize: 11, borderRadius: 8 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="plan" name="Plan" fill={INDIGO_HEX} opacity={0.5} radius={[3, 3, 0, 0]} />
                            <Bar dataKey="actual" name="Actual" fill={TEAL_HEX} radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Savings gauge */}
                      <div
                        className="md:col-span-2 rounded-xl p-4"
                        style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-3"
                          style={{ color: "oklch(0.45 0.005 240)" }}
                        >
                          Expenses: Actual vs. Plan by Category
                        </p>
                        <div className="space-y-2">
                          {EXPENSE_CATS.map((cat, i) => {
                            const plan = md.expenses[cat];
                            if (plan === 0) return null;
                            const val = actual?.expenses[cat];
                            const actualV = val === undefined || val === "" ? plan : Number(val);
                            const pct = plan > 0 ? (actualV / plan) * 100 : 0;
                            const over = actualV > plan;
                            return (
                              <div key={cat}>
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span style={{ color: "oklch(0.4 0.01 240)" }}>{cat}</span>
                                  <span style={{ color: over ? rose : teal }}>
                                    {formatCurrency(actualV)} / {formatCurrency(plan)}
                                    {over ? " ▲" : " ✓"}
                                  </span>
                                </div>
                                <div
                                  className="h-1.5 rounded-full overflow-hidden"
                                  style={{ background: "oklch(0.93 0.003 240)" }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(pct, 100)}%`,
                                      background: over ? ROSE_HEX : PIE_COLORS[i % PIE_COLORS.length],
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => fillPlan(md.year, md.monthIndex)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
                      style={{ borderColor: indigo, color: indigo, background: "white" }}
                    >
                      <Save size={12} /> Fill from plan
                    </button>
                    {hasData && (
                      <button
                        onClick={() => clearMonth(md.year, md.monthIndex)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
                        style={{
                          borderColor: "oklch(0.75 0.005 240)",
                          color: "oklch(0.5 0.005 240)",
                          background: "white",
                        }}
                      >
                        <RotateCcw size={12} /> Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Savings trajectory */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "white",
          border: "1px solid oklch(0.9 0.005 240)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h3
          className="text-base font-semibold mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}
        >
          Savings Balance: Actual vs. Plan
        </h3>
        <p className="text-xs text-muted-foreground mb-5">
          Solid teal = actual (entered months). Dashed indigo = plan.
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trajectoryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="planGradAT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={INDIGO_HEX} stopOpacity={0.12} />
                <stop offset="95%" stopColor={INDIGO_HEX} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="actualGradAT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TEAL_HEX} stopOpacity={0.18} />
                <stop offset="95%" stopColor={TEAL_HEX} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              interval={5}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              tick={{ fontSize: 10, fill: "#888" }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "plan" ? "Plan Balance" : "Actual Balance",
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="plan"
              stroke={INDIGO_HEX}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="url(#planGradAT)"
              name="Plan"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke={TEAL_HEX}
              strokeWidth={2}
              fill="url(#actualGradAT)"
              name="Actual"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
