import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  calculateTaskProgress,
  validateEventInput,
  calculateDaysRemaining,
} from '../src/utils/budgetCalculations';
import type { ExpenseItem, TaskItem } from '../src/types';

describe('Budget Calculations', () => {
  it('correctly calculates budget summary with zero expenses', () => {
    const summary = calculateBudgetSummary(500000, []);
    expect(summary.totalBudget).toBe(500000);
    expect(summary.actualExpenses).toBe(0);
    expect(summary.remainingBalance).toBe(500000);
    expect(summary.utilizationPercentage).toBe(0);
  });

  it('correctly sums multiple expenses and calculates remaining and percentage', () => {
    const expenses: ExpenseItem[] = [
      {
        id: '1',
        eventId: 'e1',
        userId: 'u1',
        category: 'Venue',
        description: 'Palace Hall advance',
        amount: 150000,
        plannedAmount: 160000,
        date: '2026-11-01',
        paidStatus: 'paid',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
      {
        id: '2',
        eventId: 'e1',
        userId: 'u1',
        category: 'Catering',
        description: 'Buffet booking',
        amount: 100000,
        plannedAmount: 120000,
        date: '2026-11-02',
        paidStatus: 'deposit_paid',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
    ];

    const summary = calculateBudgetSummary(500000, expenses);
    expect(summary.totalBudget).toBe(500000);
    expect(summary.actualExpenses).toBe(250000);
    expect(summary.remainingBalance).toBe(250000);
    expect(summary.utilizationPercentage).toBe(50);
    expect(summary.categoryBreakdown.Venue.spent).toBe(150000);
    expect(summary.categoryBreakdown.Catering.spent).toBe(100000);
  });

  it('handles over-budget scenarios gracefully', () => {
    const expenses: ExpenseItem[] = [
      {
        id: '1',
        eventId: 'e1',
        userId: 'u1',
        category: 'Decoration',
        description: 'Luxury floral arches',
        amount: 600000,
        date: '2026-11-01',
        paidStatus: 'paid',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
    ];

    const summary = calculateBudgetSummary(500000, expenses);
    expect(summary.actualExpenses).toBe(600000);
    expect(summary.remainingBalance).toBe(-100000);
    expect(summary.utilizationPercentage).toBe(120);
  });
});

describe('Task Progress Calculations', () => {
  it('handles empty task list', () => {
    const progress = calculateTaskProgress([]);
    expect(progress.total).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('calculates correct completion percentage', () => {
    const tasks: TaskItem[] = [
      {
        id: 't1',
        eventId: 'e1',
        userId: 'u1',
        title: 'Book Photographer',
        category: 'Media',
        priority: 'high',
        isCompleted: true,
        source: 'ai',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
      {
        id: 't2',
        eventId: 'e1',
        userId: 'u1',
        title: 'Sample Cake',
        category: 'Catering',
        priority: 'medium',
        isCompleted: false,
        source: 'custom',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
      {
        id: 't3',
        eventId: 'e1',
        userId: 'u1',
        title: 'Send Invitations',
        category: 'Logistics',
        priority: 'urgent',
        isCompleted: true,
        source: 'ai',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
      {
        id: 't4',
        eventId: 'e1',
        userId: 'u1',
        title: 'Order Favors',
        category: 'Miscellaneous',
        priority: 'low',
        isCompleted: false,
        source: 'custom',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
    ];

    const progress = calculateTaskProgress(tasks);
    expect(progress.total).toBe(4);
    expect(progress.completed).toBe(2);
    expect(progress.pending).toBe(2);
    expect(progress.percentage).toBe(50);
  });
});

describe('Event Input Validation', () => {
  it('validates a correct event payload', () => {
    const valid = validateEventInput({
      name: 'Aarav & Maya Wedding',
      category: 'wedding',
      eventDate: '2026-12-15',
      totalBudget: 800000,
      guestCount: 300,
      location: 'Grand Ballroom, Bengaluru',
    });
    expect(valid.valid).toBe(true);
    expect(Object.keys(valid.errors).length).toBe(0);
  });

  it('detects missing name, negative budget, and invalid guest count', () => {
    const invalid = validateEventInput({
      name: '',
      category: 'birthday',
      eventDate: '2026-12-15',
      totalBudget: -500,
      guestCount: 0,
      location: '',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.name).toBeDefined();
    expect(invalid.errors.totalBudget).toBeDefined();
    expect(invalid.errors.guestCount).toBeDefined();
    expect(invalid.errors.location).toBeDefined();
  });
});

describe('Date and Countdown Calculations', () => {
  it('calculates future event countdown', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split('T')[0];

    const result = calculateDaysRemaining(dateStr);
    expect(result.isPast).toBe(false);
    expect(result.days).toBeGreaterThanOrEqual(29);
  });
});
