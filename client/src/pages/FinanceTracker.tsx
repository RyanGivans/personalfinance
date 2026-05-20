import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Row = { id: string; name: string; amount: number };
type Debt = { id: string; name: string; balance: number; limit: number; min: number };
type Goal = { id: string; name: string; current: number; target: number };
type Data = {
  cash: number;
  checking: number;
  income: Row[];
  expenses: Row[];
  debts: Debt[];
  goals: Goal[];
  currentExtraDebt: number;
  goalExtraDebt: number;
  currentSavings: number;
  goalSavings: number;
};

const key = "finance-tracker-v2";
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const id = () => Math.random().toString(36).slice(2, 9);

const starter: Data = {
  cash: 17000,
  checking: 2500,
  income: [
    { id: id(), name: "Ryan income", amount: 5833 },
    { id: id(), name: "Roommates", amount: 1100 },
  ],
  expenses: [
    { id: id(), name: "Housing", amount: 2200 },
    { id: id(), name: "Utilities", amount: 350 },
    { id: id(), name: "Food", amount: 700 },
    { id: id(), name: "Cars / gas / insurance", amount: 700 },
    { id: id(), name: "Other spending", amount: 900 },
  ],
  debts: [
    { id: id(), name: "Chase", balance: 2952, limit: 6600, min: 90 },
    { id: id(), name: "Capital One Platinum", balance: 224, limit: 1100, min: 35 },
    { id: id(), name: "Capital One Quicksilver", balance: 323, limit: 1000, min: 35 },
    { id: id(), name: "PayPal", balance: 2264, limit: 5000, min: 70 },
    { id: id(), name: "Self", balance: 398, limit: 1825, min: 35 },
  ],
  goals: [
    { id: id(), name: "Emergency fund", current: 17000, target: 30000 },
    { id: id(), name: "Move cushion", current: 0, target: 8000 },
    { id: id(), name: "House / business fund", current: 0, target: 50000 },
  ],
  currentExtraDebt: 250,
  goalExtraDebt: 900,
  currentSavings: 300,
  goalSavings: 1200,
};

function total(rows: Row[]) { return rows.reduce((s, r) => s + Number(r.amount || 0), 0); }
function cardClass() { return "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"; }
function inputClass() { return "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"; }
function num(value: number, onChange: (n: number) => void) {
  return <input className={inputClass()} type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />;
}

export default function FinanceTracker() {
  const [data, setData] = useState<Data>(() => {
    try { return JSON.parse(localStorage.getItem(key) || "") || starter; } catch { return starter; }
  });

  useEffect(() => { localStorage.setItem(key, JSON.stringify(data)); }, [data]);

  const calc = useMemo(() => {
    const income = total(data.income);
    const expenses = total(data.expenses);
    const debt = data.debts.reduce((s, d) => s + Number(d.balance || 0), 0);
    const limits = data.debts.reduce((s, d) => s + Number(d.limit || 0), 0);
    const mins = data.debts.reduce((s, d) => s + Number(d.min || 0), 0);
    const goalNow = data.goals.reduce((s, g) => s + Number(g.current || 0), 0);
    const goalTarget = data.goals.reduce((s, g) => s + Number(g.target || 0), 0);
    const currentLeft = income - expenses - mins - data.currentExtraDebt - data.currentSavings;
    const goalLeft = income - expenses - mins - data.goalExtraDebt - data.goalSavings;
    const currentFive = goalNow + data.currentSavings * 60 - Math.max(0, debt - (mins + data.currentExtraDebt) * 60);
    const goalFive = goalNow + data.goalSavings * 60 - Math.max(0, debt - (mins + data.goalExtraDebt) * 60);
    return { income, expenses, debt, limits, mins, goalNow, goalTarget, currentLeft, goalLeft, currentFive, goalFive, utilization: limits ? debt / limits : 0 };
  }, [data]);

  const updateRow = (group: "income" | "expenses", row: Row) => setData(d => ({ ...d, [group]: d[group].map(r => r.id === row.id ? row : r) }));
  const updateDebt = (debt: Debt) => setData(d => ({ ...d, debts: d.debts.map(x => x.id === debt.id ? debt : x) }));
  const updateGoal = (goal: Goal) => setData(d => ({ ...d, goals: d.goals.map(x => x.id === goal.id ? goal : x) }));

  const nextMove = calc.currentLeft < 0
    ? "You are negative this month. Fix the present before pushing harder on the 5-year plan."
    : calc.utilization > 0.3
      ? "Credit utilization is the pressure point. Aim extra money at card balances first."
      : "You have room to plan. Push extra cash toward savings goals and the 5-year path.";

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-200">Finance tracker</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Ryan & Raven — where are we right now?</h1>
          <p className="mt-2 max-w-3xl text-slate-300">The focus is today first. Edit anything. Your numbers save in this browser. The 5-year goal is now a comparison layer, not the whole dashboard.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Available money" value={usd.format(data.cash + data.checking)} note="Cash + checking" />
          <Stat label="Monthly left" value={usd.format(calc.currentLeft)} note="After bills, debt, and savings" bad={calc.currentLeft < 0} />
          <Stat label="Total debt" value={usd.format(calc.debt)} note={`${pct.format(calc.utilization)} utilization`} bad={calc.utilization > 0.3} />
          <Stat label="5-year gap" value={usd.format(calc.goalFive - calc.currentFive)} note="Goal path advantage" />
        </section>

        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Best next move</p>
          <p className="mt-2 text-lg font-bold text-blue-950">{nextMove}</p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <section className={cardClass()}>
              <h2 className="text-xl font-bold">Right now</h2>
              <p className="mb-4 text-sm text-slate-500">This is the main tracker: what you have today.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">Cash on hand{num(data.cash, n => setData(d => ({ ...d, cash: n })))}</label>
                <label className="text-sm font-semibold">Checking{num(data.checking, n => setData(d => ({ ...d, checking: n })))}</label>
              </div>
            </section>

            <MoneyList title="Monthly income" rows={data.income} total={calc.income} add={() => setData(d => ({ ...d, income: [...d.income, { id: id(), name: "New income", amount: 0 }] }))} remove={(rid) => setData(d => ({ ...d, income: d.income.filter(r => r.id !== rid) }))} update={r => updateRow("income", r)} />
            <MoneyList title="Monthly expenses" rows={data.expenses} total={calc.expenses} add={() => setData(d => ({ ...d, expenses: [...d.expenses, { id: id(), name: "New expense", amount: 0 }] }))} remove={(rid) => setData(d => ({ ...d, expenses: d.expenses.filter(r => r.id !== rid) }))} update={r => updateRow("expenses", r)} />

            <section className={cardClass()}>
              <div className="mb-4 flex items-center justify-between">
                <div><h2 className="text-xl font-bold">Debt tracker</h2><p className="text-sm text-slate-500">Balances, limits, payments, and utilization.</p></div>
                <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white" onClick={() => setData(d => ({ ...d, debts: [...d.debts, { id: id(), name: "New debt", balance: 0, limit: 0, min: 0 }] }))}><Plus size={15} /></button>
              </div>
              <div className="space-y-3">
                {data.debts.map(debt => <DebtRow key={debt.id} debt={debt} update={updateDebt} remove={() => setData(d => ({ ...d, debts: d.debts.filter(x => x.id !== debt.id) }))} />)}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className={cardClass()}>
              <h2 className="text-xl font-bold">Current path vs goal path</h2>
              <p className="mb-4 text-sm text-slate-500">The 5-year plan is still here, but it reacts to the numbers you enter today.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">Current extra debt/month{num(data.currentExtraDebt, n => setData(d => ({ ...d, currentExtraDebt: n })))}</label>
                <label className="text-sm font-semibold">Goal extra debt/month{num(data.goalExtraDebt, n => setData(d => ({ ...d, goalExtraDebt: n })))}</label>
                <label className="text-sm font-semibold">Current savings/month{num(data.currentSavings, n => setData(d => ({ ...d, currentSavings: n })))}</label>
                <label className="text-sm font-semibold">Goal savings/month{num(data.goalSavings, n => setData(d => ({ ...d, goalSavings: n })))}</label>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Stat label="Current 5-year" value={usd.format(calc.currentFive)} note="Savings minus debt" />
                <Stat label="Goal 5-year" value={usd.format(calc.goalFive)} note={`Leaves ${usd.format(calc.goalLeft)}/mo`} bad={calc.goalLeft < 0} />
              </div>
            </section>

            <section className={cardClass()}>
              <div className="mb-4 flex items-center justify-between">
                <div><h2 className="text-xl font-bold">Savings goals</h2><p className="text-sm text-slate-500">Edit yearly or 5-year targets here.</p></div>
                <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white" onClick={() => setData(d => ({ ...d, goals: [...d.goals, { id: id(), name: "New goal", current: 0, target: 0 }] }))}><Plus size={15} /></button>
              </div>
              <div className="space-y-3">
                {data.goals.map(goal => <GoalRow key={goal.id} goal={goal} update={updateGoal} remove={() => setData(d => ({ ...d, goals: d.goals.filter(x => x.id !== goal.id) }))} />)}
              </div>
            </section>

            <section className={cardClass()}>
              <h2 className="text-xl font-bold">5-year snapshot</h2>
              <div className="mt-4 space-y-3">
                {[1,2,3,4,5].map(year => {
                  const current = calc.goalNow + data.currentSavings * 12 * year - Math.max(0, calc.debt - (calc.mins + data.currentExtraDebt) * 12 * year);
                  const goal = calc.goalNow + data.goalSavings * 12 * year - Math.max(0, calc.debt - (calc.mins + data.goalExtraDebt) * 12 * year);
                  return <div key={year} className="rounded-xl bg-slate-50 p-3"><div className="font-bold">Year {year}</div><div className="text-sm text-slate-600">Current: {usd.format(current)} · Goal: {usd.format(goal)} · Gap: {usd.format(goal-current)}</div></div>;
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, note, bad = false }: { label: string; value: string; note: string; bad?: boolean }) {
  return <div className={`rounded-2xl p-4 shadow-sm ${bad ? "bg-rose-50 text-rose-900" : "bg-white text-slate-900"}`}><p className="text-xs font-bold uppercase tracking-wide opacity-60">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="text-xs opacity-70">{note}</p></div>;
}

function MoneyList({ title, rows, total, add, remove, update }: { title: string; rows: Row[]; total: number; add: () => void; remove: (id: string) => void; update: (row: Row) => void }) {
  return <section className={cardClass()}><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">{title}</h2><p className="text-sm text-slate-500">Total: <b>{usd.format(total)}</b></p></div><button onClick={add} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white"><Plus size={15} /></button></div><div className="space-y-3">{rows.map(row => <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_160px_40px]"><input className={inputClass()} value={row.name} onChange={e => update({ ...row, name: e.target.value })} />{num(row.amount, n => update({ ...row, amount: n }))}<button className="text-rose-600" onClick={() => remove(row.id)}><Trash2 size={16} /></button></div>)}</div></section>;
}

function DebtRow({ debt, update, remove }: { debt: Debt; update: (d: Debt) => void; remove: () => void }) {
  const use = debt.limit ? debt.balance / debt.limit : 0;
  return <div className="rounded-xl border border-slate-200 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_120px_120px_120px_40px]"><input className={inputClass()} value={debt.name} onChange={e => update({ ...debt, name: e.target.value })} />{num(debt.balance, n => update({ ...debt, balance: n }))}{num(debt.limit, n => update({ ...debt, limit: n }))}{num(debt.min, n => update({ ...debt, min: n }))}<button className="text-rose-600" onClick={remove}><Trash2 size={16} /></button></div><p className={`mt-2 text-sm font-bold ${use > 0.3 ? "text-amber-700" : "text-emerald-700"}`}>Utilization: {pct.format(use)}</p></div>;
}

function GoalRow({ goal, update, remove }: { goal: Goal; update: (g: Goal) => void; remove: () => void }) {
  const progress = goal.target ? Math.min(goal.current / goal.target, 1) : 0;
  return <div className="rounded-xl border border-slate-200 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_120px_120px_40px]"><input className={inputClass()} value={goal.name} onChange={e => update({ ...goal, name: e.target.value })} />{num(goal.current, n => update({ ...goal, current: n }))}{num(goal.target, n => update({ ...goal, target: n }))}<button className="text-rose-600" onClick={remove}><Trash2 size={16} /></button></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${progress * 100}%` }} /></div><p className="mt-1 text-xs text-slate-500">{pct.format(progress)} complete</p></div>;
}
