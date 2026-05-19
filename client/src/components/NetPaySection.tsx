/**
 * NetPaySection — Blueprint Financial Dashboard
 * Pay rate reference table for Ryan and Raven across all years
 */

import {
  formatCurrency,
  grossMonthly,
  HRS_MO,
  HRS_WK,
  HRS_YR,
  netMonthly,
  RAVEN_RATE,
  RYAN_RATE,
  TAX_RATE,
} from "@/lib/financialData";
import { GraduationCap } from "lucide-react";

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031];

export default function NetPaySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.15 0.01 240)" }}
        >
          Pay Rate Calculator
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gross and net pay by year for Ryan and Raven. Tax rate: {(TAX_RATE * 100).toFixed(0)}% · {HRS_WK} hrs/week
        </p>
      </div>

      {/* Ryan */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-3"
          style={{ background: "var(--income-light)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--income)", color: "white" }}
          >
            R
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--income)" }}>
              Ryan
            </h3>
            <p className="text-xs text-muted-foreground">Hourly employee · expected raises each year</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "oklch(0.97 0.003 240)" }}>
                {["Year", "Hourly Rate", "Weekly Gross", "Weekly Net", "Monthly Gross", "Monthly Net", "Annual Gross", "Annual Net"].map((h) => (
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
              {YEARS.map((year, i) => {
                const rate = RYAN_RATE[year];
                const wkGross = HRS_WK * rate;
                const wkNet = wkGross * (1 - TAX_RATE);
                const moGross = grossMonthly(rate);
                const moNet = netMonthly(rate);
                const yrGross = HRS_YR * rate;
                const yrNet = yrGross * (1 - TAX_RATE);
                return (
                  <tr
                    key={year}
                    className="data-row"
                    style={{
                      background: i % 2 === 0 ? "white" : "oklch(0.985 0.002 240)",
                      borderBottom: "1px solid oklch(0.93 0.004 240)",
                    }}
                  >
                    <td className="px-4 py-2.5 font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{year}</td>
                    <td className="px-4 py-2.5 font-bold number-display" style={{ color: "var(--income)" }}>${rate}/hr</td>
                    <td className="px-4 py-2.5 number-display">{formatCurrency(wkGross)}</td>
                    <td className="px-4 py-2.5 number-display positive">{formatCurrency(wkNet)}</td>
                    <td className="px-4 py-2.5 number-display">{formatCurrency(moGross)}</td>
                    <td className="px-4 py-2.5 font-semibold number-display positive">{formatCurrency(moNet)}</td>
                    <td className="px-4 py-2.5 number-display">{formatCurrency(yrGross)}</td>
                    <td className="px-4 py-2.5 font-bold number-display positive">{formatCurrency(yrNet)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raven */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-3"
          style={{ background: "oklch(0.94 0.04 220)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "oklch(0.45 0.18 220)", color: "white" }}
          >
            R
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.35 0.18 220)" }}>
              Raven
            </h3>
            <p className="text-xs text-muted-foreground">Works 2026–2027 · LPN school 2028–2029 · RN school 2030–2031</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "oklch(0.97 0.003 240)" }}>
                {["Year", "Status", "Hourly Rate", "Weekly Gross", "Weekly Net", "Monthly Gross", "Monthly Net", "Annual Gross", "Annual Net"].map((h) => (
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
              {YEARS.map((year, i) => {
                const rate = RAVEN_RATE[year];
                const inSchool = rate === 0;
                const schoolLabel = year <= 2029 ? `LPN Yr ${year - 2027}` : `RN Yr ${year - 2029}`;
                const wkGross = inSchool ? 0 : HRS_WK * rate;
                const wkNet = wkGross * (1 - TAX_RATE);
                const moGross = inSchool ? 0 : grossMonthly(rate);
                const moNet = inSchool ? 0 : netMonthly(rate);
                const yrGross = inSchool ? 0 : HRS_YR * rate;
                const yrNet = yrGross * (1 - TAX_RATE);
                return (
                  <tr
                    key={year}
                    className="data-row"
                    style={{
                      background: inSchool ? "var(--school-light)" : i % 2 === 0 ? "white" : "oklch(0.985 0.002 240)",
                      borderBottom: "1px solid oklch(0.93 0.004 240)",
                    }}
                  >
                    <td className="px-4 py-2.5 font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{year}</td>
                    <td className="px-4 py-2.5">
                      {inSchool ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "var(--school)", color: "white" }}
                        >
                          <GraduationCap size={11} />
                          {schoolLabel}
                        </span>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "oklch(0.94 0.04 220)", color: "oklch(0.35 0.18 220)" }}
                        >
                          Working
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-bold number-display" style={{ color: inSchool ? "oklch(0.6 0.1 65)" : "oklch(0.45 0.18 220)" }}>
                      {inSchool ? "—" : `$${rate}/hr`}
                    </td>
                    <td className="px-4 py-2.5 number-display">{inSchool ? "—" : formatCurrency(wkGross)}</td>
                    <td className="px-4 py-2.5 number-display" style={{ color: inSchool ? "oklch(0.6 0.1 65)" : "var(--income)" }}>
                      {inSchool ? "—" : formatCurrency(wkNet)}
                    </td>
                    <td className="px-4 py-2.5 number-display">{inSchool ? "—" : formatCurrency(moGross)}</td>
                    <td className="px-4 py-2.5 font-semibold number-display" style={{ color: inSchool ? "oklch(0.6 0.1 65)" : "var(--income)" }}>
                      {inSchool ? "—" : formatCurrency(moNet)}
                    </td>
                    <td className="px-4 py-2.5 number-display">{inSchool ? "—" : formatCurrency(yrGross)}</td>
                    <td className="px-4 py-2.5 font-bold number-display" style={{ color: inSchool ? "oklch(0.6 0.1 65)" : "var(--income)" }}>
                      {inSchool ? "—" : formatCurrency(yrNet)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax note */}
      <div
        className="rounded-lg p-4 text-sm border"
        style={{ background: "oklch(0.97 0.003 240)", borderColor: "oklch(0.91 0.005 240)" }}
      >
        <p className="font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tax Assumptions</p>
        <p className="text-muted-foreground">
          All net pay figures use a flat <strong>22% effective tax rate</strong>. Actual take-home may vary based on
          deductions, withholding elections, and filing status. Business income is shown as net (after business expenses).
          Annual figures assume 52 weeks / 12 months per year at 40 hours per week.
        </p>
      </div>
    </div>
  );
}
