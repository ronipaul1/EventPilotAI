import { describe, it, expect } from 'vitest';
import { parseTimeToMinutes, sortTimelineItems } from '../src/utils/timelineSorting';
import type { TimelineItem } from '../src/types';

describe('Timeline Timing Sorting Suite', () => {
  it('parses standard 12-hour AM and PM times accurately into minutes of the day', () => {
    expect(parseTimeToMinutes('09:00 AM')).toBe(540);
    expect(parseTimeToMinutes('10:00 AM')).toBe(600);
    expect(parseTimeToMinutes('11:30 AM')).toBe(690);
    expect(parseTimeToMinutes('12:00 PM')).toBe(720);
    expect(parseTimeToMinutes('1:00 PM')).toBe(780);
    expect(parseTimeToMinutes('1:30 PM')).toBe(810);
    expect(parseTimeToMinutes('3:00 PM')).toBe(900);
    expect(parseTimeToMinutes('3:30 PM')).toBe(930);
  });

  it('handles ranges and extracts the starting time', () => {
    expect(parseTimeToMinutes('09:00 AM - 10:00 AM')).toBe(540);
    expect(parseTimeToMinutes('10:00 AM - 10:30 AM')).toBe(600);
    expect(parseTimeToMinutes('1:30 PM - 2:30 PM')).toBe(810);
  });

  it('correctly handles 12:10 AM with end time in PM (12:10 AM - 1:00 PM) as midday noon', () => {
    expect(parseTimeToMinutes('12:10 AM - 1:00 PM')).toBe(730); // 12:10 PM
  });

  it('sorts user items from screenshot in exact chronological timing order', () => {
    // Exactly the 9 items from the user's screenshot in reverse entry order
    const screenshotItems: TimelineItem[] = [
      {
        id: '1',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Leave Note',
        priority: 'medium',
        status: 'pending',
        startTime: '3:30 PM',
        createdAt: '2026-10-31T09:00:00Z',
        updatedAt: '2026-10-31T09:00:00Z',
      },
      {
        id: '2',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Swags Distribution',
        priority: 'medium',
        status: 'pending',
        startTime: '3:00 PM',
        endTime: '3:30 PM',
        createdAt: '2026-10-31T08:50:00Z',
        updatedAt: '2026-10-31T08:50:00Z',
      },
      {
        id: '3',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Speech- Mrs. Mita',
        priority: 'medium',
        status: 'pending',
        startTime: '2:30 AM',
        endTime: '3:00 AM',
        createdAt: '2026-10-31T08:40:00Z',
        updatedAt: '2026-10-31T08:40:00Z',
      },
      {
        id: '4',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Lunch',
        priority: 'medium',
        status: 'pending',
        startTime: '1:30 PM',
        endTime: '2:30 PM',
        createdAt: '2026-10-31T08:30:00Z',
        updatedAt: '2026-10-31T08:30:00Z',
      },
      {
        id: '5',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Quiz',
        priority: 'medium',
        status: 'pending',
        startTime: '1:00 PM',
        endTime: '1:30 PM',
        createdAt: '2026-10-31T08:20:00Z',
        updatedAt: '2026-10-31T08:20:00Z',
      },
      {
        id: '6',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Speech- Mr. Alex',
        priority: 'high',
        status: 'pending',
        startTime: '12:10 AM',
        endTime: '1:00 PM',
        createdAt: '2026-10-31T08:10:00Z',
        updatedAt: '2026-10-31T08:10:00Z',
      },
      {
        id: '7',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Refreashments Distribution',
        priority: 'medium',
        status: 'pending',
        startTime: '11:30 AM',
        endTime: '12:00 AM',
        createdAt: '2026-10-31T08:00:00Z',
        updatedAt: '2026-10-31T08:00:00Z',
      },
      {
        id: '8',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Participants Entry',
        priority: 'medium',
        status: 'pending',
        startTime: '10:00 AM',
        endTime: '10:30 AM',
        createdAt: '2026-10-31T07:50:00Z',
        updatedAt: '2026-10-31T07:50:00Z',
      },
      {
        id: '9',
        eventId: 'evt_bootcamp',
        userId: 'u1',
        type: 'day_of',
        title: 'Guest Arrival',
        priority: 'high',
        status: 'pending',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        createdAt: '2026-10-31T07:40:00Z',
        updatedAt: '2026-10-31T07:40:00Z',
      },
    ];

    const sorted = sortTimelineItems(screenshotItems, 'timing_asc');
    const sortedTitles = sorted.map((s) => s.title);

    expect(sortedTitles).toEqual([
      'Guest Arrival', // 09:00 AM
      'Participants Entry', // 10:00 AM
      'Refreashments Distribution', // 11:30 AM
      'Speech- Mr. Alex', // 12:10 PM (normalized from 12:10 AM - 1:00 PM)
      'Quiz', // 1:00 PM
      'Lunch', // 1:30 PM
      'Speech- Mrs. Mita', // 2:30 PM (normalized from daytime context)
      'Swags Distribution', // 3:00 PM
      'Leave Note', // 3:30 PM
    ]);
  });

  it('sorts preparation milestones chronologically by date', () => {
    const milestones: TimelineItem[] = [
      {
        id: 'm1',
        eventId: 'evt_1',
        userId: 'u1',
        type: 'milestone',
        title: 'Final Headcount',
        priority: 'high',
        status: 'pending',
        date: '2026-11-20',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
      {
        id: 'm2',
        eventId: 'evt_1',
        userId: 'u1',
        type: 'milestone',
        title: 'Book Venue',
        priority: 'high',
        status: 'completed',
        date: '2026-10-01',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
      {
        id: 'm3',
        eventId: 'evt_1',
        userId: 'u1',
        type: 'milestone',
        title: 'Send Invitations',
        priority: 'medium',
        status: 'pending',
        date: '2026-10-15',
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      },
    ];

    const sorted = sortTimelineItems(milestones, 'timing_asc');
    expect(sorted.map((m) => m.title)).toEqual([
      'Book Venue', // 2026-10-01
      'Send Invitations', // 2026-10-15
      'Final Headcount', // 2026-11-20
    ]);
  });
});
