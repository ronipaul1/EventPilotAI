import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Calendar,
  Search,
  CalendarDays,
  Clock,
  ArrowRight,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  EventItem,
  TaskItem,
  TimelineItem,
  TaskPriority,
} from '../types';
import { sortTimelineItems } from '../utils/timelineSorting';

interface ChecklistViewProps {
  event: EventItem | null;
  tasks: TaskItem[];
  timelines?: TimelineItem[];
  onAddTask: (task: TaskItem) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTimeline?: (id: string, updates: Partial<TimelineItem>) => Promise<void>;
  onNavigateToEvents?: () => void;
}

export interface UnifiedChecklistItem {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  category: string;
  timeInfo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isCompleted: boolean;
  source: 'schedule' | 'task';
  originalTimeline?: TimelineItem;
  originalTask?: TaskItem;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  event,
  tasks,
  timelines = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateTimeline,
  onNavigateToEvents,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'schedule' | 'tasks'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  if (!event) {
    return (
      <div className="py-20 text-center max-w-md mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Event Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Please select or create an event from the top navigation to view the Smart Checklist and track event progress.
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

  // Unified checklist items: Schedule Run of Show (in timing order) + General Tasks
  const unifiedItems = useMemo<UnifiedChecklistItem[]>(() => {
    const list: UnifiedChecklistItem[] = [];

    // 1. Sort Schedule items in chronological timing order
    const sortedSchedule = sortTimelineItems(timelines, 'timing_asc');
    sortedSchedule.forEach((tl) => {
      const timeStr = tl.startTime
        ? `${tl.startTime}${tl.endTime ? ` – ${tl.endTime}` : ''}`
        : tl.date || 'Scheduled Slot';

      list.push({
        id: tl.id,
        eventId: tl.eventId,
        title: tl.title,
        description: tl.description,
        category: tl.type === 'day_of' ? 'Schedule Run of Show' : 'Preparation Milestone',
        timeInfo: timeStr,
        priority: tl.priority,
        isCompleted: tl.status === 'completed',
        source: 'schedule',
        originalTimeline: tl,
      });
    });

    // 2. Add General Action Tasks
    tasks.forEach((t) => {
      list.push({
        id: t.id,
        eventId: t.eventId,
        title: t.title,
        description: t.description,
        category: t.category || 'General Task',
        timeInfo: t.dueDate ? `Due ${t.dueDate}` : undefined,
        priority: t.priority,
        isCompleted: t.isCompleted,
        source: 'task',
        originalTask: t,
      });
    });

    return list;
  }, [timelines, tasks]);

  // Combined Progress Calculation
  const totalCount = unifiedItems.length;
  const completedCount = unifiedItems.filter((i) => i.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered List
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      const matchesStatus =
        selectedFilter === 'all'
          ? true
          : selectedFilter === 'completed'
          ? item.isCompleted
          : !item.isCompleted;

      const matchesSource =
        sourceFilter === 'all'
          ? true
          : sourceFilter === 'schedule'
          ? item.source === 'schedule'
          : item.source === 'task';

      const matchesPriority =
        selectedPriority === 'all' || item.priority === selectedPriority;

      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.timeInfo && item.timeInfo.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesSource && matchesPriority && matchesSearch;
    });
  }, [unifiedItems, selectedFilter, sourceFilter, selectedPriority, searchQuery]);

  // Toggle checkmark handler
  const handleToggleCheckmark = async (item: UnifiedChecklistItem) => {
    const nextCompleted = !item.isCompleted;

    if (item.source === 'schedule') {
      if (onUpdateTimeline) {
        await onUpdateTimeline(item.id, {
          status: nextCompleted ? 'completed' : 'pending',
        });
      }
    } else {
      await onUpdateTask(item.id, { isCompleted: nextCompleted });
    }

    if (nextCompleted) {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#f59e0b', '#38bdf8'],
        });
      } catch {
        // Fallback
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('General');
    setPriority('medium');
    setDueDate(event.eventDate || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UnifiedChecklistItem) => {
    if (item.source === 'task' && item.originalTask) {
      setEditingTask(item.originalTask);
      setTitle(item.originalTask.title);
      setDescription(item.originalTask.description || '');
      setCategory(item.originalTask.category);
      setPriority(item.originalTask.priority);
      setDueDate(item.originalTask.dueDate || '');
      setIsModalOpen(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      await onUpdateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        priority,
        dueDate,
      });
    } else {
      const newTask: TaskItem = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventId: event.id,
        userId: event.userId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        priority,
        dueDate,
        isCompleted: false,
        source: 'custom',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onAddTask(newTask);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
              {event.name}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">
              Schedule Run of Show + Checklist Tasks
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            Smart Checklist & Schedule Execution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All schedule slots from Timeline and tasks organized into an actionable checklist that drives event progress
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Progress Bar & Stat Highlights */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base">
              {percentage}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Event Checklist & Schedule Progress
                </span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                    percentage === 100
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : percentage >= 50
                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                  }`}
                >
                  {percentage === 100 ? 'All Completed 🎉' : `${percentage}% In Motion`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                {completedCount} items checked off of {totalCount} total checklist & schedule slots
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
              Pending: <strong className="text-amber-600 dark:text-amber-400">{pendingCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
              Completed: <strong className="text-emerald-600 dark:text-emerald-400">{completedCount}</strong>
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800 shadow-inner">
          <div
            className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Controls Bar: Source Filter, Status Toggle, Priority & Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-xs">
        {/* Source Filter (Schedule vs Tasks vs All) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                sourceFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Items ({unifiedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('schedule')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                sourceFilter === 'schedule'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Schedule ({timelines.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('tasks')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                sourceFilter === 'tasks'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Action Tasks ({tasks.length})
            </button>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === 'pending'
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedFilter === 'completed'
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Priority Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search checklist..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Checklist Stream */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          No checklist items found matching your filters.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item, index) => {
            let priorityBadge = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
            if (item.priority === 'urgent')
              priorityBadge =
                'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30';
            else if (item.priority === 'high')
              priorityBadge =
                'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30';
            else if (item.priority === 'medium')
              priorityBadge =
                'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  item.isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Left: Checkmark Box + Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleCheckmark(item)}
                    className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      item.isCompleted
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-950'
                    }`}
                    title={item.isCompleted ? 'Click to mark pending' : 'Click to mark completed'}
                  >
                    {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          item.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </span>

                      {/* Source Badge (Schedule vs Task) */}
                      {item.source === 'schedule' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Schedule Slot</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                      )}

                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${priorityBadge}`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Time / Timing slot badge */}
                    {item.timeInfo && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>{item.timeInfo}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status Pill & Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.isCompleted ? 'Completed' : 'Pending'}
                  </span>

                  {item.source === 'task' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTask ? 'Edit Action Task' : 'Create Action Task'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Confirm audio mixer and microphone setup"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="General">General</option>
                    <option value="Venue & Logistics">Venue & Logistics</option>
                    <option value="Catering & Hospitality">Catering & Hospitality</option>
                    <option value="Media & Stage">Media & Stage</option>
                    <option value="Guests & VIP">Guests & VIP</option>
                    <option value="Swag & Materials">Swag & Materials</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, assigned coordinator, equipment or contact details"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
