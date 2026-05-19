import { ALL_MONTHS, STARTING_SAVINGS, YEAR_DATA, formatCurrency } from "@/lib/financialData";
import { useMemo } from "react";

const indigo = "oklch(0.5 0.18 265)";
const teal = "oklch(0.55 0.12 195)";
const rose = "oklch(0.58 0.18 15)";
const amber = "oklch(0.72 0.15 65)";

interface Milestone {
  label: string;
  date: string;
  balance: number;
  color: string;
  icon: string;
  desc: string;
}

export default function MilestoneTimeline() {
  const milestones: Milestone[] = useMemo(() => {
    const ms: Milestone[] = [];
    let bal = STARTING_SAVINGS;

    ms.push({ label: "Plan Begins", date: "Jul 2026", balance: STARTING_SAVINGS, color: indigo, icon: "🚀", desc: "Starting savings: $12,500" });

    const thresholds = [
      { amount: 25000, label: "$25K Savings", icon: "💰", color: teal },
      { amount: 50000, label: "$50K Savings", icon: "🏦", color: teal },
      { amount: 75000, label: "$75K Savings", icon: "📈", color: teal },
      { amount: 100000, label: "$100K Savings", icon: "🎯", color: teal },
    ];
    let threshIdx = 0;

    for (const md of ALL_MONTHS) {
      bal += md.netMonthly;
      const label = `${md.month.slice(0, 3)} ${md.year}`;

      while (threshIdx < thresholds.length && bal >= thresholds[threshIdx].amount) {
        const t = thresholds[threshIdx];
        ms.push({ label: t.label, date: label, balance: Math.round(bal), color: t.color, icon: t.icon, desc: `Balance reaches ${formatCurrency(t.amount)}` });
        threshIdx++;
      }

      if (md.year === 2028 && md.monthIndex === 0) {
        ms.push({ label: "Raven Starts LPN School", date: label, balance: Math.round(bal), color: amber, icon: "🎓", desc: "2-year LPN program begins" });
      }
      if (md.year === 2030 && md.monthIndex === 0) {
        ms.push({ label: "Raven Starts RN School", date: label, balance: Math.round(bal), color: amber, icon: "🏥", desc: "2-year RN program begins" });
      }
    }

    const lastYD = YEAR_DATA[YEAR_DATA.length - 1];
    ms.push({ label: "Plan Complete", date: "Dec 2031", balance: Math.round(lastYD.endSavings), color: indigo, icon: "✅", desc: `Projected balance: ${formatCurrency(lastYD.endSavings)}` });
    ms.push({ label: "Raven Returns to Work", date: "Jan 2032", balance: Math.round(lastYD.endSavings), color: amber, icon: "👩‍⚕️", desc: "Nursing career begins — income increases significantly" });

    return ms.sort((a, b) => {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const parseDate = (d: string) => { const [mo, yr] = d.split(" "); return parseInt(yr) * 12 + months.indexOf(mo); };
      return parseDate(a.date) - parseDate(b.date);
    });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span style={{ fontSize: 22 }}>🗓️</span>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.01 240)" }}>Milestone Timeline</h2>
        </div>
        <p className="text-sm text-muted-foreground">Key financial and life events across your 5.5-year plan.</p>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5" style={{ background: "oklch(0.9 0.005 240)" }} />
        <div className="space-y-4">
          {milestones.map((ms, i) => (
            <div key={i} className="relative flex gap-5 items-start">
              <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                style={{ background: "white", border: `2px solid ${ms.color}` }}>
                {ms.icon}
              </div>
              <div className="flex-1 rounded-2xl p-4 mt-1" style={{ background: "white", border: "1px solid oklch(0.92 0.005 240)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>{ms.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.005 240)" }}>{ms.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold" style={{ color: ms.color }}>{ms.date}</p>
                    <p className="text-xs number-display mt-0.5" style={{ color: "oklch(0.45 0.005 240)" }}>{formatCurrency(ms.balance)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
