import type { GuestItem, GuestGroup, RsvpStatus } from '../types';
import { generateTicketCode } from './qrPass';

export interface ParsedCsvGuest {
  name: string;
  email?: string;
  phone?: string;
  group: GuestGroup;
  rsvpStatus: RsvpStatus;
  plusOnes: number;
  dietaryRequirements?: string;
  tableNumber?: string;
  notes?: string;
}

/**
 * Standard CSV Template content for downloading
 */
export const SAMPLE_CSV_TEMPLATE = `Full Name,Email,Phone,Group,RSVP Status,Plus Ones,Table Number,Dietary Requirements,Notes
Aarav Sharma,aarav@example.com,+91 9876543210,family,attending,1,Table 1,Jain Vegetarian,Groom's cousin
Priya Patel,priya.p@example.com,+91 9876543211,friend,attending,0,Table 2,Nut Allergy,College friend
Vikram Malhotra,vikram@corp.com,+91 9876543212,vip,pending,2,Table VIP,Standard,Keynote Speaker
Sunita Rao,sunita.rao@example.com,+91 9876543213,colleague,attending,1,Table 3,Vegan,Head of Design
Rohan Verma,rohan.v@example.com,+91 9876543214,general,tentative,0,,Standard,RSVP via web
Neha Gupta,neha@example.com,+91 9876543215,friend,declined,0,,Standard,Out of country`;

/**
 * Parses raw CSV string handling quoted cells and multiple delimiters
 */
export function parseCsvRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === '\t') && !inQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Normalizes user header strings to internal fields
 */
function normalizeHeader(header: string): string {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('name') || clean === 'guest' || clean === 'attendee') return 'name';
  if (clean.includes('email') || clean === 'mail') return 'email';
  if (clean.includes('phone') || clean.includes('mobile') || clean === 'contact' || clean === 'tel') return 'phone';
  if (clean.includes('group') || clean.includes('category') || clean === 'type') return 'group';
  if (clean.includes('rsvp') || clean === 'status') return 'rsvpStatus';
  if (clean.includes('plus') || clean.includes('guestcount') || clean.includes('partysize') || clean === 'extras') return 'plusOnes';
  if (clean.includes('diet') || clean.includes('meal') || clean.includes('food')) return 'dietary';
  if (clean.includes('table') || clean === 'seating') return 'tableNumber';
  if (clean.includes('note') || clean.includes('comment') || clean === 'remark') return 'notes';
  return clean;
}

/**
 * Normalizes GuestGroup
 */
function normalizeGroup(val: string): GuestGroup {
  const v = val.toLowerCase().trim();
  if (v.includes('fam')) return 'family';
  if (v.includes('friend')) return 'friend';
  if (v.includes('vip') || v.includes('hon')) return 'vip';
  if (v.includes('colleague') || v.includes('work') || v.includes('corp')) return 'colleague';
  return 'general';
}

/**
 * Normalizes RsvpStatus
 */
function normalizeRsvp(val: string): RsvpStatus {
  const v = val.toLowerCase().trim();
  if (v.includes('att') || v.includes('yes') || v.includes('confirm') || v.includes('accept')) return 'attending';
  if (v.includes('dec') || v.includes('no') || v.includes('reject')) return 'declined';
  if (v.includes('tent') || v.includes('may')) return 'tentative';
  return 'pending';
}

/**
 * Converts parsed CSV rows into typed GuestItem entities
 */
export function processCsvToGuests(
  csvText: string,
  eventId: string,
  userId: string
): { guests: GuestItem[]; errors: string[]; parsedCount: number } {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return {
      guests: [],
      errors: ['The CSV file must contain a header row and at least one guest row.'],
      parsedCount: 0,
    };
  }

  const rawHeaders = rows[0];
  const headerMap: Record<number, string> = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[idx] = normalizeHeader(h);
  });

  const guests: GuestItem[] = [];
  const errors: string[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const item: Partial<ParsedCsvGuest> = {};

    row.forEach((cell, colIdx) => {
      const field = headerMap[colIdx];
      if (!field) return;

      if (field === 'name') item.name = cell;
      else if (field === 'email') item.email = cell;
      else if (field === 'phone') item.phone = cell;
      else if (field === 'group') item.group = normalizeGroup(cell);
      else if (field === 'rsvpStatus') item.rsvpStatus = normalizeRsvp(cell);
      else if (field === 'plusOnes') {
        const parsed = parseInt(cell.replace(/[^0-9]/g, ''), 10);
        item.plusOnes = isNaN(parsed) ? 0 : parsed;
      } else if (field === 'dietary') item.dietaryRequirements = cell;
      else if (field === 'tableNumber') item.tableNumber = cell;
      else if (field === 'notes') item.notes = cell;
    });

    if (!item.name || item.name.trim().length === 0) {
      errors.push(`Row ${rowIndex + 1}: Skipped because Guest Name is missing.`);
      continue;
    }

    const guestId = `gst_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticketCode = generateTicketCode(eventId, guestId);

    const guest: GuestItem = {
      id: guestId,
      eventId,
      userId,
      name: item.name.trim(),
      email: item.email?.trim() || '',
      phone: item.phone?.trim() || '',
      group: item.group || 'general',
      rsvpStatus: item.rsvpStatus || 'pending',
      plusOnes: item.plusOnes ?? 0,
      dietaryRequirements: item.dietaryRequirements?.trim() || '',
      tableNumber: item.tableNumber?.trim() || '',
      notes: item.notes?.trim() || '',
      ticketCode,
      checkInStatus: 'not_checked_in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    guests.push(guest);
  }

  return {
    guests,
    errors,
    parsedCount: guests.length,
  };
}

/**
 * Downloads a text file (such as sample CSV)
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
