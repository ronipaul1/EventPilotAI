import React, { useState, useMemo } from 'react';
import {
  Clock,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Calendar,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import type {
  EventItem,
  TimelineItem,
  TimelineType,
  TimelineStatus,
} from '../types';
import {
  sortTimelineItems,
  parseTimeToMinutes,
  type TimelineSortMode,
} from '../utils/timelineSorting';

interface TimelineViewProps {
  event: EventItem | null;
  timelines: TimelineItem[];
  onAddTimeline: (item: TimelineItem) => Promise<void>;
  onUpdateTimeline: (id: string, updates: Partial<TimelineItem>) => Promise<void>;
  onDeleteTimeline: (id: string) => Promise<void>;
  onNavigateToEvents?: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  event,
  timelines,
  onAddTimeline,
  onUpdateTimeline,
  onDeleteTimeline,
  onNavigateToEvents,
}) => {
  const [activeType, setActiveType] = useState<TimelineType>('day_of');
  const [sortMode, setSortMode] = useState<TimelineSortMode>('timing_asc');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [date, setDate] = useState(event?.eventDate || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<TimelineStatus>('pending');

  // Filter items by type
  const rawFilteredItems = useMemo(
    () => timelines.filter((t) => t.type === activeType),
    [timelines, activeType]
  );

  // Chronologically Sort by Timing (or selected mode)
  const sortedItems = useMemo(
    () => sortTimelineItems(rawFilteredItems, sortMode),
    [rawFilteredItems, sortMode]
  );

  if (!event) {
    return (
      <div className="py-20 text-center max-w-md mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Event Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Please select or create an event from the top navigation to view or schedule milestones and day-of timelines.
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

  // Calculate smart default time for next item
  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');

    if (activeType === 'day_of' && sortedItems.length > 0) {
      // Find latest item
      const latestItem = sortedItems[sortedItems.length - 1];
      const baseTime = latestItem.endTime || latestItem.startTime || '10:00 AM';
      setStartTime(baseTime);
      setEndTime('');
    } else {
      setStartTime('09:00 AM');
      setEndTime('10:00 AM');
    }

    setDate(event.eventDate || new Date().toISOString().split('T')[0]);
    setPriority('medium');
    setStatus('pending');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TimelineItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setStartTime(item.startTime || '10:00 AM');
    setEndTime(item.endTime || '');
    setDate(item.date || event.eventDate || '');
    setPriority(item.priority);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingItem) {
      await onUpdateTimeline(editingItem.id, {
        title: title.trim(),
        description: description.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        date,
        priority,
        status,
      });
    } else {
      const newItem: TimelineItem = {
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventId: event.id,
        userId: event.userId,
        type: activeType,
        title: title.trim(),
        description: description.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        date,
        priority,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onAddTimeline(newItem);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (item: TimelineItem) => {
    const nextStatus: TimelineStatus =
      item.status === 'completed'
        ? 'pending'
        : item.status === 'pending'
        ? 'in_progress'
        : 'completed';
    await onUpdateTimeline(item.id, { status: nextStatus });
  };

  // Helper to quickly toggle AM/PM on input string
  const toggleMeridian = (current: string, target: 'AM' | 'PM') => {
    if (!current) return `10:00 ${target}`;
    if (/am|pm/i.test(current)) {
      return current.replace(/am|pm/i, target);
    }
    return `${current.trim()} ${target}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
              {event.name}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">
              {sortedItems.length} {activeType === 'day_of' ? 'Run of Show Slots' : 'Milestones'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            Event Timeline & Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Keep coordinators, hosts, and vendors synchronized for {event.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Type: Milestone vs Day-of */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveType('milestone')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeType === 'milestone'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Preparation Milestones
            </button>
            <button
              type="button"
              onClick={() => setActiveType('day_of')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeType === 'day_of'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Day-Of Run of Show
            </button>
          </div>

          {/* Sort Order Selector (Timing vs Entry) */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as TimelineSortMode)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none text-xs cursor-pointer"
              title="Change schedule sorting order"
            >
              <option value="timing_asc">Order of Timing (Chronological)</option>
              <option value="timing_desc">Order of Timing (Latest First)</option>
              <option value="entry_asc">Entry Order (Oldest First)</option>
              <option value="entry_desc">Entry Order (Newest First)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {sortedItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No entries in this timeline yet. Click &apos;Add Entry&apos; or import from the AI Event Planner.
          </div>
        ) : (
          <div className="relative pl-7 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {sortedItems.map((item, index) => (
              <div key={item.id} className="relative group">
                {/* Node icon with sequential timing order badge */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item)}
                  className={`absolute -left-7 top-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors text-[10px] font-mono font-bold shadow-xs ${
                    item.status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : item.status === 'in_progress'
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/40'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-amber-500'
                  }`}
                  title={`Step #${index + 1} - Click to toggle status (${item.status})`}
                >
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Content Box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {item.title}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                          item.priority === 'high'
                            ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            : item.priority === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          item.status === 'completed'
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10'
                            : item.status === 'in_progress'
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10'
                            : 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {activeType === 'day_of' ? (
                        <div className="flex items-center gap-1.5 font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {item.startTime || 'TBD'}
                            {item.endTime ? ` – ${item.endTime}` : ''}
                          </span>
                        </div>
                      ) : (
                        item.date && (
                          <div className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Calendar className="w-3 h-3" />
                            <span>{item.date}</span>
                          </div>
                        )
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTimeline(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Schedule Slot' : 'Add New Schedule Slot'}
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
                  Title <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Guest Arrival & Welcome Drinks"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {activeType === 'day_of' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Start Time with 1-click AM/PM toggles */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">
                          Start Time <span className="text-amber-500">*</span>
                        </label>
                        <div className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setStartTime((curr) => toggleMeridian(curr, 'AM'))}
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              /am/i.test(startTime)
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => setStartTime((curr) => toggleMeridian(curr, 'PM'))}
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              /pm/i.test(startTime)
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="e.g. 09:00 AM"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>

                    {/* End Time with 1-click AM/PM toggles */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">
                          End Time
                        </label>
                        <div className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setEndTime((curr) => toggleMeridian(curr, 'AM'))}
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              /am/i.test(endTime)
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => setEndTime((curr) => toggleMeridian(curr, 'PM'))}
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              /pm/i.test(endTime)
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="e.g. 10:00 AM"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Quick-time presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400">Presets:</span>
                    {['09:00 AM', '10:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setStartTime(t);
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Details & Coordinator Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cue notes, key person responsible, equipment needed"
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
                  {editingItem ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
