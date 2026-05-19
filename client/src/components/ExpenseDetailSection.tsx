/**
 * ExpenseDetailSection — Blueprint Financial Dashboard
 * Detailed expense breakdown by category across all years
 */

import {
  CAT_COLORS,
  EXPENSE_CATS,
  EXPENSES,
  formatCurrency,
} from "@/lib/financialData";
import {
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

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031];

// Build stacked bar data
const stackedData = YEARS.map((year) => {
  const exp = EXPENSES[year];
  const entry: Record<string, number | string> = { year: year.toString() };
  EXPENSE_CATS.forEach((cat) => {
    entry[cat] = exp[cat];
  });
  return entry;
});

// Category totals across all years
const catTotals = EXPENSE_CATS.map((cat) => ({
  cat,
  total: YEARS.reduce((sum, yr) => {
    const months = yr === 2026 ? 6 : 12;
    return sum + EXPENSES[yr][cat] * months;
  }, 0),
  color: CAT_COLORS[cat],
})).sort((a, b) => b.total - a.total);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm max-w-xs">
      <p className="font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label} Monthly Expenses</p>
      {payload.filter((p: any) => p.value > 0).map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.dataKey}</span>
          <span className="font-medium number-display">{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span className="number-display">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

export default function ExpenseDetailSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.15 0.01 240)" }}
        >
          Expense Detail
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Monthly expense amounts by category across all years.
        </p>
      </div>

      {/* Stacked bar chart */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Monthly Expenses by Category (per year)
        </h3>
        <p className="text-xs text-muted-foreground mb-5">
          Each bar shows the monthly expense total for that year, stacked by category.
        </p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, true)}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {EXPENSE_CATS.filter((cat) => YEARS.some((yr) => EXPENSES[yr][cat] > 0)).map((cat) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} maxBarSize={60} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category totals */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Total Spending by Category (Full 5.5-Year Period)
          </h3>
        </div>
        <div className="p-5 space-y-3">
          {catTotals.map((item) => {
            const grandTotal = catTotals.reduce((s, c) => s + c.total, 0);
            const pct = (item.total / grandTotal) * 100;
            return (
              <div key={item.cat}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                    <span className="text-sm font-medium">{item.cat}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                    <span className="text-sm font-semibold number-display">{formatCurrency(item.total)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full" style={{ background: "oklch(0.93 0.005 240)" }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Year-by-year table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Monthly Expense Amounts by Year
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            All values are per-month amounts. School costs appear starting in 2028.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "oklch(0.97 0.003 240)" }}>
                <th
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide sticky left-0"
                  style={{ color: "oklch(0.45 0.01 240)", borderBottom: "1px solid oklch(0.91 0.005 240)", background: "oklch(0.97 0.003 240)" }}
                >
                  Category
                </th>
                {YEARS.map((yr) => (
                  <th
                    key={yr}
                    className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "oklch(0.45 0.01 240)", borderBottom: "1px solid oklch(0.91 0.005 240)" }}
                  >
                    {yr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXPENSE_CATS.map((cat, i) => (
                <tr
                  key={cat}
                  className="data-row"
                  style={{
                    background: i % 2 === 0 ? "white" : "oklch(0.985 0.002 240)",
                    borderBottom: "1px solid oklch(0.93 0.004 240)",
                  }}
                >
                  <td
                    className="px-4 py-2.5 font-medium sticky left-0"
                    style={{
                      background: i % 2 === 0 ? "white" : "oklch(0.985 0.002 240)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[cat] }} />
                      {cat}
                    </div>
                  </td>
                  {YEARS.map((yr) => {
                    const val = EXPENSES[yr][cat];
                    return (
                      <td
                        key={yr}
                        className="px-4 py-2.5 text-right number-display"
                        style={{
                          color: val === 0 ? "oklch(0.75 0.005 240)" : "oklch(0.25 0.01 240)",
                          background: cat === "School" && val > 0 ? "var(--school-light)" : undefined,
                        }}
                      >
                        {val === 0 ? "—" : formatCurrency(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ background: "oklch(0.93 0.006 240)", borderTop: "2px solid oklch(0.88 0.008 240)" }}>
                <td className="px-4 py-3 font-bold sticky left-0" style={{ background: "oklch(0.93 0.006 240)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Monthly Total
                </td>
                {YEARS.map((yr) => {
                  const total = Object.values(EXPENSES[yr]).reduce((a, b) => a + b, 0);
                  return (
                    <td key={yr} className="px-4 py-3 text-right font-bold number-display" style={{ color: "var(--expense)" }}>
                      {formatCurrency(total)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notable changes callout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: "Car Costs Drop in 2029",
            desc: "Car expenses drop from $727/mo to $200/mo in 2029, likely when the car is paid off.",
            color: "var(--income)",
            bg: "var(--income-light)",
          },
          {
            title: "School Costs Begin 2028",
            desc: "School expenses start at $417/mo in 2028–2029 (LPN), then increase to $833/mo in 2030–2031 (RN).",
            color: "var(--school)",
            bg: "var(--school-light)",
          },
          {
            title: "Other Expenses Grow",
            desc: "\"Other\" expenses increase from $300/mo in 2026 to $800/mo by 2030–2031, reflecting lifestyle growth.",
            color: "oklch(0.45 0.12 220)",
            bg: "var(--savings-light)",
          },
        ].map((note) => (
          <div
            key={note.title}
            className="rounded-lg p-4 border"
            style={{ background: note.bg, borderColor: "transparent" }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: note.color, fontFamily: "'Space Grotesk', sans-serif" }}>
              {note.title}
            </p>
            <p className="text-xs text-muted-foreground">{note.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
