import React from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  Calendar,
  FileDown,
  PlusCircle,
  MapPin,
  PartyPopper,
  ArrowUpRight,
} from 'lucide-react';
import type {
  EventItem,
  ExpenseItem,
  VendorItem,
  TaskItem,
  TimelineItem,
} from '../types';
import {
  calculateBudgetSummary,
  calculateTaskProgress,
  calculateDaysRemaining,
} from '../utils/budgetCalculations';

interface DashboardViewProps {
  event: EventItem;
  expenses: ExpenseItem[];
  vendors: VendorItem[];
  tasks: TaskItem[];
  timelines: TimelineItem[];
  onNavigateTab: (tab: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddVendor: () => void;
  onOpenAddTask: () => void;
  onOpenChat: () => void;
  onExportPdf: () => void;
  onToggleTaskComplete: (task: TaskItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  event,
  expenses,
  vendors,
  tasks,
  timelines,
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddVendor,
  onOpenAddTask,
  onOpenChat,
  onExportPdf,
  onToggleTaskComplete,
}) => {
  const budgetSummary = calculateBudgetSummary(event.totalBudget, expenses);
  const taskProgress = calculateTaskProgress(tasks);
  const countdown = calculateDaysRemaining(event.eventDate);

  const confirmedVendorsCount = vendors.filter((v) => v.bookingStatus === 'Confirmed').length;
  const highPriorityTasks = tasks
    .filter((t) => !t.isCompleted && (t.priority === 'urgent' || t.priority === 'high'))
    .slice(0, 4);

  const upcomingMilestones = timelines.slice(0, 3);

  // Budget alert styling
  let budgetBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let budgetStatusText = 'Within Budget Allocation';
  if (budgetSummary.utilizationPercentage > 100) {
    budgetBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    budgetStatusText = `Budget Overrun by ${event.currency} ${Math.abs(budgetSummary.remainingBalance).toLocaleString()}`;
  } else if (budgetSummary.utilizationPercentage >= 85) {
    budgetBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    budgetStatusText = 'Budget Cap Nearing (~85%+)';
  }

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                {event.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {event.location}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {event.guestCount} Guests
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {event.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Theme: <span className="text-slate-200 font-medium">{event.theme}</span>
            </p>
          </div>

          {/* Countdown & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Countdown
              </span>
              <span className="text-sm font-extrabold text-amber-400">
                {countdown.label}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('ai-planner')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Master Plan</span>
            </button>

            <button
              type="button"
              onClick={onOpenChat}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Copilot Chat</span>
            </button>

            <button
              type="button"
              onClick={onExportPdf}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Download Master Event PDF"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Quantitative Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Budget Ceiling</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {event.currency} {budgetSummary.totalBudget.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{expenses.length} expense items</span>
            <button
              type="button"
              onClick={() => onNavigateTab('budget')}
              className="text-amber-400 hover:underline flex items-center gap-0.5"
            >
              Ledger <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Actual Expenses Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Actual Committed</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-sky-300">
            {event.currency} {budgetSummary.actualExpenses.toLocaleString()}
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  budgetSummary.utilizationPercentage > 100
                    ? 'bg-rose-500'
                    : budgetSummary.utilizationPercentage > 85
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                }`}
                style={{ width: `${Math.min(100, budgetSummary.utilizationPercentage)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {budgetSummary.utilizationPercentage}% of total budget utilized
            </span>
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Remaining Balance</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                budgetSummary.remainingBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            />
          </div>
          <div
            className={`mt-3 text-2xl font-black ${
              budgetSummary.remainingBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {event.currency} {budgetSummary.remainingBalance.toLocaleString()}
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${budgetBadgeColor}`}
            >
              {budgetStatusText}
            </span>
          </div>
        </div>

        {/* Task Completion Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {taskProgress.percentage}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {taskProgress.completed} of {taskProgress.total} done
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('checklist')}
              className="text-amber-400 hover:underline flex items-center gap-0.5"
            >
              Tasks <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Mid Section: Category Spending vs Urgent Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Budget Breakdown (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Budget Allocation Ledger</h2>
              <p className="text-xs text-slate-400">
                Expenditures grouped across standard celebration domains
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {Object.entries(budgetSummary.categoryBreakdown)
              .filter(([_, stats]) => stats.spent > 0 || stats.planned > 0)
              .map(([cat, stats]) => {
                const percentOfBudget =
                  budgetSummary.totalBudget > 0
                    ? Math.round((stats.spent / budgetSummary.totalBudget) * 100)
                    : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">
                        {cat} <span className="text-slate-500 font-normal">({stats.count} items)</span>
                      </span>
                      <span className="font-mono text-slate-300">
                        {event.currency} {stats.spent.toLocaleString()}{' '}
                        <span className="text-slate-500 text-[10px]">({percentOfBudget}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, percentOfBudget)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

            {expenses.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                No expense entries yet. Add your first line item or import AI recommendations.
              </div>
            )}
          </div>
        </div>

        {/* Priority Actions & High Priority Tasks (1 Col) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Priority Action Items</span>
                {highPriorityTasks.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </h2>
              <button
                type="button"
                onClick={onOpenAddTask}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                + Add Task
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {highPriorityTasks.length > 0 ? (
                highPriorityTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200 hover:border-slate-700 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTaskComplete(t)}
                      className="mt-0.5 w-4 h-4 rounded border border-slate-600 hover:border-amber-400 flex items-center justify-center transition-colors"
                    >
                      {t.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{t.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span
                          className={`uppercase font-bold ${
                            t.priority === 'urgent' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {t.priority}
                        </span>
                        {t.dueDate && <span>Due {t.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  All urgent items cleared! Great progress.
                </div>
              )}
            </div>
          </div>

          {/* Vendor Quick Status */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Vendor Status:</span>
              <span className="text-white font-bold">
                {confirmedVendorsCount} Confirmed / {vendors.length} Total
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('vendors')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Vendors</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
