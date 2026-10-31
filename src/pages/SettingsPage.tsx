import React from 'react';
import {
  Settings,
  User,
  ShieldCheck,
  Database,
  Moon,
  Sun,
  LogOut,
  LogIn,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SettingsPageProps {
  onClearCache: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClearCache }) => {
  const { user, signInWithGoogle, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-xs">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Application Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your account profile, visual appearance, and persistent database connection
        </p>
      </div>

      {/* Account Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-amber-500" />
          <span>User Authentication & Profile</span>
        </h2>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-base">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {user.displayName || 'Event Planner'}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-xs">{user.email}</div>
                <div className="font-mono text-[10px] text-slate-400 mt-0.5">UID: {user.uid}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                You are currently exploring as Guest
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sign in with Google to persist your celebrations in Cloud Firestore across all devices.
              </p>
            </div>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Appearance Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Visual Theme & Appearance</span>
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold ring-1 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Theme (Default)</span>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              theme === 'dark'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold ring-1 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark Theme</span>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
          </button>
        </div>
      </div>

      {/* Cloud & AI Infrastructure Status */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Cloud & Database Architecture</span>
        </h2>

        <div className="space-y-2 text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Cloud Firestore Database</span>
              <span className="font-mono text-[10px] text-slate-400">ai-studio-6a7bb55f-99fd-4c24-991b-bff4ff4722d0</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-bold">
              Connected & Deployed
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Google Gemini Planning Engine</span>
              <span className="text-[10px] text-slate-400">gemini-3.8-flash via @google/genai SDK</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 text-[10px] font-bold">
              Active
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Firestore Security Rules</span>
              <span className="text-[10px] text-slate-400">Master Gate Attribute-Based Access Control</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 text-[10px] font-bold">
              Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
