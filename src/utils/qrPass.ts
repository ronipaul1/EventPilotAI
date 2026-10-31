import QRCode from 'qrcode';
import type { GuestItem, EventItem } from '../types';

/**
 * Generates a unique, standardized Ticket Pass Code
 * Format: EP-[EVENT_SUFFIX]-[GUEST_SUFFIX]-[HEX_CHECKSUM]
 */
export function generateTicketCode(eventId: string, guestId: string): string {
  const cleanEvt = eventId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'EVNT';
  const cleanGst = guestId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'GUST';
  const checksum = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EP-${cleanEvt}-${cleanGst}-${checksum}`;
}

/**
 * Structured Pass Payload encoded inside the QR Code
 */
export interface QrPassPayload {
  app: 'EventPilotAI';
  version: '1.0';
  ticketCode: string;
  guestId: string;
  eventId: string;
  name: string;
  plusOnes: number;
  tableNumber?: string;
  issuedAt: string;
}

/**
 * Creates the encoded QR string and renders it to a PNG Data URL
 */
export async function generateQrCodeDataUrl(
  guest: GuestItem,
  event: EventItem
): Promise<{ dataUrl: string; rawPayload: string; ticketCode: string }> {
  const ticketCode = guest.ticketCode || generateTicketCode(event.id, guest.id);

  const payloadObj: QrPassPayload = {
    app: 'EventPilotAI',
    version: '1.0',
    ticketCode,
    guestId: guest.id,
    eventId: event.id,
    name: guest.name,
    plusOnes: guest.plusOnes || 0,
    tableNumber: guest.tableNumber || '',
    issuedAt: guest.createdAt || new Date().toISOString(),
  };

  const rawPayload = JSON.stringify(payloadObj);

  const dataUrl = await QRCode.toDataURL(rawPayload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#0f172a', // slate-900
      light: '#ffffff',
    },
  });

  return { dataUrl, rawPayload, ticketCode };
}

/**
 * Parses decoded QR scanner text to extract ticket credentials
 */
export function parseQrData(scannedText: string): {
  ticketCode?: string;
  guestId?: string;
  eventId?: string;
  name?: string;
  isStructured: boolean;
} | null {
  const trimmed = scannedText.trim();
  if (!trimmed) return null;

  // 1. Try parsing JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.ticketCode || parsed.guestId) {
        return {
          ticketCode: parsed.ticketCode,
          guestId: parsed.guestId,
          eventId: parsed.eventId,
          name: parsed.name || parsed.guestName,
          isStructured: true,
        };
      }
    } catch {
      // Not valid JSON, continue to raw check
    }
  }

  // 2. Check for EP- ticket code format
  const epMatch = trimmed.match(/EP-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+/i);
  if (epMatch) {
    return {
      ticketCode: epMatch[0].toUpperCase(),
      isStructured: false,
    };
  }

  // 3. Valid ticket code or alphanumeric ID fallback (4-64 characters)
  if (/^[a-zA-Z0-9_-]{4,64}$/.test(trimmed)) {
    return {
      ticketCode: trimmed,
      guestId: trimmed,
      isStructured: false,
    };
  }

  return null;
}

/**
 * Browser Audio Synthesizer for instant audible feedback
 * No external audio files needed; synthesized via Web Audio API!
 */
export function playScanSound(type: 'success' | 'warning' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'success') {
      // High harmonious double-chime (880Hz then 1320Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1320, now + 0.1); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
    } else if (type === 'warning') {
      // Double medium pulse for already checked-in
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(440, now + 0.12); // A4

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Low buzz for invalid ticket
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Graceful fallback if audio is disabled by policy
  }
}
