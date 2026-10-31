import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Briefcase,
  Users,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Heart,
  Cake,
  PartyPopper,
  AlertCircle,
  Trash2,
  CheckSquare,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  EventItem,
  ExpenseItem,
  VendorItem,
  TaskItem,
  TimelineItem,
  GuestItem,
} from '../types';
import {
  calculateBudgetSummary,
  calculateDaysRemaining,
} from '../utils/budgetCalculations';
import { sortTimelineItems } from '../utils/timelineSorting';

interface OverviewPageProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  allExpenses: ExpenseItem[];
  allVendors: VendorItem[];
  allTasks: TaskItem[];
  activeTasks?: TaskItem[];
  allTimelines: TimelineItem[];
  allGuests: GuestItem[];
  onSelectEvent: (event: EventItem) => void;
  onNavigate: (page: string) => void;
  onOpenCreateWizard: () => void;
  onDeleteEvent?: (id: string) => Promise<void>;
  onUpdateTask?: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  onAddTask?: (task: TaskItem) => Promise<void>;
  onUpdateTimeline?: (id: string, updates: Partial<TimelineItem>) => Promise<void>;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  events,
  selectedEvent,
  allExpenses,
  allVendors,
  allTasks,
  activeTasks,
  allTimelines,
  allGuests,
  onSelectEvent,
  onNavigate,
  onOpenCreateWizard,
  onDeleteEvent,
  onUpdateTask,
  onAddTask,
  onUpdateTimeline,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Active event specific Timeline Schedule items (sorted by Timing)
  const eventScheduleItems = useMemo(() => {
    if (!selectedEvent) return [];
    const eventTl = allTimelines.filter((t) => t.eventId === selectedEvent.id);
    return sortTimelineItems(eventTl, 'timing_asc');
  }, [allTimelines, selectedEvent]);

  // Active event tasks
  const eventTasks = useMemo(() => {
    if (activeTasks && activeTasks.length > 0) return activeTasks;
    if (selectedEvent) {
      return allTasks.filter((t) => t.eventId === selectedEvent.id);
    }
    return [];
  }, [activeTasks, allTasks, selectedEvent]);

  // Primary Checklist is driven by Timeline & Schedule items (as requested by user)
  // If schedule items exist, they are the primary checklist items for event progress.
  // We combine schedule items and any auxiliary tasks.
  const checklistScheduleItems = eventScheduleItems;
  const scheduleCompleted = checklistScheduleItems.filter((s) => s.status === 'completed').length;
  const scheduleTotal = checklistScheduleItems.length;

  const totalActionItems = scheduleTotal > 0 ? scheduleTotal : eventTasks.length;
  const totalCompletedActionItems =
    scheduleTotal > 0
      ? scheduleCompleted
      : eventTasks.filter((t) => t.isCompleted).length;
  const pendingActionItems = totalActionItems - totalCompletedActionItems;
  const progressPercentage =
    totalActionItems > 0
      ? Math.round((totalCompletedActionItems / totalActionItems) * 100)
      : 0;

  // Toggle checkmark on Schedule item
  const handleToggleScheduleItem = async (item: TimelineItem) => {
    if (!onUpdateTimeline) return;
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    await onUpdateTimeline(item.id, { status: nextStatus });

    if (nextStatus === 'completed') {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#f59e0b', '#38bdf8'],
        });
      } catch {
        // Fallback
      }
    }
  };

  // Toggle checkmark on custom task
  const handleToggleTask = async (task: TaskItem) => {
    if (!onUpdateTask) return;
    const nextCompleted = !task.isCompleted;
    await onUpdateTask(task.id, { isCompleted: nextCompleted });

    if (nextCompleted) {
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#f59e0b', '#38bdf8'],
        });
      } catch {
        // Fallback
      }
    }
  };

  // If user has zero events: Display onboarding experience
  if (events.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8 animate-fade-in">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-slate-800 dark:text-slate-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Event Platform Initialized</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome to EventPilot AI
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Your centralized multi-event command center. Create, budget, coordinate, and execute weddings, birthdays, and community gatherings powered by Google Gemini and live Cloud Firestore persistence.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenCreateWizard}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Event</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Quick-Start Celebration Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Royal Wedding</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Ceremonies, sangeet, mandap decor, multi-course banquet, and family hospitality.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateWizard}
                className="mt-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
              >
                <span>Launch Wedding Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <Cake className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Milestone Birthday</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Themed backdrops, DJ entertainment, artisan cakes, guest gifts, and surprise tributes.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateWizard}
                className="mt-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
              >
                <span>Launch Birthday Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Community Festival</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Stage audio, vendor food stalls, municipal logistics, volunteer shifts, and permits.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateWizard}
                className="mt-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
              >
                <span>Launch Festival Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-event quantitative aggregations
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'planning' || e.status === 'confirmed');

  const totalBudgetAcrossAll = events.reduce((sum, e) => sum + (Number(e.totalBudget) || 0), 0);
  const totalActualExpenses = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalRemainingBudget = totalBudgetAcrossAll - totalActualExpenses;

  const activeEventBudget = selectedEvent
    ? calculateBudgetSummary(
        selectedEvent.totalBudget,
        allExpenses.filter((exp) => exp.eventId === selectedEvent.id)
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Overview Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time aggregate analytics across {totalEvents} organized event{totalEvents > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateWizard}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Events */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Events</span>
            <CalendarDays className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {activeEvents.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{totalEvents} total created</span>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              View All
            </button>
          </div>
        </div>

        {/* Total Portfolio Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Actual Expenses</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {events[0]?.currency || '₹'} {totalActualExpenses.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across {allExpenses.length} ledger line-items
          </div>
        </div>

        {/* Remaining Portfolio Budget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Remaining Budget</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`mt-2 text-2xl font-black font-mono ${
              totalRemainingBudget < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {events[0]?.currency || '₹'} {totalRemainingBudget.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            From {events[0]?.currency || '₹'} {totalBudgetAcrossAll.toLocaleString()} ceiling
          </div>
        </div>

        {/* Checklist Execution Metric Card Driven by Schedule Checkmarks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Checklist Execution</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {progressPercentage}%
            </span>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              {totalCompletedActionItems}/{totalActionItems} slots
            </span>
          </div>
          {/* Visual Progress Bar Track */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2 border border-slate-200 dark:border-slate-700/60">
            <div
              className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{pendingActionItems} pending items</span>
            <button
              type="button"
              onClick={() => onNavigate('checklist')}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              Smart Checklist &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* EVENT PROGRESS & SCHEDULE CHECKLIST CARD (Directly from Timeline & Schedule) */}
      {selectedEvent && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Event Execution Progress
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Live Schedule Checkmarks
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  How &apos;{selectedEvent.name}&apos; is Progressing
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Readiness status badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs ${
                  progressPercentage === 100
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : progressPercentage >= 50
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300'
                    : progressPercentage > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {progressPercentage === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>
                  {progressPercentage === 100
                    ? '100% Completed — All Set!'
                    : progressPercentage >= 50
                    ? `${progressPercentage}% Good Progress`
                    : progressPercentage > 0
                    ? `${progressPercentage}% Underway`
                    : '0% Planning Started'}
                </span>
              </span>

              <button
                type="button"
                onClick={() => onNavigate('checklist')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
                title="Go to Smart Checklist in navigation menu"
              >
                <span>Smart Checklist</span>
                <ArrowRight className="w-3 h-3 text-amber-500" />
              </button>
            </div>
          </div>

          {/* Large Animated Progress Bar Track */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Schedule & Checklist Execution:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {totalCompletedActionItems} of {totalActionItems} slots checked off
                </strong>
              </span>
              <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                {progressPercentage}%
              </span>
            </div>

            <div className="relative w-full bg-slate-100 dark:bg-slate-950 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800 shadow-inner">
              <div
                className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{totalCompletedActionItems} checked off</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{pendingActionItems} remaining pending</span>
              </span>
              <span className="flex items-center gap-1">
                <span>Also accessible via</span>
                <button
                  type="button"
                  onClick={() => onNavigate('checklist')}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Navigation Menu &gt; Smart Checklist
                </button>
              </span>
            </div>
          </div>

          {/* Schedule Checklist Items with Interactive Checkmarks (In Timing Order) */}
          {checklistScheduleItems.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Event Schedule Run of Show Checklist ({scheduleCompleted}/{scheduleTotal})
                </span>
                <span className="text-[10px] text-slate-400">
                  Click any checkmark to advance event progress
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {checklistScheduleItems.map((item, index) => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleScheduleItem(item)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isCompleted
                          ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Interactive Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-950'
                          }`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{index + 1}
                            </span>
                            <span
                              className={`text-xs block font-bold truncate ${
                                isCompleted
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {item.startTime && (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 px-1.5 py-0.2 rounded border border-amber-500/20">
                                <Clock className="w-2.5 h-2.5" />
                                <span>
                                  {item.startTime}
                                  {item.endTime ? ` – ${item.endTime}` : ''}
                                </span>
                              </span>
                            )}
                            <span
                              className={`text-[9px] uppercase px-1 rounded font-bold ${
                                item.priority === 'high'
                                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                  : item.priority === 'medium'
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isCompleted ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => onNavigate('timeline')}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Manage in Timeline & Schedule &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('checklist')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Open in Smart Checklist &rarr;</span>
                </button>
              </div>
            </div>
          ) : (
            /* Fallback to tasks or prompt to add to Timeline */
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-dashed border-amber-300 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    No Schedule Items in Timeline & Schedule Yet
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Add entries to your Timeline & Schedule (like Guest Arrival, Speeches, Lunch, etc.) and they will automatically populate as the check list progress right here!
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('timeline')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs flex-shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Go to Timeline & Schedule</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Your Events List vs Active Event Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Events Portfolio Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Your Event Portfolio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any celebration to set as active workspace
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Manage Events &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {events.map((evt) => {
              const countdown = calculateDaysRemaining(evt.eventDate);
              const isSelected = selectedEvent?.id === evt.id;
              const evtExpenses = allExpenses.filter((x) => x.eventId === evt.id);
              const evtSpent = evtExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {evt.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                        {evt.category}
                      </span>
                      <span>&bull;</span>
                      <span>{evt.location}</span>
                      <span>&bull;</span>
                      <span>{evt.guestCount} guests</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs sm:text-right">
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {evt.currency} {evtSpent.toLocaleString()} / {evt.totalBudget.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {countdown.label}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                        onNavigate('planner');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] hover:border-amber-500 transition-colors"
                    >
                      AI Planner
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Active Event Spotlight & Quick Actions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Active Event Spotlight
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                {selectedEvent ? selectedEvent.name : 'Select an Event'}
              </h3>
            </div>

            {selectedEvent ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Target Date:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedEvent.eventDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Budget Utilization:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {activeEventBudget?.utilizationPercentage || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Theme:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEvent.theme}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Workspace Navigation
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('planner')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('budget')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-sky-500" />
                      <span>Budget</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('guests')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Guests</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('checklist')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Checklist</span>
                    </button>
                  </div>
                </div>

                {onDeleteEvent && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedEvent.id)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete this Event</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Select an event to view spotlight details.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Event Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Celebration?</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete this event and all associated records?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteEvent && confirmDeleteId) {
                    await onDeleteEvent(confirmDeleteId);
                  }
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
