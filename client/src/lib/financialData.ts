/**
 * Blueprint Financial Dashboard — Data Layer
 * Design: Clean Technical Dashboard (Space Grotesk + DM Sans)
 * Colors: teal=income, rose=expenses, indigo=savings, amber=school years
 */

export const TAX_RATE = 0.22;
export const HRS_WK = 40;
export const HRS_YR = HRS_WK * 52;
export const HRS_MO = HRS_YR / 12;

export const STARTING_SAVINGS = 12500;

// Hourly rates by year (user-confirmed)
export const RYAN_RATE: Record<number, number> = {
  2026: 19,
  2027: 24,
  2028: 26,
  2029: 28,
  2030: 30,
  2031: 32,
};

// Raven: works 2026-2027, school 2028-2031
export const RAVEN_RATE: Record<number, number> = {
  2026: 18,
  2027: 22,
  2028: 0,
  2029: 0,
  2030: 0,
  2031: 0,
};

// Business net income by year
export const BIZ_INCOME: Record<number, number> = {
  2026: 1000,
  2027: 1200,
  2028: 1500,
  2029: 2000,
  2030: 2200,
  2031: 2500,
};

export const EXPENSE_CATS = [
  "Rent",
  "Utilities",
  "Food",
  "Car",
  "ENT Sub",
  "Bus Sub",
  "Phone",
  "Loans",
  "School",
  "Other",
] as const;

export type ExpenseCat = (typeof EXPENSE_CATS)[number];

export const EXPENSES: Record<number, Record<ExpenseCat, number>> = {
  2026: { Rent: 1100, Utilities: 314, Food: 800, Car: 727, "ENT Sub": 45, "Bus Sub": 166, Phone: 295, Loans: 415, School: 0, Other: 300 },
  2027: { Rent: 1100, Utilities: 314, Food: 800, Car: 727, "ENT Sub": 45, "Bus Sub": 166, Phone: 295, Loans: 415, School: 0, Other: 400 },
  2028: { Rent: 1100, Utilities: 314, Food: 800, Car: 727, "ENT Sub": 45, "Bus Sub": 166, Phone: 295, Loans: 415, School: 417, Other: 600 },
  2029: { Rent: 1100, Utilities: 314, Food: 800, Car: 200, "ENT Sub": 45, "Bus Sub": 166, Phone: 295, Loans: 415, School: 417, Other: 600 },
  2030: { Rent: 1100, Utilities: 314, Food: 800, Car: 200, "ENT Sub": 45, "Bus Sub": 166, Phone: 295, Loans: 415, School: 833, Other: 800 },
  2031: { Rent: 1100, Utilities: 314, Food: 800, Car: 200, "ENT Sub": 45, "Bus Sub": 166, Phone: 295, Loans: 415, School: 833, Other: 800 },
};

export const MONTHS_ALL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function netMonthly(hourly: number): number {
  if (hourly === 0) return 0;
  const gross = HRS_MO * hourly;
  return gross * (1 - TAX_RATE);
}

export function grossMonthly(hourly: number): number {
  return HRS_MO * hourly;
}

export interface MonthData {
  year: number;
  month: string;
  monthIndex: number; // 0-based
  ryanNet: number;
  ravenNet: number;
  bizIncome: number;
  totalIncome: number;
  expenses: Record<ExpenseCat, number>;
  totalExpenses: number;
  netMonthly: number;
  savingsBalance: number;
  ravenInSchool: boolean;
  schoolNote: string;
}

export interface YearData {
  year: number;
  months: MonthData[];
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  startSavings: number;
  endSavings: number;
  ryanAnnualNet: number;
  ravenAnnualNet: number;
  bizAnnualNet: number;
  ryanHourlyRate: number;
  ravenHourlyRate: number;
  ravenInSchool: boolean;
  numMonths: number;
}

function buildAllData(): { years: YearData[]; allMonths: MonthData[] } {
  const years: YearData[] = [];
  const allMonths: MonthData[] = [];
  let runningBalance = STARTING_SAVINGS;

  for (let year = 2026; year <= 2031; year++) {
    const startMonthIdx = year === 2026 ? 6 : 0; // July=6 for 2026
    const months: MonthData[] = [];
    const ravenInSchool = RAVEN_RATE[year] === 0;
    const ryanNet = netMonthly(RYAN_RATE[year]);
    const ravenNet = netMonthly(RAVEN_RATE[year]);
    const biz = BIZ_INCOME[year];
    const totalMonthInc = ryanNet + ravenNet + biz;
    const exp = EXPENSES[year];
    const totalMonthExp = Object.values(exp).reduce((a, b) => a + b, 0);
    const monthNet = totalMonthInc - totalMonthExp;

    const startSavings = runningBalance;

    for (let mi = startMonthIdx; mi < 12; mi++) {
      const prevBalance = runningBalance;
      runningBalance += monthNet;

      const md: MonthData = {
        year,
        month: MONTHS_ALL[mi],
        monthIndex: mi,
        ryanNet,
        ravenNet,
        bizIncome: biz,
        totalIncome: totalMonthInc,
        expenses: { ...exp },
        totalExpenses: totalMonthExp,
        netMonthly: monthNet,
        savingsBalance: runningBalance,
        ravenInSchool,
        schoolNote: ravenInSchool
          ? year <= 2029
            ? "Raven: LPN Program"
            : "Raven: RN Program"
          : "",
      };
      months.push(md);
      allMonths.push(md);
    }

    const numMonths = 12 - startMonthIdx;
    const yearInc = totalMonthInc * numMonths;
    const yearExp = totalMonthExp * numMonths;

    years.push({
      year,
      months,
      totalIncome: yearInc,
      totalExpenses: yearExp,
      netSavings: yearInc - yearExp,
      startSavings,
      endSavings: runningBalance,
      ryanAnnualNet: ryanNet * numMonths,
      ravenAnnualNet: ravenNet * numMonths,
      bizAnnualNet: biz * numMonths,
      ryanHourlyRate: RYAN_RATE[year],
      ravenHourlyRate: RAVEN_RATE[year],
      ravenInSchool,
      numMonths,
    });
  }

  return { years, allMonths };
}

export const { years: YEAR_DATA, allMonths: ALL_MONTHS } = buildAllData();

export function formatCurrency(val: number, compact = false): string {
  if (compact && Math.abs(val) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
}

// Expense category colors for charts
export const CAT_COLORS: Record<ExpenseCat, string> = {
  Rent: "#6366F1",
  Utilities: "#8B5CF6",
  Food: "#F59E0B",
  Car: "#EF4444",
  "ENT Sub": "#EC4899",
  "Bus Sub": "#3B82F6",
  Phone: "#06B6D4",
  Loans: "#F97316",
  School: "#10B981",
  Other: "#94A3B8",
};
