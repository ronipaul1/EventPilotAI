import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Phone,
  Mail,
  Edit2,
  Trash2,
  X,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type {
  EventItem,
  VendorItem,
  VendorBookingStatus,
} from '../types';

interface VendorsViewProps {
  event: EventItem | null;
  vendors: VendorItem[];
  onAddVendor: (vendor: VendorItem) => Promise<void>;
  onUpdateVendor: (id: string, updates: Partial<VendorItem>) => Promise<void>;
  onDeleteVendor: (id: string) => Promise<void>;
  onNavigate?: (page: string) => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({
  event,
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onNavigate,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);

  // Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Catering');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(25000);
  const [actualCost, setActualCost] = useState<number>(25000);
  const [bookingStatus, setBookingStatus] = useState<VendorBookingStatus>('Not Contacted');
  const [notes, setNotes] = useState('');

  if (!event) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          No Event Selected
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select or create an event to coordinate its vendor quotes and contracts.
        </p>
      </div>
    );
  }

  const statuses: VendorBookingStatus[] = [
    'Not Contacted',
    'Contacted',
    'Negotiating',
    'Confirmed',
    'Cancelled',
  ];

  const filteredVendors = vendors.filter((v) => {
    return selectedStatus === 'all' || v.bookingStatus === selectedStatus;
  });

  const handleOpenCreate = () => {
    setEditingVendor(null);
    setName('');
    setCategory('Venue');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setEstimatedCost(30000);
    setActualCost(30000);
    setBookingStatus('Not Contacted');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VendorItem) => {
    setEditingVendor(v);
    setName(v.name);
    setCategory(v.category);
    setContactPerson(v.contactPerson || '');
    setEmail(v.email || '');
    setPhone(v.phone || '');
    setEstimatedCost(v.estimatedCost || 0);
    setActualCost(v.actualCost || 0);
    setBookingStatus(v.bookingStatus);
    setNotes(v.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingVendor) {
      await onUpdateVendor(editingVendor.id, {
        name: name.trim(),
        category,
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        estimatedCost: Number(estimatedCost) || 0,
        actualCost: Number(actualCost) || 0,
        bookingStatus,
        notes: notes.trim(),
      });
    } else {
      const newVendor: VendorItem = {
        id: `ven_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventId: event.id,
        userId: event.userId,
        name: name.trim(),
        category,
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        estimatedCost: Number(estimatedCost) || 0,
        actualCost: Number(actualCost) || 0,
        bookingStatus,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onAddVendor(newVendor);
    }
    setIsModalOpen(false);
  };

  const totalAgreedCost = vendors
    .filter((v) => v.bookingStatus === 'Confirmed')
    .reduce((sum, v) => sum + (v.actualCost || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
              {event.name}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Vendor Coordination CRM
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track communication, quotes, negotiated rates, and booking milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses ({vendors.length})</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s} ({vendors.filter((v) => v.bookingStatus === s).length})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Sourced Vendors</span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{vendors.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed Contracts
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {vendors.filter((v) => v.bookingStatus === 'Confirmed').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Agreed Committed Total</span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {event.currency} {totalAgreedCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          No vendor records found under this filter. Click &apos;Add Vendor&apos; to create records.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => {
            let statusBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            if (vendor.bookingStatus === 'Confirmed') statusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300';
            else if (vendor.bookingStatus === 'Negotiating') statusBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
            else if (vendor.bookingStatus === 'Contacted') statusBadge = 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300';
            else if (vendor.bookingStatus === 'Cancelled') statusBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300';

            return (
              <div
                key={vendor.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {vendor.category}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{vendor.name}</h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${statusBadge}`}>
                      {vendor.bookingStatus}
                    </span>
                  </div>

                  {vendor.contactPerson && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                      <span className="text-slate-400">Contact:</span> {vendor.contactPerson}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {vendor.phone && (
                      <a
                        href={`tel:${vendor.phone}`}
                        className="flex items-center gap-1 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{vendor.phone}</span>
                      </a>
                    )}
                    {vendor.email && (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="flex items-center gap-1 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{vendor.email}</span>
                      </a>
                    )}
                  </div>

                  {vendor.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed">
                      {vendor.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Agreed / Quoted</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {event.currency} {(vendor.actualCost || vendor.estimatedCost || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(vendor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteVendor(vendor.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingVendor ? 'Edit Vendor Record' : 'Add New Vendor'}
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
                  Vendor Name / Studio <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Saffron Banquet Caterers"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Venue, Decor, Media..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Booking Status</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value as VendorBookingStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@studio.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Final Agreed Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={actualCost}
                    onChange={(e) => setActualCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Negotiation Notes & Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Includes stage lighting; 25% deposit required"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
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
                  {editingVendor ? 'Save Changes' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
