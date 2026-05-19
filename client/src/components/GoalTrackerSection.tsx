import { ALL_MONTHS, STARTING_SAVINGS, formatCurrency } from "@/lib/financialData";
import { Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const indigo = "oklch(0.5 0.18 265)";
const teal = "oklch(0.55 0.12 195)";
const amber = "oklch(0.72 0.15 65)";

const PRESET_GOALS = [
  { label: "Emergency Fund (3 mo)", amount: 15000 },
  { label: "Down Payment", amount: 40000 },
  { label: "New Car", amount: 20000 },
  { label: "Vacation Fund", amount: 5000 },
  { label: "Raven's School Fund", amount: 30000 },
  { label: "Investment Seed", amount: 50000 },
];

export default function GoalTrackerSection() {
  const [goalAmount, setGoalAmount] = useState(40000);
  const [customInput, setCustomInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(1);

  const trajectoryData = useMemo(() => {
    const data: { label: string; balance: number }[] = [];
    let bal = STARTING_SAVINGS;
    for (const md of ALL_MONTHS) {
      bal += md.netMonthly;
      data.push({ label: `${md.month.slice(0, 3)} '${String(md.year).slice(2)}`, balance: Math.round(bal) });
    }
    return data;
  }, []);

  const hitIndex = useMemo(() => trajectoryData.findIndex((d) => d.balance >= goalAmount), [trajectoryData, goalAmount]);
  const hitMonth = hitIndex >= 0 ? trajectoryData[hitIndex] : null;
  const progress = Math.min((STARTING_SAVINGS / goalAmount) * 100, 100);
  const remaining = Math.max(goalAmount - STARTING_SAVINGS, 0);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Target size={22} style={{ color: indigo }} />
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.01 240)" }}>Savings Goal Tracker</h2>
        </div>
        <p className="text-sm text-muted-foreground">Set a savings target and see exactly which month you will reach it based on your plan.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 rounded-2xl p-6" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>Choose a Goal</h3>
          <div className="space-y-2 mb-4">
            {PRESET_GOALS.map((g, i) => (
              <button key={i} onClick={() => { setSelectedPreset(i); setGoalAmount(g.amount); setCustomInput(""); }}
                className="w-full flex justify-between items-center px-3 py-2.5 rounded-lg border text-left transition-all"
                style={{ background: selectedPreset === i ? indigo : "white", borderColor: selectedPreset === i ? indigo : "oklch(0.88 0.005 240)", color: selectedPreset === i ? "white" : "oklch(0.35 0.01 240)" }}>
                <span className="text-xs font-medium">{g.label}</span>
                <span className="text-xs font-semibold number-display">{formatCurrency(g.amount)}</span>
              </button>
            ))}
          </div>
          <div className="border-t pt-4" style={{ borderColor: "oklch(0.92 0.005 240)" }}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "oklch(0.35 0.01 240)" }}>Custom Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "oklch(0.55 0.005 240)" }}>$</span>
              <input type="number" value={customInput} onChange={(e) => { setCustomInput(e.target.value); if (e.target.value) { setGoalAmount(Number(e.target.value)); setSelectedPreset(-1); } }}
                placeholder="e.g. 75000" className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border outline-none"
                style={{ borderColor: "oklch(0.88 0.005 240)", background: "white" }} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 flex flex-col justify-between" style={{ background: hitMonth ? "oklch(0.97 0.06 150)" : "oklch(0.97 0.05 15)", border: `1px solid ${hitMonth ? "oklch(0.85 0.08 150)" : "oklch(0.85 0.08 15)"}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: hitMonth ? "oklch(0.4 0.1 150)" : "oklch(0.45 0.1 15)" }}>{hitMonth ? "Goal Reached" : "Goal Not Reached by 2031"}</p>
            {hitMonth ? (
              <>
                <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.3 0.1 150)" }}>{hitMonth.label}</p>
                <p className="text-sm mt-1" style={{ color: "oklch(0.45 0.08 150)" }}>Balance: {formatCurrency(hitMonth.balance)}</p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "oklch(0.45 0.1 15)" }}>Increase income or reduce expenses to reach {formatCurrency(goalAmount)}</p>
            )}
          </div>

          <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.45 0.005 240)" }}>Progress from Start</p>
            <p className="text-2xl font-bold number-display mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: indigo }}>{formatCurrency(STARTING_SAVINGS)}</p>
            <p className="text-xs mb-3" style={{ color: "oklch(0.55 0.005 240)" }}>of {formatCurrency(goalAmount)} goal</p>
            <div className="w-full h-2 rounded-full" style={{ background: "oklch(0.93 0.005 240)" }}>
              <div className="h-2 rounded-full" style={{ width: `${progress}%`, background: indigo }} />
            </div>
            <p className="text-xs mt-2" style={{ color: "oklch(0.55 0.005 240)" }}>{remaining > 0 ? `${formatCurrency(remaining)} remaining` : "Goal achieved!"}</p>
          </div>

          {hitMonth && (
            <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.45 0.005 240)" }}>Months to Goal</p>
              <p className="text-3xl font-bold number-display" style={{ fontFamily: "'Space Grotesk', sans-serif", color: teal }}>{hitIndex + 1}</p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.005 240)" }}>from July 2026</p>
            </div>
          )}

          <div className="rounded-2xl p-6" style={{ background: "oklch(0.97 0.003 240)", border: "1px solid oklch(0.9 0.005 240)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.45 0.005 240)" }}>Target Amount</p>
            <p className="text-3xl font-bold number-display" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.3 0.01 240)" }}>{formatCurrency(goalAmount)}</p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.005 240)" }}>{hitMonth ? `${((goalAmount / trajectoryData[trajectoryData.length - 1].balance) * 100).toFixed(0)}% of final balance` : "exceeds 2031 projection"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>Savings Trajectory with Goal Line</h3>
        <p className="text-xs text-muted-foreground mb-5">The dashed amber line shows your {formatCurrency(goalAmount)} target.</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trajectoryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={indigo} stopOpacity={0.18} />
                <stop offset="95%" stopColor={indigo} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.003 240)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.55 0.005 240)" }} interval={5} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "oklch(0.55 0.005 240)" }} />
            <Tooltip formatter={(v: number) => [formatCurrency(v), "Balance"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <ReferenceLine y={goalAmount} stroke={amber} strokeWidth={1.5} strokeDasharray="6 3" label={{ value: `Goal: ${formatCurrency(goalAmount)}`, position: "insideTopRight", fontSize: 10, fill: amber }} />
            {hitMonth && <ReferenceLine x={hitMonth.label} stroke={teal} strokeWidth={1.5} strokeDasharray="4 3" label={{ value: "Hit!", position: "top", fontSize: 10, fill: teal }} />}
            <Area type="monotone" dataKey="balance" stroke={indigo} strokeWidth={2} fill="url(#goalGrad)" name="Balance" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
