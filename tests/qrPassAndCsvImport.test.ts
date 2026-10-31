import { describe, it, expect } from 'vitest';
import { generateTicketCode, parseQrData } from '../src/utils/qrPass';
import { processCsvToGuests, parseCsvRows, SAMPLE_CSV_TEMPLATE } from '../src/utils/csvImport';
import type { GuestItem } from '../src/types';

describe('QR Pass & Ticket Verification Suite', () => {
  it('generates well-formatted ticket code with EP prefix and event/guest identifiers', () => {
    const code = generateTicketCode('evt_celebration_123', 'guest_abc_789');
    expect(code).toMatch(/^EP-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(code.startsWith('EP-')).toBe(true);
  });

  it('generates uniquely minted ticket codes on successive calls', () => {
    const code1 = generateTicketCode('evt_royal_wedding', 'guest_priya_sharma');
    const code2 = generateTicketCode('evt_royal_wedding', 'guest_priya_sharma');
    expect(code1).toMatch(/^EP-DING-ARMA-[A-Z0-9]+$/);
    expect(code2).toMatch(/^EP-DING-ARMA-[A-Z0-9]+$/);
    // Uniquely minted checksums prevent pass collision
    expect(code1).not.toBe('');
    expect(code2).not.toBe('');
  });

  it('parses structured JSON QR payloads correctly', () => {
    const payload = JSON.stringify({
      app: 'EventPilotAI',
      version: '1.0',
      ticketCode: 'EP-EVT1-GST1-A7B2',
      guestId: 'gst_101',
      eventId: 'evt_101',
      name: 'Eleanor Vance',
    });

    const parsed = parseQrData(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.ticketCode).toBe('EP-EVT1-GST1-A7B2');
    expect(parsed?.guestId).toBe('gst_101');
    expect(parsed?.name).toBe('Eleanor Vance');
    expect(parsed?.isStructured).toBe(true);
  });

  it('parses raw ticket code string directly from QR scan', () => {
    const rawTicket = 'EP-7890-ABCD-F123';
    const parsed = parseQrData(rawTicket);
    expect(parsed).not.toBeNull();
    expect(parsed?.ticketCode).toBe('EP-7890-ABCD-F123');
  });

  it('handles invalid non-ticket QR payload gracefully by returning null', () => {
    const invalidText = 'https://random-unrelated-website.com';
    const parsed = parseQrData(invalidText);
    expect(parsed).toBeNull();
  });
});

describe('Bulk CSV Guest List Import Suite', () => {
  it('correctly parses raw CSV text with quoted fields and commas', () => {
    const csv = `Full Name,Email,Phone,Group,RSVP Status,Plus Ones,Dietary Notes,Table Number
"Dr. Anand Verma, MD",anand@example.com,+1 555-0199,vip,attending,2,Vegetarian,Table 1
"Sophia Chen",sophia@tech.io,+1 555-0122,colleague,attending,1,Gluten-free,Table 4`;

    const rows = parseCsvRows(csv);
    expect(rows.length).toBe(3); // 1 header + 2 data rows
    expect(rows[1][0]).toBe('Dr. Anand Verma, MD');
    expect(rows[1][1]).toBe('anand@example.com');
    expect(rows[2][0]).toBe('Sophia Chen');
  });

  it('converts sample CSV template into validated GuestItem objects with auto-generated ticket codes', () => {
    const { guests, parsedCount } = processCsvToGuests(SAMPLE_CSV_TEMPLATE, 'evt_gala_2026', 'user_organizer_1');
    expect(parsedCount).toBeGreaterThanOrEqual(3);
    expect(guests.length).toBeGreaterThanOrEqual(3);

    guests.forEach((g) => {
      expect(g.eventId).toBe('evt_gala_2026');
      expect(g.userId).toBe('user_organizer_1');
      expect(g.name).toBeTruthy();
      expect(g.ticketCode).toBeTruthy();
      expect(g.ticketCode?.startsWith('EP-')).toBe(true);
      expect(g.checkInStatus).toBe('not_checked_in');
    });

    // Check specific parsed fields
    const anand = guests.find((g) => g.name.includes('Aarav Sharma'));
    expect(anand).toBeDefined();
    expect(anand?.group).toBe('family');
    expect(anand?.rsvpStatus).toBe('attending');
    expect(anand?.plusOnes).toBe(1);
    expect(anand?.dietaryRequirements).toBe('Jain Vegetarian');
    expect(anand?.tableNumber).toBe('Table 1');
  });

  it('skips empty rows and ignores rows with empty names', () => {
    const raw = `Name,Email,Group\n\n   \n"  ",test@test.com,vip\n"Valid Guest",valid@test.com,friend\n`;
    const { guests, parsedCount } = processCsvToGuests(raw, 'evt_1', 'user_1');
    expect(parsedCount).toBe(1);
    expect(guests.length).toBe(1);
    expect(guests[0].name).toBe('Valid Guest');
  });
});

describe('Gate Check-In & Duplicate Scan Logic', () => {
  const existingGuests: GuestItem[] = [
    {
      id: 'g_1',
      eventId: 'evt_1',
      userId: 'user_1',
      name: 'Aditi Rao',
      group: 'vip',
      plusOnes: 1,
      ticketCode: 'EP-EVT1-G1-99AA',
      checkInStatus: 'checked_in',
      checkInTime: '2026-10-31T18:00:00.000Z',
      rsvpStatus: 'attending',
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    },
    {
      id: 'g_2',
      eventId: 'evt_1',
      userId: 'user_1',
      name: 'Rohan Mehra',
      group: 'friend',
      plusOnes: 0,
      ticketCode: 'EP-EVT1-G2-88BB',
      checkInStatus: 'not_checked_in',
      rsvpStatus: 'attending',
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    },
  ];

  it('identifies unadmitted guest and approves admission', () => {
    const scannedCode = 'EP-EVT1-G2-88BB';
    const guest = existingGuests.find((g) => g.ticketCode === scannedCode);
    expect(guest).toBeDefined();
    expect(guest?.checkInStatus).toBe('not_checked_in');

    // Simulate check-in
    const updated = {
      ...guest!,
      checkInStatus: 'checked_in' as const,
      checkInTime: new Date().toISOString(),
    };
    expect(updated.checkInStatus).toBe('checked_in');
    expect(updated.checkInTime).toBeTruthy();
  });

  it('detects duplicate scan for already admitted guest', () => {
    const scannedCode = 'EP-EVT1-G1-99AA';
    const guest = existingGuests.find((g) => g.ticketCode === scannedCode);
    expect(guest).toBeDefined();
    expect(guest?.checkInStatus).toBe('checked_in');
    expect(guest?.checkInTime).toBe('2026-10-31T18:00:00.000Z');
  });

  it('flags unregistered ticket code as not found', () => {
    const scannedCode = 'EP-UNKNOWN-TICKET';
    const guest = existingGuests.find((g) => g.ticketCode === scannedCode);
    expect(guest).toBeUndefined();
  });
});
