/**
 * ActualTrackerSection — Blueprint Financial Dashboard
 * Full-featured month-by-month actual tracker
 * Features: adjustable starting savings, expected income, notes, running balance,
 *           year progress, export/import, monthly infographics, auto-save
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
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  FileText,
  RotateCcw,
  StickyNote,
  Upload,
  Wallet,
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

// Use ACTUAL_STORAGE_KEY from financialData for consistency with OverviewSection
type MonthKey = string; // "2026-6"

interface MonthActual {
  ryanNet: number | "";
  ravenNet: number | "";
  bizIncome: number | "";
  expectedIncome: number | ""; // money you know is coming in
  startingSavingsOverride: number | ""; // manual override for starting balance
  endingSavingsOverride: number | ""; // manual override for ending balance
  expenses: Partial<Record<ExpenseCat, number | "">>;
  notes: string;
}

type ActualData = Record<MonthKey, MonthActual>;

function makeKey(year: number, monthIndex: number): MonthKey {
  return `${year}-${monthIndex}`;
}
function emptyMonth(): MonthActual {
  return {
    ryanNet: "",
    ravenNet: "",
    bizIncome: "",
    expectedIncome: "",
    startingSavingsOverride: "",
    endingSavingsOverride: "",
    expenses: {},
    notes: "",
  };
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
    expectedIncome: "",
    startingSavingsOverride: "",
    endingSavingsOverride: "",
    expenses,
    notes: "",
  };
}
function numVal(v: number | "" | undefined): number {
  return !v && v !== 0 ? 0 : Number(v);
}

const teal = "oklch(0.55 0.12 195)";
const rose = "oklch(0.58 0.18 15)";
const indigo = "oklch(0.5 0.18 265)";
const amber = "oklch(0.72 0.15 65)";
const TEAL_HEX = "#2a9d8f";
const ROSE_HEX = "#e76f51";
const INDIGO_HEX = "#5b5ea6";

// Actual data storage uses ACTUAL_STORAGE_KEY from financialData

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ActualTrackerSection() {
  const [actuals, setActuals] = useState<ActualData>(() => {
    try {
      const s = localStorage.getItem(ACTUAL_STORAGE_KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });
  const [expandedKey, setExpandedKey] = useState<MonthKey | null>(null);
  const [activeYear, setActiveYear] = useState(2026);
  const [showNotes, setShowNotes] = useState<Record<MonthKey, boolean>>({});
  const importRef = useRef<HTMLInputElement>(null);

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem(ACTUAL_STORAGE_KEY, JSON.stringify(actuals));
    } catch {}
  }, [actuals]);

  const setField = (key: MonthKey, field: keyof Omit<MonthActual, "expenses" | "notes">, value: string) => {
    setActuals((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || emptyMonth()), [field]: value === "" ? "" : Number(value) },
    }));
  };
  const setNotes = (key: MonthKey, value: string) => {
    setActuals((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || emptyMonth()), notes: value },
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

  // Compute running actual balance across all months
  const runningBalances = useMemo(() => {
    const result: Record<MonthKey, { startBal: number; endBal: number; hasData: boolean }> = {};
    let balance = STARTING_SAVINGS;
    let lastHadData = true;

    for (const md of ALL_MONTHS) {
      const key = makeKey(md.year, md.monthIndex);
      const actual = actuals[key];

      if (actual && lastHadData) {
        // Check for manual overrides first
        const startOverride = actual.startingSavingsOverride;
        if (startOverride !== "" && startOverride !== undefined) {
          balance = Number(startOverride);
        }
        const startBal = balance;

        const endOverride = actual.endingSavingsOverride;
        if (endOverride !== "" && endOverride !== undefined) {
          balance = Number(endOverride);
        } else {
          const totalInc =
            numVal(actual.ryanNet) +
            numVal(actual.ravenNet) +
            numVal(actual.bizIncome) +
            numVal(actual.expectedIncome);
          const totalExp = EXPENSE_CATS.reduce((s, c) => {
            const v = actual.expenses[c];
            return s + (v === undefined || v === "" ? md.expenses[c] : Number(v));
          }, 0);
          balance += totalInc - totalExp;
        }

        result[key] = { startBal, endBal: balance, hasData: true };
      } else {
        lastHadData = false;
        result[key] = { startBal: balance, endBal: balance + md.netMonthly, hasData: false };
      }
    }
    return result;
  }, [actuals]);

  // Savings trajectory for chart
  const trajectoryData = useMemo(() => {
    const data: { label: string; plan: number; actual: number | null }[] = [];
    let planBal = STARTING_SAVINGS;
    let lastActual: number | null = STARTING_SAVINGS;

    for (const md of ALL_MONTHS) {
      const key = makeKey(md.year, md.monthIndex);
      planBal += md.netMonthly;
      const rb = runningBalances[key];

      if (rb.hasData) {
        lastActual = rb.endBal;
      } else {
        lastActual = null;
      }

      data.push({
        label: `${md.month.slice(0, 3)} '${String(md.year).slice(2)}`,
        plan: Math.round(planBal),
        actual: lastActual !== null ? Math.round(lastActual) : null,
      });
    }
    return data;
  }, [runningBalances]);

  // Overall stats from actuals
  const overallStats = useMemo(() => {
    let totalActualInc = 0;
    let totalActualExp = 0;
    let monthsEntered = 0;
    let monthsUnderBudget = 0;

    for (const md of ALL_MONTHS) {
      const key = makeKey(md.year, md.monthIndex);
      const actual = actuals[key];
      if (!actual) continue;
      monthsEntered++;
      const inc =
        numVal(actual.ryanNet) +
        numVal(actual.ravenNet) +
        numVal(actual.bizIncome) +
        numVal(actual.expectedIncome);
      const exp = EXPENSE_CATS.reduce((s, c) => {
        const v = actual.expenses[c];
        return s + (v === undefined || v === "" ? md.expenses[c] : Number(v));
      }, 0);
      totalActualInc += inc;
      totalActualExp += exp;
      if (inc - exp >= md.netMonthly) monthsUnderBudget++;
    }
    const lastActualBalance = (() => {
      let last = STARTING_SAVINGS;
      for (const md of ALL_MONTHS) {
        const key = makeKey(md.year, md.monthIndex);
        const rb = runningBalances[key];
        if (rb.hasData) last = rb.endBal;
      }
      return last;
    })();
    return { totalActualInc, totalActualExp, monthsEntered, monthsUnderBudget, lastActualBalance };
  }, [actuals, runningBalances]);

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
            Enter real monthly income and expenses. Data saves automatically in your browser.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium"
            style={{ borderColor: indigo, color: indigo, background: "white" }}
            title="Download your data as JSON — use to back up or load on another device"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium"
            style={{ borderColor: "oklch(0.75 0.005 240)", color: "oklch(0.45 0.005 240)", background: "white" }}
            title="Load a previously exported JSON file"
          >
            <Upload size={13} /> Import
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Summary strip (only when data exists) */}
      {overallStats.monthsEntered > 0 && (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 rounded-xl"
          style={{ background: "oklch(0.97 0.005 265)", border: "1px solid oklch(0.9 0.01 265)" }}
        >
          <div>
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-lg font-bold number-display" style={{ color: indigo }}>
              {formatCurrency(overallStats.lastActualBalance)}
            </p>
            <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
              {overallStats.monthsEntered} month{overallStats.monthsEntered !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Income (actual)</p>
            <p className="text-lg font-bold number-display" style={{ color: teal }}>
              {formatCurrency(overallStats.totalActualInc)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Expenses (actual)</p>
            <p className="text-lg font-bold number-display" style={{ color: rose }}>
              {formatCurrency(overallStats.totalActualExp)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Months Under Budget</p>
            <p className="text-lg font-bold number-display" style={{ color: teal }}>
              {overallStats.monthsUnderBudget}/{overallStats.monthsEntered}
            </p>
            <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
              {overallStats.monthsEntered > 0
                ? `${Math.round((overallStats.monthsUnderBudget / overallStats.monthsEntered) * 100)}% on track`
                : ""}
            </p>
          </div>
        </div>
      )}

      {/* Year tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
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
              <span className="text-xs mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.75)" : "oklch(0.55 0.005 240)" }}>
                {count}/{yd.numMonths} mo
              </span>
              <div className="w-full h-1 rounded-full mt-1" style={{ background: isActive ? "rgba(255,255,255,0.25)" : "oklch(0.93 0.005 240)" }}>
                <div
                  className="h-1 rounded-full transition-all"
                  style={{ width: `${(count / yd.numMonths) * 100}%`, background: isActive ? "white" : TEAL_HEX }}
                />
              </div>
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
          const rb = runningBalances[key];

          const actualTotalInc = actual
            ? numVal(actual.ryanNet) + numVal(actual.ravenNet) + numVal(actual.bizIncome) + numVal(actual.expectedIncome)
            : null;
          const actualTotalExp = actual
            ? EXPENSE_CATS.reduce((s, c) => {
                const v = actual.expenses[c];
                return s + (v === undefined || v === "" ? md.expenses[c] : Number(v));
              }, 0)
            : null;
          const actualNet = actualTotalInc !== null && actualTotalExp !== null ? actualTotalInc - actualTotalExp : null;
          const netDiff = actualNet !== null ? actualNet - md.netMonthly : null;

          const expensePieData = EXPENSE_CATS.map((cat) => {
            const val = actual?.expenses[cat];
            const v = val === undefined || val === "" ? md.expenses[cat] : Number(val);
            return { name: cat, value: v, fill: CAT_COLORS[cat] };
          }).filter((d) => d.value > 0);

          const incomeBarData = [
            { name: "Ryan", actual: actual ? numVal(actual.ryanNet) : 0, plan: Math.round(md.ryanNet) },
            { name: "Raven", actual: actual ? numVal(actual.ravenNet) : 0, plan: Math.round(md.ravenNet) },
            { name: "Business", actual: actual ? numVal(actual.bizIncome) : 0, plan: Math.round(md.bizIncome) },
            ...(actual && numVal(actual.expectedIncome) > 0
              ? [{ name: "Expected", actual: numVal(actual.expectedIncome), plan: 0 }]
              : []),
          ];

          return (
            <div
              key={key}
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: isOpen ? indigo : hasData ? "oklch(0.85 0.01 240)" : "oklch(0.92 0.003 240)",
                background: "white",
                boxShadow: isOpen ? "0 2px 14px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {/* Row header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                onClick={() => setExpandedKey(isOpen ? null : key)}
              >
                <div className="w-24 flex-shrink-0">
                  <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.25 0.01 240)" }}>
                    {md.month}
                  </span>
                  {md.ravenInSchool && (
                    <span className="block text-xs mt-0.5" style={{ color: amber }}>School yr</span>
                  )}
                </div>

                {hasData ? (
                  <div className="flex gap-5 flex-1 flex-wrap">
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
                      <span className="text-xs text-muted-foreground block">Balance</span>
                      <span className="text-sm font-semibold number-display" style={{ color: indigo }}>
                        {formatCurrency(rb.endBal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">vs. Plan</span>
                      <span className="text-sm font-semibold number-display" style={{ color: netDiff! >= 0 ? teal : rose }}>
                        {netDiff! >= 0 ? "+" : ""}{formatCurrency(netDiff!)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground flex-1">No data — click to enter actuals</span>
                )}

                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasData && actual?.notes && (
                    <StickyNote size={13} style={{ color: amber }} title="Has notes" />
                  )}
                  {hasData && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.94 0.06 150)", color: "oklch(0.35 0.1 150)" }}>
                      Entered
                    </span>
                  )}
                  {isOpen ? <ChevronUp size={16} style={{ color: "oklch(0.55 0.005 240)" }} /> : <ChevronDown size={16} style={{ color: "oklch(0.55 0.005 240)" }} />}
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t px-5 py-5" style={{ borderColor: "oklch(0.92 0.005 240)", background: "oklch(0.985 0.002 240)" }}>
                  {/* Action buttons */}
                  <div className="flex gap-2 mb-5">
                    <button
                      onClick={() => fillPlan(md.year, md.monthIndex)}
                      className="text-xs px-3 py-1.5 rounded-lg border font-medium"
                      style={{ borderColor: indigo, color: indigo, background: "white" }}
                    >
                      Fill from plan
                    </button>
                    {hasData && (
                      <button
                        onClick={() => clearMonth(md.year, md.monthIndex)}
                        className="text-xs px-3 py-1.5 rounded-lg border font-medium"
                        style={{ borderColor: rose, color: rose, background: "white" }}
                      >
                        Clear month
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotes((p) => ({ ...p, [key]: !p[key] }))}
                      className="text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1"
                      style={{ borderColor: amber, color: amber, background: "white" }}
                    >
                      <StickyNote size={11} /> {showNotes[key] ? "Hide" : "Add"} Notes
                    </button>
                  </div>

                  {/* Savings overrides */}
                  <div
                    className="mb-5 p-4 rounded-xl"
                    style={{ background: "oklch(0.97 0.005 265)", border: "1px solid oklch(0.9 0.01 265)" }}
                  >
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: indigo }}>
                      <Wallet size={11} className="inline mr-1" />
                      Savings Balance Adjustments
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          field: "startingSavingsOverride" as const,
                          label: "Starting Balance Override",
                          hint: `Auto: ${formatCurrency(rb.startBal)}`,
                          help: "Override the starting balance for this month (e.g. if you made a deposit or withdrawal)",
                        },
                        {
                          field: "endingSavingsOverride" as const,
                          label: "Ending Balance Override",
                          hint: `Auto: ${formatCurrency(rb.endBal)}`,
                          help: "Override the ending balance (e.g. enter your actual bank balance at month end)",
                        },
                      ].map(({ field, label, hint, help }) => {
                        const val = actual?.[field] ?? "";
                        return (
                          <div key={field}>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-medium" style={{ color: "oklch(0.35 0.01 240)" }} title={help}>
                                {label}
                              </label>
                              <span className="text-xs" style={{ color: "oklch(0.6 0.005 240)" }}>{hint}</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "oklch(0.55 0.005 240)" }}>$</span>
                              <input
                                type="number"
                                value={val}
                                onChange={(e) => setField(key, field, e.target.value)}
                                placeholder="Leave blank for auto"
                                className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border outline-none bg-white"
                                style={{ borderColor: val !== "" ? indigo : "oklch(0.88 0.005 240)" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Income + Expenses grid */}
                  <div className="grid md:grid-cols-2 gap-6 mb-5">
                    {/* Income */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: teal }}>
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
                            {
                              field: "expectedIncome" as const,
                              label: "Expected / Other Income",
                              plan: 0,
                              note: "Tax refund, bonus, gift, etc.",
                            },
                          ] as const
                        ).map(({ field, label, plan, note }) => {
                          const val = actual?.[field] ?? "";
                          const numActual = val === "" ? null : Number(val);
                          const diff = numActual !== null && plan > 0 ? numActual - plan : null;
                          return (
                            <div key={field}>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-medium" style={{ color: "oklch(0.35 0.01 240)" }}>
                                  {label}
                                  {note && <span className="ml-1 font-normal" style={{ color: amber }}> ({note})</span>}
                                </label>
                                {plan > 0 && (
                                  <span className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
                                    Plan: {formatCurrency(plan)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "oklch(0.55 0.005 240)" }}>$</span>
                                  <input
                                    type="number"
                                    value={val}
                                    onChange={(e) => setField(key, field, e.target.value)}
                                    placeholder={plan > 0 ? String(Math.round(plan)) : "0"}
                                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border outline-none bg-white"
                                    style={{
                                      borderColor:
                                        numActual !== null
                                          ? diff !== null
                                            ? diff >= 0 ? "oklch(0.7 0.1 150)" : "oklch(0.7 0.15 15)"
                                            : "oklch(0.7 0.1 150)"
                                          : "oklch(0.88 0.005 240)",
                                    }}
                                  />
                                </div>
                                {diff !== null && (
                                  <span className="text-xs font-semibold w-16 text-right number-display" style={{ color: diff >= 0 ? teal : rose }}>
                                    {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expenses */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: rose }}>
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
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: CAT_COLORS[cat] }}
                              />
                              <label className="text-xs w-20 flex-shrink-0" style={{ color: "oklch(0.45 0.01 240)" }}>
                                {cat}
                              </label>
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>$</span>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={(e) => setExpense(key, cat, e.target.value)}
                                  placeholder={String(plan)}
                                  className="w-full pl-6 pr-2 py-1.5 rounded-lg border outline-none bg-white"
                                  style={{
                                    fontSize: 12,
                                    borderColor:
                                      numActual !== null
                                        ? diff! <= 0 ? "oklch(0.7 0.1 150)" : "oklch(0.7 0.15 15)"
                                        : "oklch(0.88 0.005 240)",
                                  }}
                                />
                              </div>
                              <span className="text-xs w-14 text-right number-display flex-shrink-0" style={{ color: "oklch(0.55 0.005 240)" }}>
                                {formatCurrency(plan)}
                              </span>
                              {diff !== null && (
                                <span className="text-xs w-14 text-right number-display flex-shrink-0" style={{ color: diff <= 0 ? teal : rose }}>
                                  {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {showNotes[key] && (
                    <div className="mb-5">
                      <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: amber }}>
                        <StickyNote size={11} className="inline mr-1" /> Notes for {md.month} {md.year}
                      </label>
                      <textarea
                        value={actual?.notes || ""}
                        onChange={(e) => setNotes(key, e.target.value)}
                        placeholder="e.g. Car repair $400 extra, got tax refund, Raven picked up a shift..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm rounded-lg border outline-none bg-white resize-none"
                        style={{ borderColor: "oklch(0.88 0.005 240)" }}
                      />
                    </div>
                  )}

                  {/* Monthly summary strip */}
                  {actual && (
                    <div className="p-4 rounded-xl flex flex-wrap gap-6 mb-5" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
                      <div>
                        <p className="text-xs text-muted-foreground">Starting Balance</p>
                        <p className="text-base font-bold number-display" style={{ color: indigo }}>{formatCurrency(rb.startBal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Income</p>
                        <p className="text-base font-bold number-display" style={{ color: teal }}>{formatCurrency(actualTotalInc!)}</p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>Plan: {formatCurrency(md.totalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="text-base font-bold number-display" style={{ color: rose }}>{formatCurrency(actualTotalExp!)}</p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>Plan: {formatCurrency(md.totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net This Month</p>
                        <p className="text-base font-bold number-display" style={{ color: actualNet! >= 0 ? teal : rose }}>{formatCurrency(actualNet!)}</p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>Plan: {formatCurrency(md.netMonthly)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ending Balance</p>
                        <p className="text-base font-bold number-display" style={{ color: indigo }}>{formatCurrency(rb.endBal)}</p>
                      </div>
                      {netDiff !== null && (
                        <div>
                          <p className="text-xs text-muted-foreground">vs. Plan</p>
                          <p className="text-base font-bold number-display" style={{ color: netDiff >= 0 ? teal : rose }}>
                            {netDiff >= 0 ? "+" : ""}{formatCurrency(netDiff)}
                          </p>
                          <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>{netDiff >= 0 ? "Ahead" : "Behind"} of plan</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Infographics */}
                  {actual && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.45 0.005 240)" }}>
                          Expense Breakdown
                        </p>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                              {expensePieData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.45 0.005 240)" }}>
                          Income: Actual vs. Plan
                        </p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={incomeBarData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="plan" name="Plan" fill={INDIGO_HEX} opacity={0.5} radius={[3, 3, 0, 0]} />
                            <Bar dataKey="actual" name="Actual" fill={TEAL_HEX} radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Category progress bars */}
                      <div className="md:col-span-2 rounded-xl p-4" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.45 0.005 240)" }}>
                          Expenses: Actual vs. Plan by Category
                        </p>
                        <div className="space-y-2.5">
                          {EXPENSE_CATS.map((cat) => {
                            const plan = md.expenses[cat];
                            if (plan === 0) return null;
                            const val = actual?.expenses[cat];
                            const actualVal = val === undefined || val === "" ? plan : Number(val);
                            const pct = Math.min((actualVal / plan) * 100, 150);
                            const over = actualVal > plan;
                            return (
                              <div key={cat}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span style={{ color: "oklch(0.4 0.01 240)" }}>{cat}</span>
                                  <span style={{ color: over ? ROSE_HEX : TEAL_HEX }}>
                                    {formatCurrency(actualVal)} / {formatCurrency(plan)}
                                    {val !== undefined && val !== "" && (
                                      <span className="ml-1">({over ? "+" : ""}{formatCurrency(actualVal - plan)})</span>
                                    )}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full" style={{ background: "oklch(0.93 0.005 240)" }}>
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: over ? ROSE_HEX : CAT_COLORS[cat] }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Savings trajectory chart */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Savings Balance: Actual vs. Plan
        </h3>
        <p className="text-xs text-muted-foreground mb-5">
          Solid line = actual balance from entered months. Dashed = plan.
        </p>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INDIGO_HEX} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={INDIGO_HEX} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL_HEX} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={TEAL_HEX} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, true)} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="plan" name="Plan" stroke={INDIGO_HEX} strokeWidth={1.5} strokeDasharray="5 3" fill="url(#planGrad)" dot={false} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke={TEAL_HEX} strokeWidth={2.5} fill="url(#actualGrad)" dot={false} connectNulls={false} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
