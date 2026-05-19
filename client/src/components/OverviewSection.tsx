/**
 * OverviewSection — Blueprint Financial Dashboard
 * KPI summary cards + savings trajectory chart + annual comparison
 */

import {
  ALL_MONTHS,
  formatCurrency,
  STARTING_SAVINGS,
  YEAR_DATA,
} from "@/lib/financialData";
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
import { GraduationCap, TrendingDown, TrendingUp, Wallet } from "lucide-react";

// Build monthly savings trajectory
const savingsTrajectory = ALL_MONTHS.map((m) => ({
  label: `${m.month.slice(0, 3)} ${m.year}`,
  savings: Math.round(m.savingsBalance),
  income: Math.round(m.totalIncome),
  expenses: Math.round(m.totalExpenses),
  net: Math.round(m.netMonthly),
  school: m.ravenInSchool,
}));

// Annual comparison data
const annualData = YEAR_DATA.map((y) => ({
  year: y.year.toString(),
  income: Math.round(y.totalIncome),
  expenses: Math.round(y.totalExpenses),
  net: Math.round(y.netSavings),
  endSavings: Math.round(y.endSavings),
  school: y.ravenInSchool,
}));

const finalBalance = YEAR_DATA[YEAR_DATA.length - 1].endSavings;
const totalIncome = YEAR_DATA.reduce((s, y) => s + y.totalIncome, 0);
const totalExpenses = YEAR_DATA.reduce((s, y) => s + y.totalExpenses, 0);
const totalNet = totalIncome - totalExpenses;

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  delay?: number;
}

function KpiCard({ label, value, sub, color, icon, delay = 0 }: KpiCardProps) {
  return (
    <div
      className="stat-card animate-count"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p
        className="text-2xl font-bold number-display"
        style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium number-display">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function OverviewSection() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.15 0.01 240)" }}
        >
          5-Year Financial Overview
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          July 2026 – December 2031 · Starting savings: {formatCurrency(STARTING_SAVINGS)}
        </p>
      </div>

      {/* School notice */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm"
        style={{ background: "var(--school-light)", borderColor: "oklch(0.88 0.08 65)", color: "oklch(0.45 0.12 65)" }}
      >
        <GraduationCap size={16} />
        <span>
          <strong>Note:</strong> Raven is in school from January 2028 through December 2031 (LPN 2028–2029, RN 2030–2031).
          Her income is $0 during this period.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Projected End Balance"
          value={formatCurrency(finalBalance)}
          sub="Dec 2031"
          color="var(--savings)"
          icon={<Wallet size={18} />}
          delay={0}
        />
        <KpiCard
          label="Total Income (5.5 yr)"
          value={formatCurrency(totalIncome, true)}
          sub="Ryan + Raven + Business"
          color="var(--income)"
          icon={<TrendingUp size={18} />}
          delay={80}
        />
        <KpiCard
          label="Total Expenses (5.5 yr)"
          value={formatCurrency(totalExpenses, true)}
          sub="All categories"
          color="var(--expense)"
          icon={<TrendingDown size={18} />}
          delay={160}
        />
        <KpiCard
          label="Net Savings (5.5 yr)"
          value={formatCurrency(totalNet, true)}
          sub={`${((totalNet / totalIncome) * 100).toFixed(1)}% savings rate`}
          color={totalNet >= 0 ? "var(--income)" : "var(--expense)"}
          icon={<TrendingUp size={18} />}
          delay={240}
        />
      </div>

      {/* Savings Trajectory Chart */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3
          className="text-base font-semibold mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Savings Balance Over Time
        </h3>
        <p className="text-xs text-muted-foreground mb-5">
          Month-by-month cumulative savings. Amber shading = Raven in school.
        </p>
        <div className="animate-chart" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsTrajectory} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--savings)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--savings)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }}
                tickLine={false}
                axisLine={false}
                interval={5}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, true)}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="savings"
                name="Savings Balance"
                stroke="var(--savings)"
                strokeWidth={2}
                fill="url(#savingsGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--savings)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Annual Income vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3
            className="text-base font-semibold mb-1"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Annual Income vs. Expenses
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Grouped by year. School years shown with amber border.
          </p>
          <div className="animate-chart" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, true)}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) => <span style={{ color: "oklch(0.4 0.01 240)" }}>{val}</span>}
                />
                <Bar dataKey="income" name="Income" fill="var(--income)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--expense)" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net savings per year */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3
            className="text-base font-semibold mb-1"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Net Savings Added Per Year
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            How much is added to savings each year after all expenses.
          </p>
          <div className="animate-chart" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "oklch(0.55 0.01 240)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, true)}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name="Net Savings" radius={[3, 3, 0, 0]} maxBarSize={40}>
                  {annualData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.net >= 0 ? (entry.school ? "var(--school)" : "var(--income)") : "var(--expense)"}
                    />
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
          <h3
            className="text-base font-semibold"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Annual Summary Table
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "oklch(0.97 0.003 240)" }}>
                {["Year","Months","Ryan Net","Raven Net","Business","Total Income","Total Expenses","Net Saved","End Balance"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: "oklch(0.45 0.01 240)", borderBottom: "1px solid oklch(0.91 0.005 240)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YEAR_DATA.map((y, i) => (
                <tr
                  key={y.year}
                  className="data-row"
                  style={{
                    background: y.ravenInSchool ? "var(--school-light)" : i % 2 === 0 ? "white" : "oklch(0.985 0.002 240)",
                    borderBottom: "1px solid oklch(0.93 0.004 240)",
                  }}
                >
                  <td className="px-4 py-3 font-semibold number-display" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>
                    {y.year}
                    {y.ravenInSchool && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--school)", color: "white" }}>
                        School
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{y.numMonths}</td>
                  <td className="px-4 py-3 number-display positive">{formatCurrency(y.ryanAnnualNet)}</td>
                  <td className="px-4 py-3 number-display" style={{ color: y.ravenInSchool ? "oklch(0.6 0.1 65)" : "var(--income)" }}>
                    {y.ravenInSchool ? "—" : formatCurrency(y.ravenAnnualNet)}
                  </td>
                  <td className="px-4 py-3 number-display" style={{ color: "oklch(0.45 0.12 220)" }}>
                    {formatCurrency(y.bizAnnualNet)}
                  </td>
                  <td className="px-4 py-3 font-semibold number-display positive">{formatCurrency(y.totalIncome)}</td>
                  <td className="px-4 py-3 font-semibold number-display negative">{formatCurrency(y.totalExpenses)}</td>
                  <td
                    className="px-4 py-3 font-bold number-display"
                    style={{ color: y.netSavings >= 0 ? "var(--income)" : "var(--expense)" }}
                  >
                    {y.netSavings >= 0 ? "+" : ""}{formatCurrency(y.netSavings)}
                  </td>
                  <td className="px-4 py-3 font-bold number-display" style={{ color: "var(--savings)" }}>
                    {formatCurrency(y.endSavings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
