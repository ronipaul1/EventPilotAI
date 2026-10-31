import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  ChevronDown,
  PlusCircle,
  Bell,
  Calendar,
  LogOut,
  LogIn,
  CheckCircle2,
  Sparkles,
  Layers,
  Heart,
  Cake,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { EventItem } from '../../types';

interface TopNavProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenCreateWizard: () => void;
  onNavigate: (page: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenCreateWizard,
  onNavigate,
  onSearch,
  searchQuery,
}) => {
  const { user, signInWithGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const eventDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setEventDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wedding':
        return <Heart className="w-3.5 h-3.5 text-rose-500" />;
      case 'birthday':
        return <Cake className="w-3.5 h-3.5 text-amber-500" />;
      case 'community':
        return <Users className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Active Event Picker */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={eventDropdownRef}>
          <button
            type="button"
            onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors"
          >
            {selectedEvent ? (
              <>
                {getCategoryIcon(selectedEvent.category)}
                <span className="max-w-[140px] sm:max-w-[200px] truncate">
                  {selectedEvent.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 ml-1">
                  ({selectedEvent.category})
                </span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">No Event Selected</span>
              </>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Event Picker Dropdown */}
          {eventDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 text-xs">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Your Events ({events.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    setEventDropdownOpen(false);
                    onNavigate('events');
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Manage All
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto py-1 space-y-1">
                {events.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No events created yet.
                  </div>
                ) : (
                  events.map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => {
                        onSelectEvent(evt);
                        setEventDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors ${
                        selectedEvent?.id === evt.id
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-500/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getCategoryIcon(evt.category)}
                        <span className="truncate">{evt.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 ml-2">
                        {evt.eventDate}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEventDropdownOpen(false);
                    onOpenCreateWizard();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create New Event</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search across events, tasks, guests, vendors..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {/* Right: Theme Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>System Updates</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                  Live Firestore Active
                </span>
              </div>
              <div className="py-2 space-y-2 text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Multi-Event Persistence Ready
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Cloud Firestore & User Isolation enabled.
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Gemini 3.8 Planning Engine
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Context-aware assistant and structured planning live.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Auth Profile */}
        {user ? (
          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-lg object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 text-xs">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.displayName || 'Event Planner'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  >
                    Account Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-xs font-bold shadow-xs transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign In with Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
