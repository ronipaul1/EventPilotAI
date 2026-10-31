import { describe, it, expect } from 'vitest';
import { z } from 'zod';

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

describe('AI API Schema & Input Security Validation', () => {
  it('accepts valid event payloads for Gemini planning', () => {
    const validPayload = {
      event: {
        name: 'Diwali Community Celebration',
        category: 'community' as const,
        eventDate: '2026-11-04',
        location: 'Civic Amphitheatre',
        guestCount: 500,
        totalBudget: 350000,
        currency: '₹',
        durationHours: 6,
        theme: 'Festival of Lights & Diyas',
        dietaryRequirements: 'Vegetarian and vegan sweets only',
        accessibilityRequirements: 'Wheelchair access ramp',
        additionalNotes: 'Need sound clearance until 10 PM',
      },
    };

    const parsed = generatePlanSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects malicious or invalid guest count and negative budgets', () => {
    const invalidPayload = {
      event: {
        name: 'Hack Test',
        category: 'invalid_category',
        eventDate: '',
        location: '',
        guestCount: -50,
        totalBudget: -1000,
        currency: 'INR_EXTREMELY_LONG_CURRENCY_STRING_OVERFLOW',
      },
    };

    const parsed = generatePlanSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issuePaths = parsed.error.issues.map((i) => i.path.join('.'));
      expect(issuePaths).toContain('event.category');
      expect(issuePaths).toContain('event.guestCount');
      expect(issuePaths).toContain('event.totalBudget');
    }
  });

  it('validates AI Master Plan structured response schema', () => {
    const planSchema = z.object({
      overview: z.string().min(10),
      budgetDistribution: z.array(
        z.object({
          category: z.string(),
          suggestedAmount: z.number(),
          percentage: z.number(),
          description: z.string(),
        })
      ),
      preparationMilestones: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          targetDateOffsetDays: z.number(),
          priority: z.enum(['low', 'medium', 'high']),
        })
      ),
      taskChecklist: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          category: z.string(),
          priority: z.enum(['low', 'medium', 'high', 'urgent']),
          suggestedDaysBeforeEvent: z.number(),
        })
      ),
      vendorRequirements: z.array(
        z.object({
          name: z.string(),
          category: z.string(),
          estimatedCost: z.number(),
          priority: z.string(),
          tips: z.string(),
        })
      ),
      dayOfSchedule: z.array(
        z.object({
          time: z.string(),
          title: z.string(),
          description: z.string(),
        })
      ),
      decorationIdeas: z.array(z.string()),
      cateringSuggestions: z.array(z.string()),
      guestManagement: z.array(z.string()),
      personalizedRecommendations: z.array(z.string()),
    });

    const mockAiOutput = {
      overview: 'A magnificent wedding celebration planned for 300 guests with traditional decor.',
      budgetDistribution: [
        { category: 'Venue', suggestedAmount: 200000, percentage: 40, description: 'Palace Hall' },
      ],
      preparationMilestones: [
        { title: 'Lock Venue', description: 'Pay deposit', targetDateOffsetDays: -60, priority: 'high' as const },
      ],
      taskChecklist: [
        {
          title: 'Review menu',
          description: 'Catering tasting',
          category: 'Catering',
          priority: 'high' as const,
          suggestedDaysBeforeEvent: 30,
        },
      ],
      vendorRequirements: [
        { name: 'Caterer', category: 'Catering', estimatedCost: 150000, priority: 'High', tips: 'Taste samples' },
      ],
      dayOfSchedule: [
        { time: '05:00 PM', title: 'Welcome Drinks', description: 'Guests arrive' },
      ],
      decorationIdeas: ['Marigold flower arches', 'Brass lamps'],
      cateringSuggestions: ['Live chaat station', 'Tandoori breads'],
      guestManagement: ['Digital RSVP tracking'],
      personalizedRecommendations: ['Book photography early'],
    };

    const parsed = planSchema.safeParse(mockAiOutput);
    expect(parsed.success).toBe(true);
  });
});
