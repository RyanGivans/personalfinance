/**
 * Sidebar — Blueprint Financial Dashboard
 * Dark slate sidebar with year navigation and summary stats
 */

import { formatCurrency, YEAR_DATA } from "@/lib/financialData";
import {
  BarChart3,
  BookOpen,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "2026", label: "2026", icon: BarChart3, sub: "Jul – Dec" },
  { id: "2027", label: "2027", icon: BarChart3, sub: "Full Year" },
  { id: "2028", label: "2028", icon: GraduationCap, sub: "Raven: LPN Yr 1", school: true },
  { id: "2029", label: "2029", icon: GraduationCap, sub: "Raven: LPN Yr 2", school: true },
  { id: "2030", label: "2030", icon: GraduationCap, sub: "Raven: RN Yr 1", school: true },
  { id: "2031", label: "2031", icon: GraduationCap, sub: "Raven: RN Yr 2", school: true },
  { id: "netpay", label: "Pay Rates", icon: DollarSign },
  { id: "expenses", label: "Expense Detail", icon: Wallet },
];

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  // Final savings balance
  const finalYear = YEAR_DATA[YEAR_DATA.length - 1];
  const endBalance = finalYear.endSavings;
  const startBalance = YEAR_DATA[0].startSavings;
  const totalGain = endBalance - startBalance;

  return (
    <aside
      className="flex flex-col h-full"
      style={{ background: "oklch(0.12 0.015 240)", color: "oklch(0.85 0.005 240)" }}
    >
      {/* Logo / Title */}
      <div
        className="px-5 py-6 border-b"
        style={{ borderColor: "oklch(0.22 0.01 240)" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--income)" }}
          >
            <TrendingUp size={16} color="white" />
          </div>
          <div>
            <h1
              className="text-sm font-semibold leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.96 0 0)" }}
            >
              Ryan &amp; Raven
            </h1>
            <p className="text-xs" style={{ color: "oklch(0.55 0.005 240)" }}>
              Financial Plan 2026–2031
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: "oklch(0.22 0.01 240)" }}
      >
        <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "oklch(0.45 0.005 240)" }}>
          5-Year Summary
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "oklch(0.6 0.005 240)" }}>Starting Savings</span>
            <span className="text-xs font-semibold number-display" style={{ color: "oklch(0.85 0 0)" }}>
              {formatCurrency(startBalance)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "oklch(0.6 0.005 240)" }}>Projected End</span>
            <span className="text-xs font-semibold number-display" style={{ color: "var(--savings)" }}>
              {formatCurrency(endBalance)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "oklch(0.6 0.005 240)" }}>Total Gain</span>
            <span
              className="text-xs font-semibold number-display"
              style={{ color: totalGain >= 0 ? "var(--income)" : "var(--expense)" }}
            >
              {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-medium mb-2 px-2 uppercase tracking-wider" style={{ color: "oklch(0.45 0.005 240)" }}>
          Navigate
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className="w-full text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "oklch(0.98 0 0)" : item.school ? "oklch(0.72 0.06 65)" : "oklch(0.65 0.005 240)",
                    background: isActive ? "oklch(0.22 0.02 240)" : "transparent",
                    borderLeft: isActive ? "2px solid var(--income)" : "2px solid transparent",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.18 0.015 240)";
                      (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.9 0 0)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = item.school ? "oklch(0.72 0.06 65)" : "oklch(0.65 0.005 240)";
                    }
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div>{item.label}</div>
                    {item.sub && (
                      <div className="text-xs mt-0.5" style={{ color: "oklch(0.5 0.005 240)", fontWeight: 400 }}>
                        {item.sub}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t"
        style={{ borderColor: "oklch(0.22 0.01 240)" }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={13} style={{ color: "oklch(0.45 0.005 240)" }} />
          <span className="text-xs" style={{ color: "oklch(0.45 0.005 240)" }}>
            Last updated May 2026
          </span>
        </div>
      </div>
    </aside>
  );
}
