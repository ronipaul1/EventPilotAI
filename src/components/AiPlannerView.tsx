import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  PieChart,
  CheckSquare,
  Clock,
  Users,
  Utensils,
  Palette,
  Lightbulb,
  Save,
  CheckCircle2,
  Edit2,
  Plus,
} from 'lucide-react';
import type {
  EventItem,
  GeneratedAiPlan,
} from '../types';

interface AiPlannerViewProps {
  event: EventItem | null;
  plan: GeneratedAiPlan | null;
  isLoading: boolean;
  onGeneratePlan: () => Promise<void>;
  onRegenerateSection: (section: string, customInstructions: string) => Promise<void>;
  onSaveEditedPlan: (plan: GeneratedAiPlan) => Promise<void>;
  onSyncBudgetToExpenses: (budgetDistribution: GeneratedAiPlan['budgetDistribution']) => Promise<void>;
  onImportTasks: (tasks: GeneratedAiPlan['taskChecklist']) => Promise<void>;
  onImportTimeline: (milestones: GeneratedAiPlan['preparationMilestones'], dayOf: GeneratedAiPlan['dayOfSchedule']) => Promise<void>;
  onImportVendors: (vendors: GeneratedAiPlan['vendorRequirements']) => Promise<void>;
  onNavigateToEvents?: () => void;
}

export const AiPlannerView: React.FC<AiPlannerViewProps> = ({
  event,
  plan,
  isLoading,
  onGeneratePlan,
  onRegenerateSection,
  onSaveEditedPlan,
  onSyncBudgetToExpenses,
  onImportTasks,
  onImportTimeline,
  onImportVendors,
  onNavigateToEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'milestones' | 'tasks' | 'vendors' | 'dayOf' | 'decor' | 'catering'>('overview');
  const [regenModalSection, setRegenModalSection] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPlan, setEditedPlan] = useState<GeneratedAiPlan | null>(plan);

  React.useEffect(() => {
    setEditedPlan(plan);
  }, [plan]);

  if (!event) {
    return (
      <div className="py-20 text-center max-w-md mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Event Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Please select or create an event from the top navigation to generate an AI master blueprint.
        </p>
        {onNavigateToEvents && (
          <button
            type="button"
            onClick={onNavigateToEvents}
            className="mt-5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            Go to My Events
          </button>
        )}
      </div>
    );
  }

  const handleOpenRegenModal = (section: string) => {
    setRegenModalSection(section);
    setCustomInstructions('');
  };

  const handleConfirmRegenerate = async () => {
    if (!regenModalSection) return;
    setIsRegenerating(true);
    try {
      await onRegenerateSection(regenModalSection, customInstructions);
      setRegenModalSection(null);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSyncBudget = async () => {
    if (!plan?.budgetDistribution) return;
    setSyncFeedback('Syncing budget to expenses ledger...');
    await onSyncBudgetToExpenses(plan.budgetDistribution);
    setSyncFeedback('Budget categories successfully synced to Ledger!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSyncTasks = async () => {
    if (!plan?.taskChecklist) return;
    setSyncFeedback('Importing tasks into smart checklist...');
    await onImportTasks(plan.taskChecklist);
    setSyncFeedback('All AI tasks imported to checklist!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSyncTimeline = async () => {
    if (!plan) return;
    setSyncFeedback('Importing timeline & schedule...');
    await onImportTimeline(plan.preparationMilestones || [], plan.dayOfSchedule || []);
    setSyncFeedback('Timeline and Day-Of Schedule synced!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSyncVendors = async () => {
    if (!plan?.vendorRequirements) return;
    setSyncFeedback('Importing vendor ledger...');
    await onImportVendors(plan.vendorRequirements);
    setSyncFeedback('Vendors imported to coordination CRM!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSaveEdits = async () => {
    if (editedPlan) {
      await onSaveEditedPlan(editedPlan);
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gemini is Architecting Your Event Blueprint</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Balancing {event.currency} {event.totalBudget.toLocaleString()} budget across {event.guestCount} guests, crafting day-of itineraries, vendor checklists, and bespoke decoration themes...
        </p>
        <div className="w-full bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="bg-amber-500 h-full rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-16 text-center max-w-xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Generate Your Master AI Event Plan</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          EventPilot AI utilizes Google&apos;s advanced Gemini model to construct a bespoke master plan tailored to your {event.category} celebration, constraints, and guest count.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGeneratePlan}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Master Blueprint with Gemini</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {syncFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              Gemini AI Structured Blueprint
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Estimated Ledger &bull; Not Final Bookings
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Master Event Plan & Strategy
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleSaveEdits}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Edits</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Plan</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGeneratePlan}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-805 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate All</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation for Plan Sections */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {[
          { id: 'overview', label: 'Overview', icon: Lightbulb },
          { id: 'budget', label: 'Budget Allocation', icon: PieChart },
          { id: 'milestones', label: 'Milestones', icon: Clock },
          { id: 'tasks', label: 'Task Checklist', icon: CheckSquare },
          { id: 'vendors', label: 'Vendor Guide', icon: Users },
          { id: 'dayOf', label: 'Day-Of Schedule', icon: Clock },
          { id: 'decor', label: 'Decor Concepts', icon: Palette },
          { id: 'catering', label: 'Catering & Menu', icon: Utensils },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all font-medium ${
                isActive
                  ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION CONTENT */}

      {/* 1. Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Executive Vision & Pacing</span>
              </h3>
              <button
                type="button"
                onClick={() => handleOpenRegenModal('overview')}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate Overview
              </button>
            </div>

            {isEditing ? (
              <textarea
                rows={6}
                value={editedPlan?.overview || ''}
                onChange={(e) =>
                  setEditedPlan(editedPlan ? { ...editedPlan, overview: e.target.value } : null)
                }
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            ) : (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {plan.overview}
              </p>
            )}
          </div>

          {/* Strategic Recommendations */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>High-Impact Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.personalizedRecommendations?.map((rec, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Budget Allocation */}
      {activeTab === 'budget' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-500" />
                <span>AI Recommended Budget Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculated to match your {event.currency} {event.totalBudget.toLocaleString()} total target
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncBudget}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sync to Budget Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenRegenModal('budgetDistribution')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title="Regenerate Budget"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {plan.budgetDistribution?.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{item.category}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      {item.percentage}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm sm:text-right">
                  {event.currency} {item.suggestedAmount?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Milestones */}
      {activeTab === 'milestones' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Preparation Schedule & Milestones</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chronological checklist leading up to the celebration</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncTimeline}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import to Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenRegenModal('preparationMilestones')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {plan.preparationMilestones?.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
              >
                <div className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  {m.targetDateOffsetDays >= 0
                    ? `Day ${m.targetDateOffsetDays}`
                    : `${Math.abs(m.targetDateOffsetDays)} Days Before`}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{m.title}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                        m.priority === 'high' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Task Checklist */}
      {activeTab === 'tasks' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                <span>Detailed Action Checklist ({plan.taskChecklist?.length || 0} tasks)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Action items across venues, food, decor, and invites</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncTasks}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import to Smart Checklist</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenRegenModal('taskChecklist')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {plan.taskChecklist?.map((task, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">{task.title}</span>
                    <span className="text-[10px] text-slate-400">
                      ~{task.suggestedDaysBeforeEvent} days before
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Vendor Guide */}
      {activeTab === 'vendors' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Recommended Vendor Requirements</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estimated costs and pro negotiation questions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncVendors}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import to Vendors CRM</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenRegenModal('vendorRequirements')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.vendorRequirements?.map((v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{v.name}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold">
                    ~{event.currency} {v.estimatedCost?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{v.category}</span>
                  <span>Priority: {v.priority}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200 dark:border-slate-900">
                  &ldquo;{v.tips}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Day-Of Schedule */}
      {activeTab === 'dayOf' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Day-Of Run of Show Schedule</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Precise timeline for coordinators, hosts, and vendors</p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenRegenModal('dayOfSchedule')}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {plan.dayOfSchedule?.map((slot, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-4"
              >
                <div className="font-mono text-amber-600 dark:text-amber-400 font-bold text-xs whitespace-nowrap pt-0.5">
                  {slot.time}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{slot.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{slot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Decor Concepts */}
      {activeTab === 'decor' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Decoration & Visual Aesthetic Themes</span>
            </h3>
            <button
              type="button"
              onClick={() => handleOpenRegenModal('decorationIdeas')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate Decor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.decorationIdeas?.map((idea, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-700 dark:text-amber-300">Concept #{idx + 1}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{idea}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Catering & Menu */}
      {activeTab === 'catering' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-500" />
              <span>Catering, Beverage & Dietary Strategy</span>
            </h3>
            <button
              type="button"
              onClick={() => handleOpenRegenModal('cateringSuggestions')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate Menu
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.cateringSuggestions?.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">Menu Proposal #{idx + 1}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regenerate Section Modal with Custom Instructions */}
      {regenModalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Regenerate Section: <span className="text-amber-600 dark:text-amber-400 capitalize">{regenModalSection}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add any specific constraints, preferences, or adjustments for Gemini:
            </p>

            <textarea
              rows={3}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. 'Make it more rustic and cost-effective', or 'Add a live saxophone element'..."
              className="w-full mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegenModalSection(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRegenerating}
                onClick={handleConfirmRegenerate}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isRegenerating ? 'Generating...' : 'Regenerate Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
