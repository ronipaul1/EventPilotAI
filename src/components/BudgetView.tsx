import React, { useState } from 'react';
import {
  DollarSign,
  PlusCircle,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  X,
  PieChart,
} from 'lucide-react';
import type {
  EventItem,
  ExpenseItem,
  ExpenseCategory,
  PaidStatus,
} from '../types';
import {
  calculateBudgetSummary,
  ALL_EXPENSE_CATEGORIES,
} from '../utils/budgetCalculations';

interface BudgetViewProps {
  event: EventItem | null;
  expenses: ExpenseItem[];
  onAddExpense: (expense: ExpenseItem) => Promise<void>;
  onUpdateExpense: (id: string, updates: Partial<ExpenseItem>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onNavigate?: (page: string) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  event,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Venue');
  const [amount, setAmount] = useState<number>(5000);
  const [plannedAmount, setPlannedAmount] = useState<number>(5000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidStatus, setPaidStatus] = useState<PaidStatus>('unpaid');
  const [notes, setNotes] = useState('');

  if (!event) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <DollarSign className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          No Event Selected
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select or create an event to track its budget and expenses ledger.
        </p>
      </div>
    );
  }

  const summary = calculateBudgetSummary(event.totalBudget, expenses);

  const filteredExpenses = expenses.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchStatus = selectedStatus === 'all' || item.paidStatus === selectedStatus;
    return matchCat && matchStatus;
  });

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setDescription('');
    setCategory('Venue');
    setAmount(10000);
    setPlannedAmount(10000);
    setDate(new Date().toISOString().split('T')[0]);
    setPaidStatus('unpaid');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setDescription(exp.description);
    setCategory(exp.category);
    setAmount(exp.amount);
    setPlannedAmount(exp.plannedAmount || exp.amount);
    setDate(exp.date);
    setPaidStatus(exp.paidStatus);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (editingExpense) {
      await onUpdateExpense(editingExpense.id, {
        description: description.trim(),
        category,
        amount: Number(amount) || 0,
        plannedAmount: Number(plannedAmount) || 0,
        date,
        paidStatus,
        notes: notes.trim(),
      });
    } else {
      const newExp: ExpenseItem = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventId: event.id,
        userId: event.userId,
        description: description.trim(),
        category,
        amount: Number(amount) || 0,
        plannedAmount: Number(plannedAmount) || 0,
        date,
        paidStatus,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onAddExpense(newExp);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Financial Health Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Budget Ceiling</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {event.currency} {summary.totalBudget.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Allocated baseline</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Actual Spent</span>
          <div className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {event.currency} {summary.actualExpenses.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Sum of recorded expenses</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Remaining Balance</span>
          <div
            className={`mt-2 text-2xl font-black font-mono ${
              summary.remainingBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {event.currency} {summary.remainingBalance.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {summary.remainingBalance < 0 ? 'Over budget' : 'Available balance'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Utilization Rate</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {summary.utilizationPercentage}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${
                summary.utilizationPercentage > 100
                  ? 'bg-rose-500'
                  : summary.utilizationPercentage > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, summary.utilizationPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-amber-500" />
          <span>Category Spending Distribution</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {ALL_EXPENSE_CATEGORIES.map((cat) => {
            const data = summary.categoryBreakdown[cat];
            const percentOfTotal =
              summary.totalBudget > 0 ? Math.round((data.spent / summary.totalBudget) * 100) : 0;

            return (
              <div
                key={cat}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {event.currency} {data.spent.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, percentOfTotal)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{data.count} entries</span>
                  <span>{percentOfTotal}% of total budget</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Expense Table & Filter Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Line-Item Ledger</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {filteredExpenses.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {ALL_EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="deposit_paid">Deposit Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No expenses found matching the active filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payment Status</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.description}</div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">{item.date}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.paidStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : item.paidStatus === 'deposit_paid'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {item.paidStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {event.currency} {item.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Venue booking deposit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {ALL_EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ({event.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Status</label>
                  <select
                    value={paidStatus}
                    onChange={(e) => setPaidStatus(e.target.value as PaidStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes / Invoice #</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes or receipt references"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
