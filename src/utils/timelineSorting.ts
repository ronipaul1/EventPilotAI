import type { TimelineItem } from '../types';

/**
 * Extracts and converts a time string (e.g. "09:00 AM", "1:30 PM", "14:30", "09:00 AM - 10:00 AM")
 * into minutes from midnight (0 - 1439).
 *
 * Includes smart normalization for common user data-entry quirks:
 * - "12:xx AM - 1:00 PM" where start was entered as AM but is noon
 * - "2:30 AM" entered in a schedule where other activities are daytime (9 AM - 5 PM)
 */
export function parseTimeToMinutes(
  timeStr: string | undefined | null,
  contextItems?: Array<{ startTime?: string; endTime?: string }>
): number {
  if (!timeStr) return 99999;

  const raw = timeStr.trim();
  if (!raw) return 99999;

  // Extract the first time block, e.g. "09:00 AM" from "09:00 AM - 10:00 AM" or "3:30 PM"
  const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return 99999;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  let meridian = match[3] ? match[3].toLowerCase() : null;

  // Check if there is an explicit PM anywhere in the range (e.g. "12:10 AM - 1:00 PM")
  const hasPmLater = /-\s*\d{1,2}(?::\d{2})?\s*pm/i.test(raw);

  if (meridian) {
    // 1. Correct common 12:xx AM typo for 12:xx PM (noon)
    if (hours === 12 && meridian === 'am') {
      if (hasPmLater) {
        meridian = 'pm';
      } else if (contextItems && contextItems.length > 0) {
        const hasDaytimeActivity = contextItems.some((it) => {
          const s = (it.startTime || '').toLowerCase();
          return /([89]|1[01]):\d{2}\s*am/.test(s) || /pm/.test(s);
        });
        if (hasDaytimeActivity) {
          meridian = 'pm';
        }
      }
    }

    if (meridian === 'pm') {
      if (hours < 12) hours += 12;
    } else if (meridian === 'am') {
      if (hours === 12) {
        hours = 0;
      } else if (hours >= 1 && hours <= 6) {
        // 2. Correct common "2:30 AM" or "3:00 AM" when context is daytime event (8 AM - 8 PM)
        if (contextItems && contextItems.length > 0) {
          const daytimeMorningCount = contextItems.filter((it) => {
            const s = (it.startTime || '').toLowerCase();
            return /([89]|1[01]):\d{2}\s*am/.test(s);
          }).length;
          const afternoonPmCount = contextItems.filter((it) => {
            const s = (it.startTime || '').toLowerCase();
            return /pm/.test(s);
          }).length;

          // If event has multiple daytime items (e.g. 9 AM, 10 AM, 1 PM), 2:30 AM is an afternoon PM entry
          if (daytimeMorningCount + afternoonPmCount >= 2) {
            hours += 12;
          }
        }
      }
    }
  } else {
    // 24-hour format or naked numbers like "14:30" or "9:00"
    if (hours < 7 && contextItems) {
      const pmCount = contextItems.filter((it) => /pm/i.test(it.startTime || '')).length;
      if (pmCount > 0) {
        hours += 12;
      }
    }
  }

  return hours * 60 + minutes;
}

export type TimelineSortMode = 'timing_asc' | 'timing_desc' | 'entry_asc' | 'entry_desc';

/**
 * Sorts timeline items:
 * - Day-of items are sorted chronologically by start time (earliest morning first)
 * - Preparation milestones are sorted chronologically by target date (earliest first)
 */
export function sortTimelineItems(
  items: TimelineItem[],
  mode: TimelineSortMode = 'timing_asc'
): TimelineItem[] {
  const cloned = [...items];

  if (mode === 'entry_asc') {
    return cloned.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }
  if (mode === 'entry_desc') {
    return cloned.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  return cloned.sort((a, b) => {
    // 1. If Day-of Run of Show, sort by timing
    if (a.type === 'day_of' || b.type === 'day_of') {
      const timeA = parseTimeToMinutes(a.startTime, items);
      const timeB = parseTimeToMinutes(b.startTime, items);

      if (timeA !== timeB) {
        return mode === 'timing_asc' ? timeA - timeB : timeB - timeA;
      }

      // Tiebreaker 1: End time
      const endTimeA = parseTimeToMinutes(a.endTime, items);
      const endTimeB = parseTimeToMinutes(b.endTime, items);
      if (endTimeA !== endTimeB) {
        return mode === 'timing_asc' ? endTimeA - endTimeB : endTimeB - endTimeA;
      }

      // Tiebreaker 2: Title
      return a.title.localeCompare(b.title);
    }

    // 2. If Milestone, sort by target date
    const dateValA = a.date ? new Date(a.date).getTime() : 9999999999999;
    const dateValB = b.date ? new Date(b.date).getTime() : 9999999999999;

    if (dateValA !== dateValB) {
      return mode === 'timing_asc' ? dateValA - dateValB : dateValB - dateValA;
    }

    // Tiebreaker: Title
    return a.title.localeCompare(b.title);
  });
}
