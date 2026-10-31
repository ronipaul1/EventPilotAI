import React, { useState } from 'react';
import {
  X,
  Heart,
  Cake,
  Users,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { EventCategory, EventItem } from '../types';
import { validateEventInput } from '../utils/budgetCalculations';

interface EventWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: EventItem, autoGenerateAi: boolean) => Promise<void>;
  userId: string;
}

export const EventWizard: React.FC<EventWizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EventCategory>('wedding');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState<number>(150);
  const [durationHours, setDurationHours] = useState<number>(6);

  const [totalBudget, setTotalBudget] = useState<number>(500000);
  const [currency, setCurrency] = useState('₹');
  const [theme, setTheme] = useState('Royal Heritage & Marigold');

  // Category specific notes
  const [weddingTradition, setWeddingTradition] = useState('Traditional Hindu rituals with Sangeet & Reception');
  const [birthdayMilestone, setBirthdayMilestone] = useState('30th Milestone celebration');
  const [communityType, setCommunityType] = useState('Annual Cultural & Food Festival');

  const [dietaryRequirements, setDietaryRequirements] = useState('Vegetarian, Vegan & Jain options required');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState('Wheelchair ramp at entrance, reserved priority seating');
  const [additionalNotes, setAdditionalNotes] = useState('Focus on ambient lighting and high quality acoustics for music.');
  const [autoGenerateAi, setAutoGenerateAi] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrors({});
    if (step === 1) {
      const val = validateEventInput({
        name,
        category,
        eventDate,
        totalBudget,
        guestCount,
        location,
      });
      if (val.errors.name || val.errors.eventDate || val.errors.location || val.errors.guestCount) {
        setErrors(val.errors);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (totalBudget <= 0) {
        setErrors({ totalBudget: 'Please provide a valid budget amount' });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrors({});

    let mergedNotes = additionalNotes;
    if (category === 'wedding' && weddingTradition) {
      mergedNotes = `Traditions: ${weddingTradition}. ${mergedNotes}`;
    } else if (category === 'birthday' && birthdayMilestone) {
      mergedNotes = `Milestone: ${birthdayMilestone}. ${mergedNotes}`;
    } else if (category === 'community' && communityType) {
      mergedNotes = `Focus: ${communityType}. ${mergedNotes}`;
    }

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEvent: EventItem = {
      id: eventId,
      userId,
      name: name.trim(),
      category,
      eventDate,
      location: location.trim(),
      guestCount: Number(guestCount) || 50,
      totalBudget: Number(totalBudget) || 10000,
      currency,
      durationHours: Number(durationHours) || 5,
      theme: theme.trim() || 'Classic Elegance',
      dietaryRequirements: dietaryRequirements.trim() || 'Standard options',
      accessibilityRequirements: accessibilityRequirements.trim() || 'Standard accessibility',
      additionalNotes: mergedNotes.trim(),
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSubmit(newEvent, autoGenerateAi);
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to save event' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Step {step} of 4
            </span>
            <h2 className="text-xl font-bold text-white">Create New Event Blueprint</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between mt-4 mb-6">
          {[
            { num: 1, label: 'Core Info' },
            { num: 2, label: 'Financials & Theme' },
            { num: 3, label: 'Logistics' },
            { num: 4, label: 'Review & Launch' },
          ].map((s) => (
            <div key={s.num} className="flex-1 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s.num
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 hidden sm:block">{s.label}</span>
            </div>
          ))}
        </div>

        {errors.form && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Step 1: Core Details */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            {/* Category Selector */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Event Category <span className="text-amber-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('wedding');
                    setTheme('Royal Heritage & Marigold');
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    category === 'wedding'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Heart className="w-5 h-5 text-amber-400" />
                  <span>Wedding</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('birthday');
                    setTheme('Modern Neon & Gold');
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    category === 'birthday'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Cake className="w-5 h-5 text-amber-400" />
                  <span>Birthday</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('community');
                    setTheme('Vibrant Cultural Fair');
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    category === 'community'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Community</span>
                </button>
              </div>
            </div>

            {/* Event Name */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Event Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  category === 'wedding'
                    ? 'e.g. Maya & Rohan Grand Wedding'
                    : category === 'birthday'
                    ? "e.g. Leo's 10th Superhero Birthday"
                    : 'e.g. Green Valley Autumn Festival'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
            </div>

            {/* Date & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Event Date <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                {errors.eventDate && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.eventDate}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Location & Guest Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Location / Venue <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Palace Resort, Udaipur or City Hall"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.location && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.location}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Expected Guest Count <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {errors.guestCount && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.guestCount}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Financials & Ambiance */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Total Budget Ceiling <span className="text-amber-400">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl bg-slate-800 text-slate-300 border border-r-0 border-slate-700 font-bold">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="1000"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-r-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500 font-semibold transition-colors"
                  />
                </div>
                {errors.totalBudget && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.totalBudget}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="₹">INR (₹)</option>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="£">GBP (£)</option>
                  <option value="د.إ">AED (د.إ)</option>
                  <option value="C$">CAD (C$)</option>
                  <option value="A$">AUD (A$)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Theme & Aesthetic Vision
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Royal Rajputana, Sunset Boho, Minimalist Scandinavian"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Specific Field */}
            {category === 'wedding' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ceremonies & Ritual Highlights
                </label>
                <input
                  type="text"
                  value={weddingTradition}
                  onChange={(e) => setWeddingTradition(e.target.value)}
                  placeholder="e.g. Mehendi, Sangeet Night, Baraat & Reception"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {category === 'birthday' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Milestone Age / Surprise Elements
                </label>
                <input
                  type="text"
                  value={birthdayMilestone}
                  onChange={(e) => setBirthdayMilestone(e.target.value)}
                  placeholder="e.g. 50th Golden Jubilee with Surprise Tribute Video"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {category === 'community' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Community Focus & Attractions
                </label>
                <input
                  type="text"
                  value={communityType}
                  onChange={(e) => setCommunityType(e.target.value)}
                  placeholder="e.g. 20 Artisan Stalls, Live Folk Bands, Charity Raffle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Logistics & Inclusivity */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Dietary & Catering Guidelines
              </label>
              <textarea
                rows={2}
                value={dietaryRequirements}
                onChange={(e) => setDietaryRequirements(e.target.value)}
                placeholder="e.g. Jain food section, Nut-free pastries, Halal options"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Accessibility Accommodations
              </label>
              <textarea
                rows={2}
                value={accessibilityRequirements}
                onChange={(e) => setAccessibilityRequirements(e.target.value)}
                placeholder="e.g. Step-free wheelchair access, quiet sensory zone, sign language interpreter"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Additional Instructions for AI Planner
              </label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Specific preferences, constraints, weather backup notes, or must-have moments"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-white flex items-center justify-between">
                <span>{name || 'Untitled Event'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                  {category}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-400 pt-2 border-t border-slate-900">
                <div>
                  <span className="text-slate-500">Date:</span> {eventDate || 'Not set'}
                </div>
                <div>
                  <span className="text-slate-500">Duration:</span> {durationHours} Hours
                </div>
                <div>
                  <span className="text-slate-500">Location:</span> {location || 'TBD'}
                </div>
                <div>
                  <span className="text-slate-500">Guests:</span> {guestCount} attendees
                </div>
                <div>
                  <span className="text-slate-500">Budget:</span>{' '}
                  <span className="text-amber-400 font-semibold">
                    {currency} {totalBudget.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Theme:</span> {theme}
                </div>
              </div>
            </div>

            {/* AI Auto-Generation Toggle */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-bold text-slate-100">
                    Generate Complete Plan with Gemini AI
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Automatically architects budget distribution, tasks, vendors, and run-of-show.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoGenerateAi}
                onChange={(e) => setAutoGenerateAi(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
            </div>
          </div>
        )}

        {/* Wizard Footer Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
            >
              Continue to Step {step + 1}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Launching Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Event Plan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
