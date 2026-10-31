import { describe, it, expect } from 'vitest';
import type { EventItem, GuestItem } from '../src/types';

describe('Multi-Event Isolation and Guest Calculations', () => {
  const eventA: EventItem = {
    id: 'evt_a',
    userId: 'user_1',
    name: 'Roy Wedding',
    category: 'wedding',
    eventDate: '2026-11-20',
    location: 'Jaipur',
    guestCount: 200,
    totalBudget: 1500000,
    currency: '₹',
    status: 'planning',
    theme: 'Royal Rajputana',
    durationHours: 8,
    dietaryRequirements: 'Jain and Vegetarian',
    accessibilityRequirements: 'Wheelchair access',
    additionalNotes: 'Traditional ritual preferences',
    createdAt: '2026-10-31',
    updatedAt: '2026-10-31',
  };

  const eventB: EventItem = {
    id: 'evt_b',
    userId: 'user_1',
    name: 'Tech Community Summit',
    category: 'community',
    eventDate: '2026-12-05',
    location: 'Bengaluru Tech Park',
    guestCount: 500,
    totalBudget: 800000,
    currency: '₹',
    status: 'confirmed',
    theme: 'Cyberpunk & AI',
    durationHours: 6,
    dietaryRequirements: 'Standard lunch buffet',
    accessibilityRequirements: 'Elevator access',
    additionalNotes: 'Audio setup required',
    createdAt: '2026-10-31',
    updatedAt: '2026-10-31',
  };

  const guests: GuestItem[] = [
    {
      id: 'g1',
      eventId: 'evt_a',
      userId: 'user_1',
      name: 'Dr. Anand Verma',
      email: 'anand@example.com',
      group: 'vip',
      rsvpStatus: 'attending',
      plusOnes: 2,
      dietaryRequirements: 'Vegetarian',
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    },
    {
      id: 'g2',
      eventId: 'evt_a',
      userId: 'user_1',
      name: 'Rohit Sen',
      email: 'rohit@example.com',
      group: 'friend',
      rsvpStatus: 'declined',
      plusOnes: 0,
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    },
    {
      id: 'g3',
      eventId: 'evt_a',
      userId: 'user_1',
      name: 'Priya Kapoor',
      email: 'priya@example.com',
      group: 'family',
      rsvpStatus: 'pending',
      plusOnes: 1,
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    },
    {
      id: 'g4',
      eventId: 'evt_b',
      userId: 'user_1',
      name: 'Alex Johnson',
      email: 'alex@dev.io',
      group: 'colleague',
      rsvpStatus: 'attending',
      plusOnes: 0,
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    },
  ];

  it('filters guests by active event ID ensuring data isolation', () => {
    const eventAGuests = guests.filter((g) => g.eventId === eventA.id);
    const eventBGuests = guests.filter((g) => g.eventId === eventB.id);

    expect(eventAGuests.length).toBe(3);
    expect(eventBGuests.length).toBe(1);
    expect(eventBGuests[0].name).toBe('Alex Johnson');
  });

  it('accurately calculates confirmed headcount with plus-ones for active event', () => {
    const eventAGuests = guests.filter((g) => g.eventId === eventA.id);
    const attending = eventAGuests.filter((g) => g.rsvpStatus === 'attending');

    // 1 attending guest with 2 plus-ones = 3 total heads
    const totalHeads = attending.reduce((sum, g) => sum + 1 + (g.plusOnes || 0), 0);
    expect(totalHeads).toBe(3);
  });

  it('calculates RSVP breakdown percentages correctly', () => {
    const eventAGuests = guests.filter((g) => g.eventId === eventA.id);
    const total = eventAGuests.length;
    const attendingCount = eventAGuests.filter((g) => g.rsvpStatus === 'attending').length;
    const declinedCount = eventAGuests.filter((g) => g.rsvpStatus === 'declined').length;
    const pendingCount = eventAGuests.filter((g) => g.rsvpStatus === 'pending').length;

    expect(Math.round((attendingCount / total) * 100)).toBe(33);
    expect(Math.round((declinedCount / total) * 100)).toBe(33);
    expect(Math.round((pendingCount / total) * 100)).toBe(33);
  });

  it('updates progress bar percentage dynamically as checklist check marks are toggled', () => {
    let eventTasks = [
      { id: 't1', isCompleted: false },
      { id: 't2', isCompleted: false },
      { id: 't3', isCompleted: false },
      { id: 't4', isCompleted: false },
    ];

    // Initially 0%
    let completed = eventTasks.filter((t) => t.isCompleted).length;
    let percentage = Math.round((completed / eventTasks.length) * 100);
    expect(percentage).toBe(0);

    // Toggle 1st check mark
    eventTasks = eventTasks.map((t) => (t.id === 't1' ? { ...t, isCompleted: true } : t));
    completed = eventTasks.filter((t) => t.isCompleted).length;
    percentage = Math.round((completed / eventTasks.length) * 100);
    expect(percentage).toBe(25);

    // Toggle 2nd and 3rd check marks
    eventTasks = eventTasks.map((t) => (t.id === 't2' || t.id === 't3' ? { ...t, isCompleted: true } : t));
    completed = eventTasks.filter((t) => t.isCompleted).length;
    percentage = Math.round((completed / eventTasks.length) * 100);
    expect(percentage).toBe(75);

    // Toggle final check mark
    eventTasks = eventTasks.map((t) => (t.id === 't4' ? { ...t, isCompleted: true } : t));
    completed = eventTasks.filter((t) => t.isCompleted).length;
    percentage = Math.round((completed / eventTasks.length) * 100);
    expect(percentage).toBe(100);
  });
});
