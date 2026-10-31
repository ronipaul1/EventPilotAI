import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Users,
  FileText,
} from 'lucide-react';
import type { GuestItem, EventItem } from '../types';
import {
  SAMPLE_CSV_TEMPLATE,
  processCsvToGuests,
  downloadFile,
} from '../utils/csvImport';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  userId: string;
  onImportBatch: (guests: GuestItem[]) => Promise<void>;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  event,
  userId,
  onImportBatch,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<GuestItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  if (!isOpen || !event) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setCsvText(content);
        const result = processCsvToGuests(content, event.id, userId);
        setParsedPreview(result.guests);
        setParseErrors(result.errors);
      }
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    if (text.trim().length > 0) {
      const result = processCsvToGuests(text, event.id, userId);
      setParsedPreview(result.guests);
      setParseErrors(result.errors);
    } else {
      setParsedPreview([]);
      setParseErrors([]);
    }
  };

  const handleDownloadTemplate = () => {
    downloadFile(
      SAMPLE_CSV_TEMPLATE,
      `eventpilot-guests-template-${event.category}.csv`,
      'text/csv'
    );
  };

  const handleCommitImport = async () => {
    if (parsedPreview.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImportBatch(parsedPreview);
      onClose();
    } catch (err) {
      console.error('Failed to import CSV guests:', err);
      setParseErrors(['Failed to save imported guests. Please verify database connection.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in text-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Bulk Invitation Management
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Import Guest List from CSV
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Sample Download */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Quick Spreadsheet Onboarding
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload spreadsheets with columns: Full Name, Email, Phone, Group, RSVP, Plus-Ones, Table #, Dietary.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Input Method Toggle */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (.csv)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste CSV Text</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="mt-4">
          {activeTab === 'upload' ? (
            <label className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center block cursor-pointer hover:border-amber-500 transition-colors">
              <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Click to browse or drop CSV file here
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Accepts UTF-8 comma or tab delimited files
              </span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <textarea
              rows={6}
              value={csvText}
              onChange={handleTextChange}
              placeholder="Full Name,Email,Phone,Group,RSVP Status,Plus Ones,Table Number,Dietary Requirements&#10;Aarav Sharma,aarav@example.com,+91 9876543210,family,attending,1,Table 1,Jain Vegetarian"
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          )}
        </div>

        {/* Errors Warnings */}
        {parseErrors.length > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-1 text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Parsing Warnings:</span>
            </div>
            {parseErrors.slice(0, 3).map((err, i) => (
              <p key={i} className="text-[11px] pl-5">{err}</p>
            ))}
          </div>
        )}

        {/* Live Parsed Preview Table */}
        {parsedPreview.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Parsed Preview ({parsedPreview.length} guests ready to import)
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                Unique QR Entry Passes will be generated automatically
              </span>
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Group</th>
                    <th className="py-2 px-3">RSVP</th>
                    <th className="py-2 px-3">Party</th>
                    <th className="py-2 px-3">Table</th>
                    <th className="py-2 px-3">Dietary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {parsedPreview.slice(0, 10).map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {g.name}
                      </td>
                      <td className="py-2 px-3 capitalize text-slate-600 dark:text-slate-400">
                        {g.group}
                      </td>
                      <td className="py-2 px-3 uppercase font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                        {g.rsvpStatus}
                      </td>
                      <td className="py-2 px-3 font-mono">{1 + (g.plusOnes || 0)}</td>
                      <td className="py-2 px-3 text-slate-500">{g.tableNumber || '-'}</td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{g.dietaryRequirements || 'Standard'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedPreview.length > 10 && (
              <span className="text-[10px] text-slate-400 italic block text-right">
                ...and {parsedPreview.length - 10} more rows
              </span>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedPreview.length === 0 || isSubmitting}
            onClick={handleCommitImport}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Import {parsedPreview.length} Guests</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
