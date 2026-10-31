import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  X,
  FileSpreadsheet,
  QrCode,
  Camera,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  BadgeAlert,
} from 'lucide-react';
import type { EventItem, GuestItem, GuestGroup, RsvpStatus } from '../types';
import { generateTicketCode } from '../utils/qrPass';
import { DigitalEntryPassModal } from '../components/DigitalEntryPassModal';
import { QrCodeScannerModal } from '../components/QrCodeScannerModal';
import { CsvImportModal } from '../components/CsvImportModal';

interface GuestsPageProps {
  event: EventItem | null;
  guests: GuestItem[];
  onAddGuest: (guest: GuestItem) => Promise<void>;
  onBatchImportGuests: (guests: GuestItem[]) => Promise<void>;
  onUpdateGuest: (id: string, updates: Partial<GuestItem>) => Promise<void>;
  onDeleteGuest: (id: string) => Promise<void>;
  onCheckInGuest: (guestId: string) => Promise<void>;
  onNavigate: (page: string) => void;
}

export const GuestsPage: React.FC<GuestsPageProps> = ({
  event,
  guests,
  onAddGuest,
  onBatchImportGuests,
  onUpdateGuest,
  onDeleteGuest,
  onCheckInGuest,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [checkInFilter, setCheckInFilter] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);
  const [selectedPassGuest, setSelectedPassGuest] = useState<GuestItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Auto-open scanner modal if launched directly with ?openScanner=true
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openScanner') === 'true' || window.location.hash === '#scanner') {
        setIsScannerOpen(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState<GuestGroup>('family');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
  const [plusOnes, setPlusOnes] = useState<number>(0);
  const [dietary, setDietary] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!event) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <Users className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          No Event Currently Selected
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Please select an event from the top navigation or create one in &apos;My Events&apos; to manage its guest list, digital entry passes, and QR scanner.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('events')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
        >
          Go to My Events
        </button>
      </div>
    );
  }

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.email && g.email.toLowerCase().includes(search.toLowerCase())) ||
      (g.ticketCode && g.ticketCode.toLowerCase().includes(search.toLowerCase())) ||
      (g.tableNumber && g.tableNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || g.rsvpStatus === statusFilter;
    const matchesGroup = groupFilter === 'all' || g.group === groupFilter;
    const matchesCheckIn =
      checkInFilter === 'all' ||
      (checkInFilter === 'checked_in' && g.checkInStatus === 'checked_in') ||
      (checkInFilter === 'pending' && g.checkInStatus !== 'checked_in');

    return matchesSearch && matchesStatus && matchesGroup && matchesCheckIn;
  });

  // Calculate Real RSVP Headcount Metrics
  const totalInvited = guests.length;
  const attendingGuests = guests.filter((g) => g.rsvpStatus === 'attending');
  const attendingCount = attendingGuests.length;
  const declinedCount = guests.filter((g) => g.rsvpStatus === 'declined').length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === 'pending' || g.rsvpStatus === 'tentative').length;

  const totalHeadcount = attendingGuests.reduce((sum, g) => sum + 1 + (Number(g.plusOnes) || 0), 0);
  const checkedInCount = guests.filter((g) => g.checkInStatus === 'checked_in').length;
  const checkedInHeadcount = guests
    .filter((g) => g.checkInStatus === 'checked_in')
    .reduce((sum, g) => sum + 1 + (Number(g.plusOnes) || 0), 0);

  const attendanceRate = totalInvited > 0 ? Math.round((attendingCount / totalInvited) * 100) : 0;
  const checkInRate = attendingCount > 0 ? Math.round((checkedInCount / attendingCount) * 100) : 0;

  const handleOpenCreate = () => {
    setEditingGuest(null);
    setName('');
    setEmail('');
    setPhone('');
    setGroup('family');
    setRsvpStatus('pending');
    setPlusOnes(0);
    setDietary('');
    setTableNumber('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: GuestItem) => {
    setEditingGuest(g);
    setName(g.name);
    setEmail(g.email || '');
    setPhone(g.phone || '');
    setGroup(g.group);
    setRsvpStatus(g.rsvpStatus);
    setPlusOnes(g.plusOnes || 0);
    setDietary(g.dietaryRequirements || '');
    setTableNumber(g.tableNumber || '');
    setNotes(g.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingGuest) {
      await onUpdateGuest(editingGuest.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        group,
        rsvpStatus,
        plusOnes: Number(plusOnes) || 0,
        dietaryRequirements: dietary.trim(),
        tableNumber: tableNumber.trim(),
        notes: notes.trim(),
      });
    } else {
      const guestId = `gst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newGuest: GuestItem = {
        id: guestId,
        eventId: event.id,
        userId: event.userId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        group,
        rsvpStatus,
        plusOnes: Number(plusOnes) || 0,
        dietaryRequirements: dietary.trim(),
        tableNumber: tableNumber.trim(),
        notes: notes.trim(),
        ticketCode: generateTicketCode(event.id, guestId),
        checkInStatus: 'not_checked_in',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onAddGuest(newGuest);
    }
    setIsModalOpen(false);
  };

  const handleToggleCheckIn = async (g: GuestItem) => {
    const nextStatus = g.checkInStatus === 'checked_in' ? 'not_checked_in' : 'checked_in';
    const checkInTime = nextStatus === 'checked_in' ? new Date().toISOString() : undefined;
    await onUpdateGuest(g.id, {
      checkInStatus: nextStatus,
      checkInTime,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
              {event.name}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500">Target: {event.guestCount} Attendees</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Guest Management & Digital Entry Passes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bulk CSV import, unique scannable QR ticket passes for every guest, and live entrance check-in scanner
          </p>
        </div>

        {/* Action Buttons: Add Guest, Import CSV, Open QR Scanner */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 font-bold shadow-xs flex items-center gap-2 transition-all"
          >
            <Camera className="w-4 h-4 text-amber-400 dark:text-slate-950" />
            <span>QR Entry Scanner</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Headcount & Live Check-in Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Invitations</span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {totalInvited}
          </div>
          <span className="text-[10px] text-slate-400">Total invited parties</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            Confirmed RSVPs
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {attendingCount}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {totalHeadcount} total plates with plus-ones
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admitted at Gate
          </span>
          <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {checkedInCount}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {checkedInHeadcount} heads ({checkInRate}% check-in velocity)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Response
          </span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
          <span className="text-[10px] text-slate-400">
            {declinedCount} declined invitations
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, ticket code (EP-), or table #..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All RSVPs</option>
            <option value="attending">Attending</option>
            <option value="pending">Pending</option>
            <option value="tentative">Tentative</option>
            <option value="declined">Declined</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Groups</option>
            <option value="family">Family</option>
            <option value="friend">Friends</option>
            <option value="vip">VIPs</option>
            <option value="colleague">Colleagues</option>
            <option value="general">General</option>
          </select>

          <select
            value={checkInFilter}
            onChange={(e) => setCheckInFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Gate States</option>
            <option value="checked_in">Checked In</option>
            <option value="pending">Not Checked In</option>
          </select>
        </div>
      </div>

      {/* Guest Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No guests found matching your active filter. Click &apos;Add Guest&apos; or &apos;Import CSV&apos; to invite attendees.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Guest & Pass Code</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4">RSVP Status</th>
                  <th className="py-3 px-4">Gate Check-In</th>
                  <th className="py-3 px-4">Party Size</th>
                  <th className="py-3 px-4">Table #</th>
                  <th className="py-3 px-4">Dietary Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredGuests.map((guest) => {
                  let statusBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  if (guest.rsvpStatus === 'attending') {
                    statusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300';
                  } else if (guest.rsvpStatus === 'declined') {
                    statusBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300';
                  } else if (guest.rsvpStatus === 'pending') {
                    statusBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
                  }

                  const isCheckedIn = guest.checkInStatus === 'checked_in';
                  const effectiveTicketCode = guest.ticketCode || generateTicketCode(event.id, guest.id);

                  return (
                    <tr key={guest.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPassGuest(guest)}
                            className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                            title="View QR Entry Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {guest.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <span>{effectiveTicketCode}</span>
                              {guest.email && <span>&bull; {guest.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold capitalize text-[10px]">
                          {guest.group}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${statusBadge}`}>
                          {guest.rsvpStatus}
                        </span>
                      </td>

                      {/* Gate Check-In Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(guest)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                            isCheckedIn
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-rose-100 hover:text-rose-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-500 hover:text-slate-950'
                          }`}
                          title={isCheckedIn ? 'Click to undo check-in' : 'Click to admit guest'}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isCheckedIn ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span>{isCheckedIn ? 'Admitted' : 'Admit Pass'}</span>
                        </button>
                        {isCheckedIn && guest.checkInTime && (
                          <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">
                            {new Date(guest.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {1 + (guest.plusOnes || 0)} {guest.plusOnes > 0 ? `(+${guest.plusOnes})` : ''}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {guest.tableNumber || 'Unassigned'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {guest.dietaryRequirements || 'Standard'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPassGuest(guest)}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            title="Show Entry Pass & QR Code"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(guest)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Guest"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteGuest(guest.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Remove Guest"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Guest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGuest ? 'Edit Guest Record' : 'Add Guest & Generate Entry Pass'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Guest Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Group
                  </label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value as GuestGroup)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="family">Family</option>
                    <option value="friend">Friends</option>
                    <option value="vip">VIP Guest</option>
                    <option value="colleague">Colleagues</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                    <option value="tentative">Tentative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plus-Ones Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Table #
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. Table 4 / Lawn VIP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dietary Requirements
                </label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="e.g. Jain Vegetarian, Nut Allergy, Vegan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Special Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Needs priority seating, VIP greeting"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {editingGuest ? 'Save Changes' : 'Generate Entry Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Entry Pass Modal */}
      <DigitalEntryPassModal
        guest={selectedPassGuest}
        event={event}
        isOpen={Boolean(selectedPassGuest)}
        onClose={() => setSelectedPassGuest(null)}
      />

      {/* Real QR Entry Scanner Modal */}
      <QrCodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        event={event}
        guests={guests}
        onCheckInGuest={onCheckInGuest}
      />

      {/* Bulk CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        event={event}
        userId={event.userId}
        onImportBatch={onBatchImportGuests}
      />
    </div>
  );
};
