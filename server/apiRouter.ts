import express from 'express';
import { z } from 'zod';
import { ai, GEMINI_MODEL } from './gemini.ts';

export const apiRouter = express.Router();
apiRouter.use(express.json({ limit: '2mb' }));

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Zod schemas for input validation
const eventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  category: z.enum(['wedding', 'birthday', 'community', 'other']),
  eventDate: z.string().min(1),
  location: z.string().min(1).max(300),
  guestCount: z.number().int().min(1).max(50000),
  totalBudget: z.number().min(0),
  currency: z.string().min(1).max(10),
  durationHours: z.number().min(0.5).max(168).optional().default(5),
  theme: z.string().max(200).optional().default('Classic & Elegant'),
  dietaryRequirements: z.string().max(500).optional().default('None'),
  accessibilityRequirements: z.string().max(500).optional().default('None'),
  additionalNotes: z.string().max(2000).optional().default(''),
});

const generatePlanSchema = z.object({
  event: eventSchema,
});

const regenerateSectionSchema = z.object({
  event: eventSchema,
  section: z.enum([
    'budgetDistribution',
    'preparationMilestones',
    'taskChecklist',
    'vendorRequirements',
    'dayOfSchedule',
    'decorationIdeas',
    'cateringSuggestions',
    'guestManagement',
  ]),
  userInstructions: z.string().max(1000).optional().default(''),
});

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  event: eventSchema.optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional().default([]),
  contextData: z.object({
    actualExpenses: z.number().optional(),
    remainingBudget: z.number().optional(),
    completedTasksCount: z.number().optional(),
    totalTasksCount: z.number().optional(),
    vendorCount: z.number().optional(),
  }).optional(),
});

// Helper: Call promise with timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs = 45000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI Request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Helper: Call Gemini with timeout and retry
async function callGeminiWithRetry(params: any, maxRetries = 1, timeoutMs = 45000) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await withTimeout(ai.models.generateContent(params), timeoutMs);
    } catch (err: any) {
      attempt++;
      const isTransient =
        err?.status === 503 ||
        err?.message?.includes('503') ||
        err?.status === 429 ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('timed out');

      if (isTransient && attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      throw err;
    }
  }
}

// Fallback high-fidelity algorithmic plan builder if API is temporarily experiencing high demand
function generateAlgorithmicPlan(event: z.infer<typeof eventSchema>) {
  const b = event.totalBudget;
  const isWedding = event.category === 'wedding';
  const isBirthday = event.category === 'birthday';

  const budgetDistribution = isWedding
    ? [
        { category: 'Venue', suggestedAmount: Math.round(b * 0.32), percentage: 32, description: 'Palace ballroom / lawn advance and basic facility infrastructure' },
        { category: 'Catering', suggestedAmount: Math.round(b * 0.28), percentage: 28, description: 'Multi-course banquet with dedicated dietary live counters' },
        { category: 'Decoration', suggestedAmount: Math.round(b * 0.15), percentage: 15, description: 'Mandap floral architecture, entryway arches & canopy lights' },
        { category: 'Photography', suggestedAmount: Math.round(b * 0.10), percentage: 10, description: 'Cinematic video team, candid photography & drone footage' },
        { category: 'Entertainment', suggestedAmount: Math.round(b * 0.07), percentage: 7, description: 'Live wedding band, DJ setup & acoustic musicians' },
        { category: 'Transportation', suggestedAmount: Math.round(b * 0.03), percentage: 3, description: 'Guest transit shuttles and emergency logistics' },
        { category: 'Invitations', suggestedAmount: Math.round(b * 0.02), percentage: 2, description: 'Digital video cards with RSVP tracking and venue directions' },
        { category: 'Miscellaneous', suggestedAmount: Math.round(b * 0.03), percentage: 3, description: 'Contingency reserve for unexpected on-day supplies' },
      ]
    : isBirthday
    ? [
        { category: 'Venue', suggestedAmount: Math.round(b * 0.30), percentage: 30, description: 'Private lounge or rooftop rental with AV support' },
        { category: 'Catering', suggestedAmount: Math.round(b * 0.32), percentage: 32, description: 'Artisan appetizers, bespoke cake, and beverage bar' },
        { category: 'Decoration', suggestedAmount: Math.round(b * 0.18), percentage: 18, description: 'Neon backdrop, organic balloon garlands, photo-booth' },
        { category: 'Photography', suggestedAmount: Math.round(b * 0.08), percentage: 8, description: 'Event photographer capturing candids and group portraits' },
        { category: 'Entertainment', suggestedAmount: Math.round(b * 0.08), percentage: 8, description: 'DJ, emcee host, and customized interactive party games' },
        { category: 'Miscellaneous', suggestedAmount: Math.round(b * 0.04), percentage: 4, description: 'Favors, custom gift bags & contingency fund' },
      ]
    : [
        { category: 'Venue', suggestedAmount: Math.round(b * 0.25), percentage: 25, description: 'Community hall, open ground, or municipal amphitheatre permit' },
        { category: 'Catering', suggestedAmount: Math.round(b * 0.35), percentage: 35, description: 'Community food stalls, refreshments & potable water stations' },
        { category: 'Decoration', suggestedAmount: Math.round(b * 0.12), percentage: 12, description: 'Signage, entryway banners, and festive fair lighting' },
        { category: 'Entertainment', suggestedAmount: Math.round(b * 0.15), percentage: 15, description: 'Stage PA system, lighting, folk dancers, and speakers' },
        { category: 'Miscellaneous', suggestedAmount: Math.round(b * 0.13), percentage: 13, description: 'Waste management, first aid station & sanitation facilities' },
      ];

  const preparationMilestones = [
    { title: 'Lock Location Contract & Security Permits', description: 'Confirm booking, review noise curfew hours, and verify electrical power load.', targetDateOffsetDays: -60, priority: 'high' as const },
    { title: 'Vendor Shortlisting & Menu Sampling', description: 'Conduct food tasting session, inspect decorative swatches, and lock contracts.', targetDateOffsetDays: -30, priority: 'high' as const },
    { title: 'Send Formal Invitations & RSVP Link', description: 'Distribute interactive cards with dietary preference survey and maps.', targetDateOffsetDays: -21, priority: 'medium' as const },
    { title: 'Final Technical Run & Day-Of Rehearsal', description: 'Test microphone levels, verify sequence of events, and conduct coordinator briefing.', targetDateOffsetDays: -2, priority: 'high' as const },
  ];

  const taskChecklist = [
    { title: 'Finalize dietary and allergy requirements', description: 'Share exact count of vegan/Jain meals with head chef.', category: 'Catering', priority: 'urgent' as const, suggestedDaysBeforeEvent: 14 },
    { title: 'Confirm photographer arrival time and shot list', description: 'List key VIP family members and must-capture moments.', category: 'Media', priority: 'high' as const, suggestedDaysBeforeEvent: 10 },
    { title: 'Review accessibility access and ramps', description: 'Ensure barrier-free entrance for elderly and wheelchair guests.', category: 'Logistics', priority: 'high' as const, suggestedDaysBeforeEvent: 7 },
    { title: 'Prepare day-of emergency cash and coordinator kit', description: 'Safety pins, first-aid tape, backup power banks, printed run-sheet.', category: 'Miscellaneous', priority: 'medium' as const, suggestedDaysBeforeEvent: 2 },
  ];

  const vendorRequirements = [
    { name: 'Catering & Banquet Specialists', category: 'Catering', estimatedCost: Math.round(b * 0.3), priority: 'High', tips: 'Insist on a 1:15 server-to-guest ratio and fresh replenishment guarantees.' },
    { name: 'Scenic Floral & Ambient Decor Studio', category: 'Decoration', estimatedCost: Math.round(b * 0.16), priority: 'High', tips: 'Confirm load-in times with venue to avoid overtime penalties.' },
    { name: 'Cinematic Visuals Team', category: 'Photography', estimatedCost: Math.round(b * 0.1), priority: 'Medium', tips: 'Request full raw files plus edited highlights in agreement.' },
  ];

  const dayOfSchedule = [
    { time: '03:00 PM', title: 'Vendor Load-In & Audio Soundcheck', description: 'Decorators complete stage setup; sound engineers calibrate microphones.' },
    { time: '05:00 PM', title: 'Guest Arrival & Welcome Refreshments', description: 'Welcome beverages served; hospitality team guides attendees to seats.' },
    { time: '06:00 PM', title: 'Main Ceremonial Program / Highlights', description: 'Key milestones, performances, or ceremonial rites take center stage.' },
    { time: '07:30 PM', title: 'Grand Banquet Dinner Service', description: 'Buffet stations open; ambient live music creates celebratory atmosphere.' },
    { time: '10:00 PM', title: 'Closing Celebrations & Departure Favors', description: 'Farewell toast, distribution of gift hampers, and guest departures.' },
  ];

  return {
    overview: `Master strategic blueprint for ${event.name} (${event.category}), designed for ${event.guestCount} guests in ${event.location}. The plan maximizes experience within a total budget of ${event.currency} ${event.totalBudget.toLocaleString()} based on your theme "${event.theme}".`,
    budgetDistribution,
    preparationMilestones,
    taskChecklist,
    vendorRequirements,
    dayOfSchedule,
    decorationIdeas: [
      `Theme Anchor: Bespoke ${event.theme} visual style featuring warm accent illumination and organic floral focal points.`,
      'Photo Moment: Curated interactive backdrop with dimensional typography and celebratory lighting.',
      'Table Scaping: Low-profile floral arrangements allowing natural guest conversation across dinner tables.',
      'Ambient Glow: Dimmable warm fairy lights and brass lantern lanterns illuminating high-traffic corridors.',
    ],
    cateringSuggestions: [
      `Balanced banquet spread tailored for ${event.guestCount} attendees with distinct consideration for: ${event.dietaryRequirements}.`,
      'Live specialty counter offering hot appetizers prepared fresh to order.',
      'Signature celebration beverage bar with refreshing botanical infusions.',
      'Dessert gallery featuring dual traditional and modern sweet selections.',
    ],
    guestManagement: [
      'Digital RSVP management with automated SMS / WhatsApp reminders 14 days and 48 hours prior.',
      'Dedicated guest welcome concierge at venue entrance to direct traffic and manage coats.',
      `Provisions for elder and accessible comfort: ${event.accessibilityRequirements}.`,
      'Curated gift bags or token favors distributed at departure as lasting celebration mementos.',
    ],
    personalizedRecommendations: [
      `Cost Optimizer: Allocate ~60% of budget to Venue & Food; save on decor by focusing floral budget on the primary stage rather than peripheral areas.`,
      'Pacing Strategy: Keep formal speeches and ceremonial intervals under 35 minutes to maintain peak guest engagement.',
      'Contingency Buffer: Maintain a 5-10% uncommitted contingency reserve to absorb unexpected vendor overtime.',
      'Weather Preparedness: Ensure venue holds indoor backup halls or heavy canopy structures ready in case of unexpected rain.',
    ],
  };
}

// Endpoint: Generate Full AI Plan
apiRouter.post('/ai/plan', async (req, res) => {
  try {
    const parseResult = generatePlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: parseResult.error.issues,
      });
    }

    const { event } = parseResult.data;

    const systemPrompt = `You are EventPilot AI, an elite, world-class certified event planner and budget strategist specializing in weddings, birthdays, and community gatherings.
Generate a comprehensive, actionable, realistic, and highly creative event plan based strictly on the user's provided event details.
Note: You are providing planning recommendations and estimates. Clearly recognize all financial amounts as estimates.
Return pure JSON only conforming to the requested schema. No markdown ticks outside the JSON.`;

    const userPrompt = `Generate a complete event master plan for:
Event Name: ${event.name}
Category: ${event.category}
Date: ${event.eventDate}
Location: ${event.location}
Guest Count: ${event.guestCount} people
Total Budget: ${event.currency} ${event.totalBudget}
Duration: ${event.durationHours} hours
Theme/Aesthetic: ${event.theme}
Dietary Notes: ${event.dietaryRequirements}
Accessibility Notes: ${event.accessibilityRequirements}
Additional Instructions: ${event.additionalNotes}

Produce JSON adhering to this exact structure:
{
  "overview": "Engaging 2-3 paragraph summary detailing the event vision, pacing, and core experience.",
  "budgetDistribution": [
    {
      "category": "Venue | Catering | Decoration | Photography | Entertainment | Transportation | Clothing | Invitations | Miscellaneous",
      "suggestedAmount": number,
      "percentage": number,
      "description": "Specific rationale and recommendations for this category"
    }
  ],
  "preparationMilestones": [
    {
      "title": "Title of milestone",
      "description": "Clear action steps and requirements",
      "targetDateOffsetDays": number,
      "priority": "low | medium | high"
    }
  ],
  "taskChecklist": [
    {
      "title": "Actionable task title",
      "description": "Clear instructions for completing the task",
      "category": "Venue | Catering | Decoration | Logistics | Invitations | Entertainment",
      "priority": "low | medium | high | urgent",
      "suggestedDaysBeforeEvent": number
    }
  ],
  "vendorRequirements": [
    {
      "name": "Recommended Vendor Title",
      "category": "Venue | Catering | Decoration | Photography | Entertainment | Transportation | Miscellaneous",
      "estimatedCost": number,
      "priority": "High | Medium | Optional",
      "tips": "Pro-tips on questions to ask and contract specifications"
    }
  ],
  "dayOfSchedule": [
    {
      "time": "e.g. 09:00 AM",
      "title": "Milestone / Activity name",
      "description": "Detailed coordinator notes and cue points"
    }
  ],
  "decorationIdeas": ["Idea 1", "Idea 2", "Idea 3", "Idea 4"],
  "cateringSuggestions": ["Menu 1", "Drink pairing", "Dessert highlight", "Service style"],
  "guestManagement": ["RSVP tip", "Flow tip", "Accessibility tip", "Favors"],
  "personalizedRecommendations": ["Cost saving tip", "Weather backup", "Memorable touchpoint", "Coordination tip"]
}
Ensure sum of suggested amounts in budgetDistribution approximately matches the total budget of ${event.currency} ${event.totalBudget}.`;

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      }, 1, 50000);

      const rawText = response?.text || '{}';
      let parsedPlan;
      try {
        parsedPlan = JSON.parse(rawText);
      } catch {
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedPlan = JSON.parse(cleanJson);
      }

      return res.json({
        success: true,
        plan: parsedPlan,
        source: 'gemini',
      });
    } catch (aiErr) {
      console.warn('Gemini temporary spike/unavailable, generating graceful tailored blueprint:', aiErr);
      const fallback = generateAlgorithmicPlan(event);
      return res.json({
        success: true,
        plan: fallback,
        source: 'resilient_fallback',
      });
    }
  } catch (error) {
    console.error('Error in plan generation endpoint:', error);
    res.status(500).json({
      error: 'Failed to process event plan request.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Endpoint: Regenerate a specific section
apiRouter.post('/ai/regenerate-section', async (req, res) => {
  try {
    const parseResult = regenerateSectionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: parseResult.error.issues,
      });
    }

    const { event, section, userInstructions } = parseResult.data;

    try {
      const systemPrompt = `You are EventPilot AI, an elite event planner. Regenerate ONLY the requested section: "${section}".
Ensure it is tailored specifically to:
Event: ${event.name} (${event.category})
Budget: ${event.currency} ${event.totalBudget}
Guests: ${event.guestCount}
User Custom Guidance: ${userInstructions || 'None'}
Return pure JSON with the field "${section}" containing the regenerated items.`;

      const prompt = `Regenerate the "${section}" section for ${event.name} with extra guidance: "${userInstructions}".
Return JSON format: { "${section}": ... }`;

      const response = await callGeminiWithRetry({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      }, 1, 30000);

      const rawText = response?.text || '{}';
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      }

      return res.json({
        success: true,
        section,
        data: parsed[section] || parsed,
      });
    } catch (aiErr) {
      console.warn('Gemini unavailable during section regen, generating algorithmic section:', aiErr);
      const fullPlan = generateAlgorithmicPlan(event);
      return res.json({
        success: true,
        section,
        data: (fullPlan as any)[section] || [],
      });
    }
  } catch (error) {
    console.error('Error regenerating section:', error);
    res.status(500).json({
      error: 'Failed to regenerate section.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Endpoint: Context-Aware Conversational Assistant
apiRouter.post('/ai/chat', async (req, res) => {
  try {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid chat message',
        details: parseResult.error.issues,
      });
    }

    const { message, event, history, contextData } = parseResult.data;

    let eventContext = 'No specific event currently selected.';
    if (event) {
      eventContext = `Currently Selected Event:
- Name: ${event.name}
- Category: ${event.category}
- Date: ${event.eventDate}
- Location: ${event.location}
- Guests: ${event.guestCount}
- Total Budget: ${event.currency} ${event.totalBudget}
- Theme: ${event.theme}
- Dietary: ${event.dietaryRequirements}
- Accessibility: ${event.accessibilityRequirements}
- Special Notes: ${event.additionalNotes}
`;
    }

    if (contextData) {
      eventContext += `
Real-time Tracker Stats:
- Actual Expenses Incurred: ${contextData.actualExpenses ?? 0}
- Remaining Budget: ${contextData.remainingBudget ?? 0}
- Completed Tasks: ${contextData.completedTasksCount ?? 0} of ${contextData.totalTasksCount ?? 0}
- Vendors Tracked: ${contextData.vendorCount ?? 0}
`;
    }

    const systemInstruction = `You are EventPilot Assistant, the intelligent event planning copilot embedded in EventPilot AI.
You provide empathetic, razor-sharp, practical advice, negotiation tactics, schedule suggestions, and budget tips.
Always ground your answers in the active event context provided.
If asked about budget savings, identify concrete compromises that protect the guest experience.
Format your responses with clean, readable markdown (bullet points, bold highlights, concise paragraphs).
Never fabricate confirmed vendor bookings or actual contracts; clearly state actionable estimates and checklist advice.`;

    const conversationHistory = history
      .slice(-6)
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const combinedPrompt = `${eventContext}

PREVIOUS CONVERSATION:
${conversationHistory || 'None'}

USER QUESTION:
${message}

Please provide a helpful, tailored response for this event:`;

    try {
      const response = await callGeminiWithRetry({
        model: GEMINI_MODEL,
        contents: combinedPrompt,
        config: {
          systemInstruction,
        },
      }, 1, 25000);

      const reply = response?.text || 'I am ready to help you plan your event. What would you like to explore next?';
      return res.json({
        success: true,
        reply,
      });
    } catch (aiErr) {
      console.warn('Gemini chat temporary spike/timeout, providing structured contextual response:', aiErr);
      let fallbackReply = `Here are strategic recommendations for **${event ? event.name : 'your celebration'}**:\n\n`;
      if (message.toLowerCase().includes('cater') || message.toLowerCase().includes('food') || message.toLowerCase().includes('budget')) {
        fallbackReply += `• **Streamline Appetizers:** Limit passed hors d'oeuvres to 4 signature high-impact items rather than an expansive 8-item spread.\n`;
        fallbackReply += `• **Portion & Service Style:** Family-style or buffet stations reduce service staffing fees by up to 22% compared to plated service.\n`;
        fallbackReply += `• **BYO Beverage Protocol:** Negotiate a flat corkage fee rather than venue-priced markups.\n`;
        fallbackReply += `• **Active Balance:** With ${event ? `${event.currency} ${(contextData?.remainingBudget ?? event.totalBudget).toLocaleString()}` : 'your target budget'} remaining, prioritize essential venue and culinary costs before locking peripheral rentals.`;
      } else if (message.toLowerCase().includes('decor') || message.toLowerCase().includes('theme')) {
        fallbackReply += `• **Concentrated Focal Points:** Rather than spreading decor thinly, concentrate 70% of the decor budget on the entrance arch and main ceremony stage where 90% of photographs happen.\n`;
        fallbackReply += `• **Ambient Lighting Magic:** Up-lighting and warm fairy canopies cost a fraction of floral installations and transform spaces after dusk.\n`;
        fallbackReply += `• **Botanical Greens:** Substitute expensive out-of-season blooms with lush monstera, eucalyptus, and regional seasonal flowers.`;
      } else {
        fallbackReply += `• **Timeline Priority:** Focus this week on securing primary vendor agreements (Venue, Catering, Media) before availability narrows.\n`;
        fallbackReply += `• **Vendor Negotiations:** Ask vendors for bundled off-peak or seasonal discounts, and ensure sound and generator backup clauses are written into agreements.\n`;
        fallbackReply += `• **Guest Experience:** Keep transition gaps between milestones under 20 minutes to maintain lively celebration momentum.`;
      }

      return res.json({
        success: true,
        reply: fallbackReply,
      });
    }
  } catch (error) {
    console.error('Error in AI chat assistant:', error);
    res.status(500).json({
      error: 'Failed to process AI chat message.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
