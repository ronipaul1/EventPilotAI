import React, { useState } from 'react';
import {
  CalendarDays,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  Heart,
  Cake,
  CheckCircle2,
  ArrowUpRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { EventItem, EventCategory, EventStatus } from '../types';
import { calculateDaysRemaining } from '../utils/budgetCalculations';

interface MyEventsPageProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenCreateWizard: () => void;
  onUpdateEvent: (id: string, updates: Partial<EventItem>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onNavigate: (page: string) => void;
}

export const MyEventsPage: React.FC<MyEventsPageProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenCreateWizard,
  onUpdateEvent,
  onDeleteEvent,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit Modal
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [totalBudget, setTotalBudget] = useState<number>(500000);
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState<EventStatus>('planning');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Delete Confirmation Modal
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()) ||
      e.theme.toLowerCase().includes(search.toLowerCase());

    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setName(evt.name);
    setEventDate(evt.eventDate);
    setLocation(evt.location);
    setGuestCount(evt.guestCount);
    setTotalBudget(evt.totalBudget);
    setTheme(evt.theme);
    setStatus(evt.status);
    setAdditionalNotes(evt.additionalNotes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    await onUpdateEvent(editingEvent.id, {
      name: name.trim(),
      eventDate,
      location: location.trim(),
      guestCount: Number(guestCount) || 50,
      totalBudget: Number(totalBudget) || 10000,
      theme: theme.trim(),
      status,
      additionalNotes: additionalNotes.trim(),
    });

    setEditingEvent(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingEventId) {
      await onDeleteEvent(deletingEventId);
      setDeletingEventId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wedding':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'birthday':
        return <Cake className="w-4 h-4 text-amber-500" />;
      case 'community':
        return <Users className="w-4 h-4 text-sky-500" />;
      default:
        return <CalendarDays className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Event Management Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, configure, edit, and orchestrate all celebrations independently
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateWizard}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, location, theme..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="wedding">Weddings</option>
            <option value="birthday">Birthdays</option>
            <option value="community">Community</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
          <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No events found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or click &apos;Create New Event&apos; to build your next celebration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const isSelected = selectedEvent?.id === evt.id;
            const countdown = calculateDaysRemaining(evt.eventDate);

            return (
              <div
                key={evt.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-amber-50/40 dark:bg-amber-500/10 border-amber-500 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(evt.category)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {evt.category}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                          {evt.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        evt.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : evt.status === 'completed'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.eventDate}</span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold ml-auto font-mono">
                        {countdown.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{evt.location}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5" />
                        {evt.guestCount} guests
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {evt.currency} {evt.totalBudget.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {evt.theme && (
                    <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Theme: <span className="font-medium text-slate-700 dark:text-slate-300">{evt.theme}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[11px]">
                        Active Workspace
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectEvent(evt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition-colors"
                      >
                        Set Active
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onSelectEvent(evt);
                        onNavigate('planner');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                      title="Open AI Planner"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(evt)}
                      className="px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      title="Edit event details"
                    >
                      <Edit2 className="w-3 h-3 text-slate-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingEventId(evt.id)}
                      className="px-2.5 py-1 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-600 hover:text-white bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 font-bold text-[11px] flex items-center gap-1 transition-all"
                      title="Delete event"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Event Specifications
              </h3>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EventStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Budget ({editingEvent.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Theme / Aesthetic
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 text-center space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Delete Celebration Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This will permanently remove this event and its associated budget ledger, tasks, and vendor records.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEventId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Keep Event
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
