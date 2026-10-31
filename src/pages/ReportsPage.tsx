import React from 'react';
import {
  FileText,
  FileDown,
  Printer,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
} from 'lucide-react';
import type {
  EventItem,
  ExpenseItem,
  VendorItem,
  TaskItem,
  TimelineItem,
  GuestItem,
  GeneratedAiPlan,
} from '../types';
import { calculateBudgetSummary, calculateTaskProgress } from '../utils/budgetCalculations';
import { generateEventPdfReport } from '../utils/pdfExport';

interface ReportsPageProps {
  event: EventItem | null;
  expenses: ExpenseItem[];
  vendors: VendorItem[];
  tasks: TaskItem[];
  timelines: TimelineItem[];
  guests: GuestItem[];
  aiPlan: GeneratedAiPlan | null;
  onNavigate: (page: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  event,
  expenses,
  vendors,
  tasks,
  timelines,
  guests,
  aiPlan,
  onNavigate,
}) => {
  if (!event) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <FileText className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          No Event Selected
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select or create an event to generate its comprehensive executive PDF dossier.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('events')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
        >
          Go to My Events
        </button>
      </div>
    );
  }

  const budgetSummary = calculateBudgetSummary(event.totalBudget, expenses);
  const taskProgress = calculateTaskProgress(tasks);

  const handleDownloadPdf = () => {
    generateEventPdfReport({
      event,
      expenses,
      vendors,
      tasks,
      timelines,
      aiPlan,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
            Official Documentation & Export
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Executive Event Planning Dossier
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive audit report covering financials, vendor contracts, guest lists, and AI recommendations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* Dossier Preview Container */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 print:p-0 print:border-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              EventPilot AI &bull; Master Planning Dossier
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {event.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span className="capitalize font-bold text-slate-700 dark:text-slate-300">
                {event.category}
              </span>
              <span>&bull;</span>
              <span>{event.location}</span>
              <span>&bull;</span>
              <span className="font-mono">{event.eventDate}</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div className="font-mono text-[10px] mt-0.5">Status: {event.status.toUpperCase()}</div>
          </div>
        </div>

        {/* Section 1: Financial Health Overview */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>1. Financial Ledger Summary</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Allocated Budget</span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {event.currency} {budgetSummary.totalBudget.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Actual Expenses</span>
              <div className="text-base font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                {event.currency} {budgetSummary.actualExpenses.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Remaining Liquidity</span>
              <div className={`text-base font-bold font-mono mt-0.5 ${budgetSummary.remainingBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {event.currency} {budgetSummary.remainingBalance.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Utilization</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {budgetSummary.utilizationPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Guest & Headcount Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>2. Guest & Catering Headcount</span>
          </h3>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400">Total Capacity Target:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 ml-2">{event.guestCount} Guests</span>
            </div>
            <div>
              <span className="text-slate-400">Logged RSVP Invitations:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 ml-2">{guests.length} Parties</span>
            </div>
            <div>
              <span className="text-slate-400">Confirmed Headcount:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-2">
                {guests.filter((g) => g.rsvpStatus === 'attending').reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0)} Attending
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Vendor Coordination Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-500" />
            <span>3. Vendor Coordination Status ({vendors.length} Vendors)</span>
          </h3>

          <div className="space-y-2">
            {vendors.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-400">
                No vendors currently logged for this event.
              </div>
            ) : (
              vendors.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{v.name}</span>
                    <span className="text-slate-400 ml-2">({v.category})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {event.currency} {(v.actualCost || v.estimatedCost || 0).toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {v.bookingStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4: Task Execution Progress */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>4. Checklist Execution Progress ({taskProgress.completed}/{taskProgress.total} Completed)</span>
          </h3>

          <div className="space-y-1.5 text-xs">
            {tasks.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${t.isCompleted ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className={t.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}>
                    {t.title}
                  </span>
                </div>
                {t.dueDate && <span className="font-mono text-[11px] text-slate-400">Due {t.dueDate}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: AI Recommendations */}
        {aiPlan && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>5. AI Strategic Guidance</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-line">
              {aiPlan.overview}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
