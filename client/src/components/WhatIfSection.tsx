/**
 * WhatIfSection — Blueprint Financial Dashboard
 * Per-year scenario sliders: Ryan pay, Raven pay (all years unlocked), business income, expenses
 */

import {
  BIZ_INCOME,
  EXPENSES,
  RAVEN_RATE,
  RYAN_RATE,
  STARTING_SAVINGS,
  YEAR_DATA,
  formatCurrency,
  netMonthly,
} from "@/lib/financialData";
import { RefreshCw, Sliders } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031];

interface YearOverrides {
  ryanRate: number;
  ravenRate: number;
  bizIncome: number;
  rent: number;
  car: number;
  loans: number;
  school: number;
  other: number;
}

function defaultOverrides(year: number): YearOverrides {
  const exp = EXPENSES[year];
  return {
    ryanRate: RYAN_RATE[year],
    ravenRate: RAVEN_RATE[year],
    bizIncome: BIZ_INCOME[year],
    rent: exp.Rent,
    car: exp.Car,
    loans: exp.Loans,
    school: exp.School,
    other: exp.Other,
  };
}

const teal = "oklch(0.55 0.12 195)";
const rose = "oklch(0.58 0.18 15)";
const indigo = "oklch(0.5 0.18 265)";
const amber = "oklch(0.72 0.15 65)";

export default function WhatIfSection() {
  const [activeYear, setActiveYear] = useState(2026);
  const [overrides, setOverrides] = useState<Record<number, YearOverrides>>(() => {
    const o: Record<number, YearOverrides> = {};
    for (const y of YEARS) o[y] = defaultOverrides(y);
    return o;
  });

  const isModified = (year: number) => JSON.stringify(defaultOverrides(year)) !== JSON.stringify(overrides[year]);
  const resetYear = (year: number) => setOverrides((prev) => ({ ...prev, [year]: defaultOverrides(year) }));
  const setVal = (year: number, field: keyof YearOverrides, value: number) =>
    setOverrides((prev) => ({ ...prev, [year]: { ...prev[year], [field]: value } }));

  // Build full month-by-month trajectory for scenario vs baseline
  const scenarioData = useMemo(() => {
    const data: { label: string; scenario: number; baseline: number }[] = [];
    let scenBal = STARTING_SAVINGS;
    let baseBal = STARTING_SAVINGS;

    for (const yd of YEAR_DATA) {
      const over = overrides[yd.year];
      const exp = EXPENSES[yd.year];
      const scenRyanNet = netMonthly(over.ryanRate);
      const scenRavenNet = netMonthly(over.ravenRate);
      const scenTotalInc = scenRyanNet + scenRavenNet + over.bizIncome;
      const scenTotalExp = over.rent + exp.Utilities + exp.Food + over.car + exp["ENT Sub"] + exp["Bus Sub"] + exp.Phone + over.loans + over.school + over.other;
      const scenMonthlyNet = scenTotalInc - scenTotalExp;

      for (const md of yd.months) {
        scenBal += scenMonthlyNet;
        baseBal += md.netMonthly;
        data.push({
          label: `${md.month.slice(0, 3)} '${String(md.year).slice(2)}`,
          scenario: Math.round(scenBal),
          baseline: Math.round(baseBal),
        });
      }
    }
    return data;
  }, [overrides]);

  // Year-end comparison
  const yearComparison = useMemo(() => {
    const rows: { year: number; baseline: number; scenario: number; diff: number }[] = [];
    let scenBal = STARTING_SAVINGS;
    let baseBal = STARTING_SAVINGS;
    for (const yd of YEAR_DATA) {
      const over = overrides[yd.year];
      const exp = EXPENSES[yd.year];
      const scenRyanNet = netMonthly(over.ryanRate);
      const scenRavenNet = netMonthly(over.ravenRate);
      const scenTotalInc = scenRyanNet + scenRavenNet + over.bizIncome;
      const scenTotalExp = over.rent + exp.Utilities + exp.Food + over.car + exp["ENT Sub"] + exp["Bus Sub"] + exp.Phone + over.loans + over.school + over.other;
      const scenMonthlyNet = scenTotalInc - scenTotalExp;
      scenBal += scenMonthlyNet * yd.numMonths;
      baseBal = yd.endSavings;
      rows.push({ year: yd.year, baseline: Math.round(baseBal), scenario: Math.round(scenBal), diff: Math.round(scenBal - baseBal) });
    }
    return rows;
  }, [overrides]);

  const cur = overrides[activeYear];
  const def = defaultOverrides(activeYear);
  const exp = EXPENSES[activeYear];
  const scenRyanNet = netMonthly(cur.ryanRate);
  const scenRavenNet = netMonthly(cur.ravenRate);
  const scenTotalInc = scenRyanNet + scenRavenNet + cur.bizIncome;
  const scenTotalExp = cur.rent + exp.Utilities + exp.Food + cur.car + exp["ENT Sub"] + exp["Bus Sub"] + exp.Phone + cur.loans + cur.school + cur.other;
  const scenMonthlyNet = scenTotalInc - scenTotalExp;
  const isSchoolYear = RAVEN_RATE[activeYear] === 0;

  function SliderRow({ label, field, min, max, step, note }: { label: string; field: keyof YearOverrides; min: number; max: number; step: number; note?: string }) {
    const val = cur[field] as number;
    const baseline = def[field] as number;
    const changed = val !== baseline;
    const isHourly = field === "ryanRate" || field === "ravenRate";
    const fmt = (v: number) => isHourly ? `$${v}/hr` : formatCurrency(v);
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium" style={{ color: "oklch(0.3 0.01 240)" }}>
            {label}
            {note && <span className="ml-1 font-normal" style={{ color: amber }}> — {note}</span>}
          </span>
          <div className="flex items-center gap-2">
            {changed && <span className="text-xs" style={{ color: "oklch(0.6 0.005 240)" }}>base: {fmt(baseline)}</span>}
            <span className="text-xs font-semibold number-display" style={{ color: changed ? indigo : "oklch(0.45 0.005 240)" }}>{fmt(val)}</span>
          </div>
        </div>
        <input type="range" min={min} max={max} step={step} value={val}
          onChange={(e) => setVal(activeYear, field, Number(e.target.value))}
          onInput={(e) => setVal(activeYear, field, Number((e.target as HTMLInputElement).value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: indigo, touchAction: "none" }} />
        <div className="flex justify-between text-xs mt-0.5" style={{ color: "oklch(0.65 0.005 240)" }}>
          <span>{fmt(min)}</span><span>{fmt(max)}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Sliders size={22} style={{ color: indigo }} />
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.01 240)" }}>
            What-If Calculator
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">Adjust any variable per year and watch the savings trajectory update live. Raven's sliders are active for all years — enter any income she earns during school.</p>
      </div>

      {/* Year tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {YEARS.map((y) => {
          const isActive = activeYear === y;
          const modified = isModified(y);
          const school = RAVEN_RATE[y] === 0;
          return (
            <button key={y} onClick={() => setActiveYear(y)}
              className="relative flex flex-col items-center px-4 py-2 rounded-lg border transition-all duration-150"
              style={{ background: isActive ? indigo : "white", borderColor: isActive ? indigo : modified ? amber : "oklch(0.88 0.005 240)", color: isActive ? "white" : "oklch(0.35 0.01 240)", minWidth: 72 }}>
              <span className="text-sm font-semibold">{y}</span>
              {school && <span className="text-xs mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.7)" : amber }}>School yr</span>}
              {modified && !isActive && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: amber }} />}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>{activeYear} Variables</h3>
            {isModified(activeYear) && (
              <button onClick={() => resetYear(activeYear)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: "oklch(0.75 0.005 240)", color: "oklch(0.5 0.005 240)" }}>
                <RefreshCw size={11} /> Reset {activeYear}
              </button>
            )}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: teal }}>Income</p>
          <SliderRow label="Ryan Hourly Rate" field="ryanRate" min={10} max={60} step={1} />
          <SliderRow
            label="Raven Hourly Rate"
            field="ravenRate"
            min={0}
            max={50}
            step={1}
            note={isSchoolYear ? "school year — $0 baseline, adjust if she earns side income" : undefined}
          />
          <SliderRow label="Business Income / mo" field="bizIncome" min={0} max={5000} step={100} />

          <p className="text-xs font-semibold uppercase tracking-wider mb-3 mt-5" style={{ color: rose }}>Expenses</p>
          <SliderRow label="Rent / mo" field="rent" min={800} max={2500} step={50} />
          <SliderRow label="Car / mo" field="car" min={0} max={1500} step={25} />
          <SliderRow label="Loans / mo" field="loans" min={0} max={1000} step={25} />
          <SliderRow label="School / mo" field="school" min={0} max={2000} step={50} />
          <SliderRow label="Other / mo" field="other" min={0} max={2000} step={50} />

          {/* Monthly preview */}
          <div className="mt-5 p-4 rounded-xl" style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0.9 0.005 240)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.45 0.005 240)" }}>{activeYear} Monthly Preview</p>
            <div className="grid grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">Income</p><p className="text-sm font-bold number-display" style={{ color: teal }}>{formatCurrency(scenTotalInc)}</p></div>
              <div><p className="text-xs text-muted-foreground">Expenses</p><p className="text-sm font-bold number-display" style={{ color: rose }}>{formatCurrency(scenTotalExp)}</p></div>
              <div><p className="text-xs text-muted-foreground">Net / mo</p><p className="text-sm font-bold number-display" style={{ color: scenMonthlyNet >= 0 ? teal : rose }}>{formatCurrency(scenMonthlyNet)}</p></div>
            </div>
          </div>
        </div>

        {/* Chart + table */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>Savings Trajectory</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={scenarioData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="wiScenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={teal} stopOpacity={0.2} /><stop offset="95%" stopColor={teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wiBaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={indigo} stopOpacity={0.12} /><stop offset="95%" stopColor={indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.003 240)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "oklch(0.55 0.005 240)" }} interval={7} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 9, fill: "oklch(0.55 0.005 240)" }} />
                <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n === "scenario" ? "Scenario" : "Baseline"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="baseline" stroke={indigo} strokeWidth={1.5} strokeDasharray="4 3" fill="url(#wiBaseGrad)" name="Baseline" dot={false} />
                <Area type="monotone" dataKey="scenario" stroke={teal} strokeWidth={2} fill="url(#wiScenGrad)" name="Scenario" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "oklch(0.92 0.005 240)" }}>
              <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>Year-End Balance Comparison</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "oklch(0.97 0.003 240)" }}>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>Year</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>Baseline</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>Scenario</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>Diff</th>
                </tr>
              </thead>
              <tbody>
                {yearComparison.map((row) => (
                  <tr key={row.year} className="border-t cursor-pointer" style={{ borderColor: "oklch(0.93 0.003 240)" }}
                    onClick={() => setActiveYear(row.year)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.97 0.003 240)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-2.5">
                      <span className="text-xs font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: activeYear === row.year ? indigo : "oklch(0.3 0.01 240)" }}>{row.year}</span>
                      {isModified(row.year) && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "oklch(0.97 0.08 65)", color: amber }}>modified</span>}
                    </td>
                    <td className="text-right px-4 py-2.5 text-xs number-display" style={{ color: "oklch(0.45 0.005 240)" }}>{formatCurrency(row.baseline)}</td>
                    <td className="text-right px-4 py-2.5 text-xs font-semibold number-display" style={{ color: row.scenario >= row.baseline ? teal : rose }}>{formatCurrency(row.scenario)}</td>
                    <td className="text-right px-5 py-2.5 text-xs font-semibold number-display" style={{ color: row.diff >= 0 ? teal : rose }}>{row.diff >= 0 ? "+" : ""}{formatCurrency(row.diff)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
