import React from 'react';
import {
  Calendar,
  Sparkles,
  PieChart,
  CheckSquare,
  Users,
  Clock,
  MessageSquare,
  FileDown,
  PlusCircle,
  LogOut,
  LogIn,
  ChevronDown,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { EventItem } from '../types';

interface NavbarProps {
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenCreateWizard: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenChat: () => void;
  onExportPdf: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenCreateWizard,
  activeTab,
  setActiveTab,
  onOpenChat,
  onExportPdf,
}) => {
  const { user, signInWithGoogle, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'ai-planner', label: 'AI Master Plan', icon: Sparkles, badge: 'Gemini' },
    { id: 'budget', label: 'Budget Ledger', icon: PieChart },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'checklist', label: 'Smart Tasks', icon: CheckSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Active Event Picker */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <PartyPopper className="w-5 h-5 font-bold" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  EventPilot<span className="text-amber-400">AI</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Celebration & Event Planner
                </span>
              </div>
            </button>

            {/* Event Selector Dropdown if authenticated */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 hover:bg-slate-800/80 transition-colors"
                >
                  <span className="font-medium max-w-[130px] sm:max-w-[180px] truncate">
                    {selectedEvent ? selectedEvent.name : 'Select Event'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Your Events ({events.length})
                    </div>
                    {events.length === 0 ? (
                      <div className="px-2 py-3 text-slate-400 text-center">
                        No events planned yet
                      </div>
                    ) : (
                      <div className="max-h-52 overflow-y-auto space-y-1">
                        {events.map((evt) => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => onSelectEvent(evt)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between ${
                              selectedEvent?.id === evt.id
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate font-medium">{evt.name}</span>
                            <span className="text-[10px] uppercase text-slate-400 ml-2 px-1.5 py-0.5 rounded bg-slate-800">
                              {evt.category}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={onOpenCreateWizard}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Create New Event
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Actions: AI Assistant, PDF Export, User Session */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <>
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-amber-300 font-medium transition-colors"
                  title="Open AI Event Assistant"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">AI Copilot</span>
                </button>

                {selectedEvent && (
                  <button
                    type="button"
                    onClick={onExportPdf}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                    title="Export Event Dossier as PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden md:inline">Export PDF</span>
                  </button>
                )}
              </>
            )}

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-amber-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {user && (
        <div className="lg:hidden border-t border-slate-850 px-2 py-1.5 flex items-center justify-around overflow-x-auto gap-1 bg-slate-950">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-2 rounded text-[10px] font-medium transition-colors ${
                  isActive ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
