import { RYAN_RATE, YEAR_DATA, formatCurrency, netMonthly } from "@/lib/financialData";
import { GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const indigo = "oklch(0.5 0.18 265)";
const teal = "oklch(0.55 0.12 195)";
const rose = "oklch(0.58 0.18 15)";
const amber = "oklch(0.72 0.15 65)";

const RAVEN_ROLES = [
  { label: "LPN", hourly: 25, desc: "Licensed Practical Nurse" },
  { label: "RN Entry", hourly: 35, desc: "Registered Nurse — Entry Level" },
  { label: "RN Mid", hourly: 45, desc: "Registered Nurse — Mid Career" },
  { label: "RN Senior", hourly: 55, desc: "Registered Nurse — Senior / Specialty" },
];

const TAX_RATE = 0.22;
const HRS_WK = 40;
const HRS_YR = HRS_WK * 52;

function netMonthlyRaven(hourly: number) {
  return (hourly * HRS_YR * (1 - TAX_RATE)) / 12;
}

export default function PostSchoolSection() {
  const [roleIdx, setRoleIdx] = useState(1);
  const role = RAVEN_ROLES[roleIdx];

  const ravenMonthlyNet = netMonthlyRaven(role.hourly);
  const lastYD = YEAR_DATA[YEAR_DATA.length - 1];
  const ryanMonthlyNet = netMonthly(RYAN_RATE[lastYD.year]);
  const bizIncome = lastYD.months[0].bizIncome;
  const combinedIncome = ryanMonthlyNet + ravenMonthlyNet + bizIncome;

  const trajectoryData = useMemo(() => {
    const data: { label: string; withRaven: number; withoutRaven: number }[] = [];
    let withBal = YEAR_DATA[YEAR_DATA.length - 1].endSavings;
    let withoutBal = YEAR_DATA[YEAR_DATA.length - 1].endSavings;
    const lastExp = lastYD.months[0].totalExpenses;
    const withMonthlyNet = combinedIncome - lastExp;
    const withoutMonthlyNet = ryanMonthlyNet + bizIncome - lastExp;

    for (let yr = 2032; yr <= 2035; yr++) {
      for (let mo = 0; mo < 12; mo++) {
        withBal += withMonthlyNet;
        withoutBal += withoutMonthlyNet;
        const label = `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][mo]} ${yr}`;
        data.push({ label, withRaven: Math.round(withBal), withoutRaven: Math.round(withoutBal) });
      }
    }
    return data;
  }, [role, combinedIncome, ryanMonthlyNet, bizIncome]);

  const yearRows = useMemo(() => {
    const rows = [];
    let withBal = YEAR_DATA[YEAR_DATA.length - 1].endSavings;
    let withoutBal = YEAR_DATA[YEAR_DATA.length - 1].endSavings;
    const lastExp = lastYD.months[0].totalExpenses;
    const withMonthlyNet = combinedIncome - lastExp;
    const withoutMonthlyNet = ryanMonthlyNet + bizIncome - lastExp;
    for (let yr = 2032; yr <= 2035; yr++) {
      withBal += withMonthlyNet * 12;
      withoutBal += withoutMonthlyNet * 12;
      rows.push({ year: yr, withRaven: Math.round(withBal), withoutRaven: Math.round(withoutBal), diff: Math.round(withBal - withoutBal) });
    }
    return rows;
  }, [role, combinedIncome, ryanMonthlyNet, bizIncome]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <GraduationCap size={22} style={{ color: amber }} />
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.01 240)" }}>
            2032+ Post-School Projection
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">See what happens when Raven returns to work after completing her nursing degree.</p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {RAVEN_ROLES.map((r, i) => (
          <button key={i} onClick={() => setRoleIdx(i)}
            className="flex flex-col items-start px-4 py-3 rounded-xl border transition-all"
            style={{ background: roleIdx === i ? amber : "white", borderColor: roleIdx === i ? amber : "oklch(0.88 0.005 240)", color: roleIdx === i ? "white" : "oklch(0.35 0.01 240)", minWidth: 130 }}>
            <span className="text-sm font-bold">{r.label}</span>
            <span className="text-xs mt-0.5" style={{ color: roleIdx === i ? "rgba(255,255,255,0.8)" : "oklch(0.55 0.005 240)" }}>${r.hourly}/hr</span>
            <span className="text-xs" style={{ color: roleIdx === i ? "rgba(255,255,255,0.7)" : "oklch(0.6 0.005 240)" }}>{r.desc}</span>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.45 0.005 240)" }}>Raven Monthly Net</p>
          <p className="text-2xl font-bold number-display" style={{ fontFamily: "'Space Grotesk', sans-serif", color: amber }}>{formatCurrency(ravenMonthlyNet)}</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.005 240)" }}>${role.hourly}/hr — {role.label}</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.45 0.005 240)" }}>Combined Household Income</p>
          <p className="text-2xl font-bold number-display" style={{ fontFamily: "'Space Grotesk', sans-serif", color: teal }}>{formatCurrency(combinedIncome)}</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.005 240)" }}>Ryan + Raven + Business / mo</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.45 0.005 240)" }}>Monthly Net Savings</p>
          <p className="text-2xl font-bold number-display" style={{ fontFamily: "'Space Grotesk', sans-serif", color: indigo }}>{formatCurrency(combinedIncome - lastYD.months[0].totalExpenses)}</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.005 240)" }}>after all expenses</p>
        </div>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>2032–2035 Savings Trajectory</h3>
        <p className="text-xs text-muted-foreground mb-5">Teal = with Raven working as {role.label}. Dashed = Ryan + Business only.</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trajectoryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="psWithGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={teal} stopOpacity={0.2} /><stop offset="95%" stopColor={teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.93 0.003 240)" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "oklch(0.55 0.005 240)" }} interval={5} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 9, fill: "oklch(0.55 0.005 240)" }} />
            <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n === "withRaven" ? `With Raven (${role.label})` : "Ryan + Business Only"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="withoutRaven" stroke={rose} strokeWidth={1.5} strokeDasharray="4 3" fill="none" name="withoutRaven" dot={false} />
            <Area type="monotone" dataKey="withRaven" stroke={teal} strokeWidth={2} fill="url(#psWithGrad)" name="withRaven" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid oklch(0.9 0.005 240)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "oklch(0.92 0.005 240)" }}>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>Year-End Balance 2032–2035</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "oklch(0.97 0.003 240)" }}>
              <th className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>Year</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>With Raven ({role.label})</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>Ryan + Biz Only</th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold" style={{ color: "oklch(0.45 0.005 240)" }}>Raven Impact</th>
            </tr>
          </thead>
          <tbody>
            {yearRows.map((row) => (
              <tr key={row.year} className="border-t" style={{ borderColor: "oklch(0.93 0.003 240)" }}>
                <td className="px-5 py-2.5 text-xs font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.3 0.01 240)" }}>{row.year}</td>
                <td className="text-right px-4 py-2.5 text-xs font-semibold number-display" style={{ color: teal }}>{formatCurrency(row.withRaven)}</td>
                <td className="text-right px-4 py-2.5 text-xs number-display" style={{ color: "oklch(0.45 0.005 240)" }}>{formatCurrency(row.withoutRaven)}</td>
                <td className="text-right px-5 py-2.5 text-xs font-semibold number-display" style={{ color: teal }}>+{formatCurrency(row.diff)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
