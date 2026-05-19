/**
 * Dashboard — Blueprint Financial Dashboard
 * Main page: fixed sidebar + scrollable main content
 * Design: Clean Technical (Space Grotesk + DM Sans, teal/rose/indigo palette)
 */

import ActualTrackerSection from "@/components/ActualTrackerSection";
import ExpenseDetailSection from "@/components/ExpenseDetailSection";
import GoalTrackerSection from "@/components/GoalTrackerSection";
import MilestoneTimeline from "@/components/MilestoneTimeline";
import NetPaySection from "@/components/NetPaySection";
import OverviewSection from "@/components/OverviewSection";
import PostSchoolSection from "@/components/PostSchoolSection";
import Sidebar from "@/components/Sidebar";
import WhatIfSection from "@/components/WhatIfSection";
import YearSection from "@/components/YearSection";
import { YEAR_DATA } from "@/lib/financialData";
import { Menu, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type SectionId =
  | "overview"
  | "2026" | "2027" | "2028" | "2029" | "2030" | "2031"
  | "netpay" | "expenses"
  | "actual" | "whatif" | "goals" | "postschool" | "milestones";

const SECTION_LABELS: Record<SectionId, string> = {
  overview: "Overview",
  "2026": "2026", "2027": "2027", "2028": "2028",
  "2029": "2029", "2030": "2030", "2031": "2031",
  netpay: "Pay Rates",
  expenses: "Expenses",
  actual: "Actual Tracker",
  whatif: "What-If",
  goals: "Goal Tracker",
  postschool: "2032+ Projection",
  milestones: "Milestones",
};

const TOP_NAV: SectionId[] = ["overview", "2026", "2027", "2028", "2029", "2030", "2031", "netpay", "expenses"];

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback((section: string) => {
    setActiveSection(section as SectionId);
    setSidebarOpen(false);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const renderSection = () => {
    if (activeSection === "overview") return <OverviewSection />;
    if (activeSection === "netpay") return <NetPaySection />;
    if (activeSection === "expenses") return <ExpenseDetailSection />;
    if (activeSection === "actual") return <ActualTrackerSection />;
    if (activeSection === "whatif") return <WhatIfSection />;
    if (activeSection === "goals") return <GoalTrackerSection />;
    if (activeSection === "postschool") return <PostSchoolSection />;
    if (activeSection === "milestones") return <MilestoneTimeline />;

    const year = parseInt(activeSection);
    const yearData = YEAR_DATA.find((y) => y.year === year);
    if (yearData) return <YearSection yearData={yearData} />;

    return <OverviewSection />;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(0.975 0.003 240)" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0 h-full transition-transform duration-250 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.15)" }}
      >
        <Sidebar activeSection={activeSection} onNavigate={navigate} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b"
          style={{ background: "white", borderColor: "oklch(0.91 0.005 240)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.2 0.01 240)" }}>
                {SECTION_LABELS[activeSection] ?? "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground">Ryan &amp; Raven's Financial Plan</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {TOP_NAV.map((id) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors duration-150"
                  style={{
                    background: isActive ? "oklch(0.5 0.18 265)" : "transparent",
                    color: isActive ? "white" : "oklch(0.55 0.01 240)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.94 0.005 240)"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {SECTION_LABELS[id]}
                </button>
              );
            })}
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ padding: "2rem 2rem" }}>
          <div style={{ maxWidth: 1100 }}>
            {renderSection()}
          </div>
          <div style={{ height: "3rem" }} />
        </main>
      </div>
    </div>
  );
}
