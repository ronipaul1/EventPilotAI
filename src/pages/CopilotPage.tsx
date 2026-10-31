import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import type { EventItem, ChatMessage, BudgetSummary } from '../types';

interface CopilotPageProps {
  event: EventItem | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  budgetSummary?: BudgetSummary;
  completedTasksCount?: number;
  totalTasksCount?: number;
  vendorCount?: number;
  guestCount?: number;
  onNavigate: (page: string) => void;
}

export const CopilotPage: React.FC<CopilotPageProps> = ({
  event,
  messages,
  onSendMessage,
  isLoading,
  budgetSummary,
  completedTasksCount,
  totalTasksCount,
  vendorCount,
  guestCount,
  onNavigate,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = event
    ? [
        `How can I reduce catering expenses for ${event.guestCount} guests?`,
        `Suggest 3 decor themes for ${event.category} celebration.`,
        `What are the most critical tasks to complete this week?`,
        `Draft a vendor negotiation script for local catering and decor.`,
        `Create a wet-weather contingency backup plan for ${event.location}.`,
      ]
    : [
        'How to plan a high-impact celebration on a tight budget?',
        'Suggest timeline milestones for a 200-person gathering.',
        'What are standard vendor negotiation strategies?',
      ];

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in text-xs">
      {/* Copilot Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                EventPilot Intelligent Copilot
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-bold">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {event
                ? `Contextually grounded in: ${event.name} (${event.category})`
                : 'General celebration planning intelligence'}
            </p>
          </div>
        </div>

        {event && (
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Remaining Budget
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {event.currency} {(budgetSummary?.remainingBalance ?? event.totalBudget).toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                Tasks Cleared
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {completedTasksCount || 0}/{totalTasksCount || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="py-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                How can I assist your celebration planning today?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                I have real-time awareness of your active event parameters, committed expenditures, vendor statuses, and checklist progress.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="pt-2 text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(p)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 text-left transition-colors font-medium leading-relaxed"
                  >
                    &ldquo;{p}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div className="group relative max-w-[85%]">
                <div
                  className={`p-4 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute -bottom-6 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-1 font-bold">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <span className="italic">EventPilot is reasoning with Gemini...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about budget cuts, vendor terms, timeline coordination, or decor ideas..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 text-xs"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
