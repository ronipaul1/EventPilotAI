import React, { useState } from 'react';
import {
  Sparkles,
  PartyPopper,
  ShieldCheck,
  Calendar,
  PieChart,
  Users,
  CheckCircle2,
  ArrowRight,
  Heart,
  Cake,
  Flame,
  Award,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onStartPlanning: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPlanning,
  onExploreDemo,
}) => {
  const { signInWithGoogle } = useAuth();
  const [demoCategory, setDemoCategory] = useState<'wedding' | 'birthday' | 'community'>('wedding');

  const demoExamples = {
    wedding: {
      title: 'Royal Heritage Palace Wedding',
      budget: '₹12,00,000',
      guests: '350 Guests',
      timeline: '6 Months Prep',
      quote: 'Full multi-day itinerary with Haldi, Sangeet & Mandap design, vendor negotiations, and automated catering breakdown.',
      sampleTasks: ['Select traditional Shehnai & DJ artists', 'Book eco-friendly marigold decorator', 'Review guest dietary matrix (Jain/Vegan)'],
    },
    birthday: {
      title: '30th Golden Milestone Soirée',
      budget: '₹1,50,000',
      guests: '60 Guests',
      timeline: '4 Weeks Prep',
      quote: 'Cocktail lounge curation, bespoke artisan cake design, custom photo-booth backdrop, and live jazz trio coordination.',
      sampleTasks: ['Curate nostalgic custom playlist', 'Order multi-tier salted caramel cake', 'Send digital interactive video invites'],
    },
    community: {
      title: 'City Cultural Food & Arts Gala',
      budget: '₹4,50,000',
      guests: '500+ Attendees',
      timeline: '8 Weeks Prep',
      quote: 'Municipal permits checklist, volunteer shift rotations, artisan stall layout map, and acoustic stage management.',
      sampleTasks: ['Secure civic fire & safety permits', 'Organize waste-segregation stations', 'Finalize stage audio engineer contract'],
    },
  };

  const activeDemo = demoExamples[demoCategory];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6 shadow-sm shadow-amber-500/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PromptWars Challenge 5: Celebration & Event Planner</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-none">
              Plan unforgettable celebrations with <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Gemini AI</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
              EventPilot AI architects personalized master blueprints, precise budget distribution, automated vendor coordination, and day-of schedules for weddings, birthdays, and community festivals.
            </p>

            {/* CTA Group */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartPlanning}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Start Planning Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all"
              >
                <PartyPopper className="w-4 h-4 text-amber-400" />
                <span>Launch Demo Event</span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Strict Zero-Trust User Isolation
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Real-Time Mathematical Ledger
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-400" />
                Production Google Gen AI SDK
              </span>
            </div>
          </div>

          {/* Interactive AI Showcase Widget */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Interactive AI Planner Preview
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeDemo.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                    {activeDemo.budget}
                  </span>
                </h3>
              </div>

              {/* Category selector */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setDemoCategory('wedding')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                    demoCategory === 'wedding'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Weddings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCategory('birthday')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                    demoCategory === 'birthday'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cake className="w-3.5 h-3.5" />
                  <span>Birthdays</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCategory('community')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                    demoCategory === 'community'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Community</span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2 space-y-3">
                <p className="text-xs text-slate-300 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  &ldquo;{activeDemo.quote}&rdquo;
                </p>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Auto-Generated Smart Task Checklist
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {activeDemo.sampleTasks.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Plan Specifications
                  </span>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Guest Count:</span>
                      <span className="font-semibold text-slate-200">{activeDemo.guests}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Total Budget:</span>
                      <span className="font-semibold text-amber-400">{activeDemo.budget}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Timeline:</span>
                      <span className="font-semibold text-slate-200">{activeDemo.timeline}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onStartPlanning}
                  className="mt-4 w-full py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Customize This Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars & Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Complete Suite Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-2">
            Every critical module in a unified command center
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Designed to replace fragmented spreadsheets, disorganized note apps, and chaotic group chats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Gemini Master Blueprint</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Provides comprehensive event breakdowns, catering ideas, theme-tailored decor suggestions, and risk contingency tips via structured JSON.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Mathematical Budget Ledger</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Tracks actual expenditures against total budgets across 9 standardized categories. Computes exact remaining balance and alerts on overruns.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Preparation & Day-Of Timeline</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Chronological milestones with overdue indicators and minute-by-minute day-of schedules so coordinators never miss a key cue.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Vendor Coordination CRM</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Logs contact details, quote estimates vs actual negotiated contracts, and 5-stage booking statuses from Contacted to Confirmed.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Smart Task Checklists</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Prioritized to-do items categorized by domain (Venue, Logistics, Media). Easily import AI suggested tasks directly into your live checklist.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Context-Aware AI Copilot</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Conversational assistant connected to your active event&apos;s live budget and task status. Ask for negotiation strategies or theme tweaks in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How EventPilot AI Works</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From initial spark to seamless day-of execution in 3 steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Input Event Parameters</h3>
              <p className="mt-2 text-xs text-slate-400">
                Provide your celebration type, date, location, guest head-count, budget ceiling, and dietary/accessibility requirements.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Gemini Generates Blueprint</h3>
              <p className="mt-2 text-xs text-slate-400">
                In seconds, Gemini creates a tailored master plan, balanced budget distribution, vendor requirements, and preparation milestones.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Track & Execute Flawlessly</h3>
              <p className="mt-2 text-xs text-slate-400">
                Log real expenses, check off tasks, negotiate with vendors, chat with the AI assistant, and export executive PDF reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to plan your next milestone event?
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            Sign in with Google to create your first event, or explore our interactive demo with pre-populated celebration plans.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all"
            >
              Get Started with Google
            </button>
            <button
              type="button"
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all"
            >
              Explore Sample Event
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-300">EventPilot AI</span>
            <span>— Virtual PromptWars Challenge 5</span>
          </div>
          <div>
            Built with React, Vite, Tailwind CSS, Google Gemini API, and Firebase.
          </div>
        </div>
      </footer>
    </div>
  );
};
