/**
 * YearSection — Blueprint Financial Dashboard
 * Detailed monthly view for a single year: income breakdown, expense breakdown, savings
 */

import {
  CAT_COLORS,
  EXPENSE_CATS,
  formatCurrency,
  YearData,
} from "@/lib/financialData";
import {
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
import { GraduationCap } from "lucide-react";

interface YearSectionProps {
  yearData: YearData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color || p.fill }}>{p.name}</span>
          <span className="font-medium number-display">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function YearSection({ yearData }: YearSectionProps) {
  const { year, months, ravenInSchool, ryanHourlyRate, ravenHourlyRate } = yearData;

  // Monthly chart data
  const monthlyChart = months.map((m) => ({
    month: m.month.slice(0, 3),
    income: Math.round(m.totalIncome),
    expenses: Math.round(m.totalExpenses),
    net: Math.round(m.netMonthly),
    savings: Math.round(m.savingsBalance),
  }));

  // Expense pie data
  const expPie = EXPENSE_CATS
    .filter((cat) => months[0].expenses[cat] > 0)
    .map((cat) => ({
      name: cat,
      value: months[0].expenses[cat],
      color: CAT_COLORS[cat],
    }));

  // Income breakdown for first month (representative)
  const m0 = months[0];
  const incomeBreakdown = [
    { name: "Ryan", value: Math.round(m0.ryanNet), color: "var(--income)" },
    ...(m0.ravenNet > 0 ? [{ name: "Raven", value: Math.round(m0.ravenNet), color: "oklch(0.55 0.18 220)" }] : []),
    { name: "Business", value: m0.bizIncome, color: "oklch(0.52 0.22 270)" },
  ];

  const schoolLabel = year <= 2029 ? "LPN Program (Year " + (year - 2027) + ")" : "RN Program (Year " + (year - 2029) + ")";

  return (
    <div className="space-y-6">
      {/* Year header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.15 0.01 240)" }}
          >
            {year}
            {ravenInSchool && (
              <span
                className="ml-3 text-sm font-medium px-2.5 py-1 rounded-full"
                style={{ background: "var(--school-light)", color: "var(--school)" }}
              >
                <GraduationCap size={13} className="inline mr-1" />
                Raven in School
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {year === 2026 ? "July – December (6 months)" : "January – December (12 months)"}
          </p>
        </div>
        {/* Pay rate badges */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "var(--income-light)", color: "var(--income)" }}
          >
            Ryan: ${ryanHourlyRate}/hr
          </span>
          {!ravenInSchool ? (
            <span
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: "oklch(0.94 0.04 220)", color: "oklch(0.45 0.18 220)" }}
            >
              Raven: ${ravenHourlyRate}/hr
            </span>
          ) : (
            <span
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: "var(--school-light)", color: "var(--school)" }}
            >
              Raven: {schoolLabel}
            </span>
          )}
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "var(--savings-light)", color: "var(--savings)" }}
          >
            Business: {formatCurrency(m0.bizIncome)}/mo
          </span>
        </div>
      </div>

      {/* Year KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Income", value: formatCurrency(yearData.totalIncome), color: "var(--income)" },
          { label: "Total Expenses", value: formatCurrency(yearData.totalExpenses), color: "var(--expense)" },
          { label: "Net Saved", value: (yearData.netSavings >= 0 ? "+" : "") + formatCurrency(yearData.netSavings), color: yearData.netSavings >= 0 ? "var(--income)" : "var(--expense)" },
          { label: "Year-End Balance", value: formatCurrency(yearData.endSavings), color: "var(--savings)" },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p
              className="text-xl font-bold number-display"
              style={{ color: kpi.color, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly income vs expenses bar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Monthly Income vs. Expenses
          </h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, true)}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name="Income" fill="var(--income)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--expense)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense pie */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Monthly Expense Breakdown
          </h3>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 space-y-1">
            {expPie.map((e) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: e.color }} />
                  <span className="text-muted-foreground">{e.name}</span>
                </div>
                <span className="font-medium number-display">{formatCurrency(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly detail table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Monthly Detail
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "oklch(0.97 0.003 240)" }}>
                {["Month", "Ryan Net", "Raven Net", "Business", "Total Income", "Total Expenses", "Net", "Savings Balance"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "oklch(0.45 0.01 240)", borderBottom: "1px solid oklch(0.91 0.005 240)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => (
                <tr
                  key={m.month}
                  className="data-row"
                  style={{
                    background: i % 2 === 0 ? "white" : "oklch(0.985 0.002 240)",
                    borderBottom: "1px solid oklch(0.93 0.004 240)",
                  }}
                >
                  <td className="px-4 py-2.5 font-medium" style={{ color: "oklch(0.25 0.01 240)" }}>{m.month}</td>
                  <td className="px-4 py-2.5 number-display positive">{formatCurrency(m.ryanNet)}</td>
                  <td
                    className="px-4 py-2.5 number-display"
                    style={{ color: m.ravenInSchool ? "oklch(0.6 0.1 65)" : "var(--income)" }}
                  >
                    {m.ravenInSchool ? "—" : formatCurrency(m.ravenNet)}
                  </td>
                  <td className="px-4 py-2.5 number-display" style={{ color: "oklch(0.45 0.12 220)" }}>
                    {formatCurrency(m.bizIncome)}
                  </td>
                  <td className="px-4 py-2.5 font-semibold number-display positive">{formatCurrency(m.totalIncome)}</td>
                  <td className="px-4 py-2.5 font-semibold number-display negative">{formatCurrency(m.totalExpenses)}</td>
                  <td
                    className="px-4 py-2.5 font-bold number-display"
                    style={{ color: m.netMonthly >= 0 ? "var(--income)" : "var(--expense)" }}
                  >
                    {m.netMonthly >= 0 ? "+" : ""}{formatCurrency(m.netMonthly)}
                  </td>
                  <td className="px-4 py-2.5 font-bold number-display" style={{ color: "var(--savings)" }}>
                    {formatCurrency(m.savingsBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Income breakdown */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Monthly Income Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {incomeBreakdown.map((item) => (
            <div
              key={item.name}
              className="rounded-lg p-4 border"
              style={{
                background: item.color === "var(--income)" ? "var(--income-light)" :
                  item.color === "var(--savings)" ? "var(--savings-light)" :
                  item.name === "Business" ? "var(--savings-light)" : "oklch(0.94 0.04 220)",
                borderColor: "transparent",
              }}
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">{item.name}</p>
              <p
                className="text-xl font-bold number-display"
                style={{ color: item.color, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">per month</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
