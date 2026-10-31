import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import type { EventItem, ChatMessage, BudgetSummary } from '../types';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  budgetSummary?: BudgetSummary;
  completedTasksCount?: number;
  totalTasksCount?: number;
  vendorCount?: number;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  event,
  messages,
  onSendMessage,
  isLoading,
  budgetSummary,
  completedTasksCount,
  totalTasksCount,
  vendorCount,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = event
    ? [
        `How can I reduce catering expenses for ${event.guestCount} guests?`,
        `Suggest 3 decor themes for ${event.category} celebration.`,
        `What are the most critical tasks to complete this week?`,
        `How to negotiate rates with local venue & media vendors?`,
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

  const handleQuickPromptClick = async (prompt: string) => {
    if (isLoading) return;
    await onSendMessage(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">EventPilot Copilot</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                  Gemini
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {event ? `Grounding in: ${event.name}` : 'General Event Assistant'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event Context Pill Bar if Event selected */}
        {event && (
          <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              Budget: <strong className="text-white">{event.currency} {event.totalBudget.toLocaleString()}</strong>
            </span>
            <span>
              Spent: <strong className="text-amber-400">{event.currency} {budgetSummary?.actualExpenses.toLocaleString() || 0}</strong>
            </span>
            <span>
              Tasks: <strong className="text-emerald-400">{completedTasksCount || 0}/{totalTasksCount || 0}</strong>
            </span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Ask EventPilot Anything</h4>
                <p className="text-slate-400 text-[11px] max-w-xs mx-auto mt-1">
                  I have full context of your event specs, current ledger balance, tasks, and vendors.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="pt-4 space-y-2 text-left">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Suggested Questions
                </span>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPromptClick(p)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    &ldquo;{p}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-400">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="text-xs italic">EventPilot is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for advice, budget adjustments, or ideas..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
    </div>
  );
};
