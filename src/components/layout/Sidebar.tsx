import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  PieChart,
  Clock,
  UserCheck,
  Briefcase,
  CheckSquare,
  MessageSquare,
  FileText,
  Settings,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { EventItem } from '../../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  selectedEvent: EventItem | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  pendingTaskCount: number;
  completedTaskCount?: number;
  totalTaskCount?: number;
  guestCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  selectedEvent,
  collapsed,
  onToggleCollapse,
  pendingTaskCount,
  completedTaskCount = 0,
  totalTaskCount = 0,
  guestCount,
}) => {
  const checklistPercentage = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;
  const mainNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'events', label: 'My Events', icon: CalendarDays },
    {
      id: 'planner',
      label: 'AI Event Planner',
      icon: Sparkles,
      badge: 'Gemini',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    },
    { id: 'budget', label: 'Budget & Expenses', icon: PieChart },
    { id: 'timeline', label: 'Timeline & Schedule', icon: Clock },
    {
      id: 'guests',
      label: 'Guest Management',
      icon: UserCheck,
      count: guestCount > 0 ? guestCount : undefined,
    },
    { id: 'vendors', label: 'Vendor Management', icon: Briefcase },
    {
      id: 'checklist',
      label: 'Smart Checklist',
      icon: CheckSquare,
      count: pendingTaskCount > 0 ? pendingTaskCount : undefined,
      countColor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    },
    { id: 'copilot', label: 'AI Copilot', icon: MessageSquare },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 select-none z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-2.5 text-left focus:outline-none overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-sm shadow-amber-500/20 flex-shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="leading-none">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                EventPilot<span className="text-amber-500">AI</span>
              </span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Multi-Event Platform
              </span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden lg:block"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Selected Event Context Pill */}
      {!collapsed && (
        <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Active Event
          </div>
          <div className="mt-1 font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
            {selectedEvent ? selectedEvent.name : 'No Event Selected'}
          </div>
          {selectedEvent && (
            <div className="mt-0.5 text-[10px] text-slate-500 flex items-center justify-between">
              <span className="capitalize">{selectedEvent.category}</span>
              <span className="font-mono">{selectedEvent.eventDate}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between truncate text-left">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'checklist' && totalTaskCount > 0 ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-10 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${checklistPercentage}%` }}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          checklistPercentage === 100
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}
                      >
                        {completedTaskCount}/{totalTaskCount}
                      </span>
                    </div>
                  ) : (
                    item.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          item.countColor || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.count}
                      </span>
                    )
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>EventPilot AI v2.0</span>
          <span className="font-mono text-emerald-500">Live</span>
        </div>
      )}
    </aside>
  );
};
