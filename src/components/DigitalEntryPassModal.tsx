import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  PartyPopper,
  ShieldCheck,
} from 'lucide-react';
import type { GuestItem, EventItem } from '../types';
import { generateQrCodeDataUrl } from '../utils/qrPass';

interface DigitalEntryPassModalProps {
  guest: GuestItem | null;
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalEntryPassModal: React.FC<DigitalEntryPassModalProps> = ({
  guest,
  event,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [ticketCode, setTicketCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !guest || !event) return;

    let isCancelled = false;
    setLoading(true);

    generateQrCodeDataUrl(guest, event)
      .then((res) => {
        if (!isCancelled) {
          setQrDataUrl(res.dataUrl);
          setTicketCode(res.ticketCode);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code data URL:', err);
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, guest, event]);

  if (!isOpen || !guest || !event) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `entry-pass-${guest.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPartyCount = 1 + (guest.plusOnes || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Official Entry Pass
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Guest Verification Ticket
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable / Downloadable Pass Card */}
        <div
          ref={cardRef}
          className="mt-5 p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-amber-50/30 dark:from-slate-950 dark:to-amber-950/20 border-2 border-dashed border-amber-500/40 relative overflow-hidden"
        >
          {/* Watermark Ribbon */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                EP
              </div>
              <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white">
                EventPilot<span className="text-amber-500">AI</span>
              </span>
            </div>

            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                guest.checkInStatus === 'checked_in'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
              }`}
            >
              {guest.checkInStatus === 'checked_in' ? 'Admitted' : 'Valid Entry Pass'}
            </span>
          </div>

          {/* Event & Guest Title */}
          <div className="mt-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              {event.name}
            </span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {guest.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
              <span className="capitalize font-semibold text-amber-600 dark:text-amber-400">
                {guest.group} Guest
              </span>
              <span>&bull;</span>
              <span className="font-medium">
                Party of {totalPartyCount} {guest.plusOnes > 0 ? `(${guest.plusOnes} plus-one)` : ''}
              </span>
              {guest.tableNumber && (
                <>
                  <span>&bull;</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Table {guest.tableNumber}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* High-Resolution QR Code */}
          <div className="my-5 flex flex-col items-center justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`Entry Pass QR Code for ${guest.name}`}
                  className="w-48 h-48 object-contain"
                />
              )}
            </div>

            {/* Pass Code badge */}
            <div className="mt-3 flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                {ticketCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Copy Pass Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Event Logistics Info Strip */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{event.eventDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{event.location}</span>
            </div>
            {guest.dietaryRequirements && (
              <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium pt-1">
                Dietary: {guest.dietaryRequirements}
              </div>
            )}
          </div>
        </div>

        {/* Actions Strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !qrDataUrl}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
