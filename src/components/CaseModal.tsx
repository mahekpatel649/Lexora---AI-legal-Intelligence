import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CaseStatus, LegalCase, LegalCategory } from "../types";
import { getTodayISO } from "../utils/formatters";

const LEGAL_CATEGORIES: LegalCategory[] = [
  "Civil",
  "Criminal",
  "Corporate",
  "Intellectual Property",
  "Employment",
  "Contract Disputes",
  "Family",
  "Other",
];

const CASE_STATUSES: CaseStatus[] = ["Active", "Pending", "Closed"];

interface CaseModalProps {
  open: boolean;
  initialCase?: LegalCase | null;
  suggestedCaseNumber?: string;
  onClose: () => void;
  onSave: (payload: Omit<LegalCase, "id" | "lastUpdated" | "aiSummary">) => void;
}

export const CaseModal: React.FC<CaseModalProps> = ({
  open,
  initialCase,
  suggestedCaseNumber,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [caseId, setCaseId] = useState("");
  const [clientName, setClientName] = useState("");
  const [category, setCategory] = useState<LegalCategory>("Contract Disputes");
  const [description, setDescription] = useState("");
  const [courtName, setCourtName] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState("");
  const [status, setStatus] = useState<CaseStatus>("Active");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initialCase) {
      setTitle(initialCase.title);
      setCaseId(initialCase.caseId);
      setClientName(initialCase.clientName);
      setCategory(initialCase.category);
      setDescription(initialCase.description);
      setCourtName(initialCase.courtName || "");
      setFilingDate(initialCase.filingDate || "");
      setNextHearingDate(initialCase.nextHearingDate || "");
      setStatus(initialCase.status);
    } else {
      setTitle("");
      setCaseId(suggestedCaseNumber || `LEX-2026-${Math.floor(120 + Math.random() * 800)}`);
      setClientName("");
      setCategory("Contract Disputes");
      setDescription("");
      setCourtName("");
      setFilingDate(getTodayISO());
      setNextHearingDate("");
      setStatus("Active");
    }
    setError("");
  }, [open, initialCase, suggestedCaseNumber]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !caseId.trim() || !clientName.trim() || !description.trim()) {
      setError("Please complete Case Title, Case ID, Client Name, and Case Description.");
      return;
    }

    onSave({
      title: title.trim(),
      caseId: caseId.trim(),
      clientName: clientName.trim(),
      category,
      description: description.trim(),
      courtName: courtName.trim() || undefined,
      filingDate: filingDate || undefined,
      nextHearingDate: nextHearingDate || undefined,
      status,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="case-modal-title"
              className="font-display text-lg font-semibold text-slate-900"
            >
              {initialCase ? "Edit Case Matter" : "Create New Case"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {initialCase
                ? "Update matter details, court schedule, or case status."
                : "Register a legal matter to organize documents, deadlines, and AI analysis."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close case form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Case Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Acme Corp v. Horizon Logistics"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Case ID <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="LEX-2026-105"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Client Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client or organization"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Legal Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LegalCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {LEGAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Case Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CaseStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {CASE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Case Description <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summarize key claims, procedural posture, or transaction scope..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Court / Forum <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                placeholder="e.g., Delaware Chancery"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Filing Date <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Next Hearing Date <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="date"
                value={nextHearingDate}
                onChange={(e) => setNextHearingDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F1E36] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#182E52] whitespace-nowrap shrink-0"
            >
              {initialCase ? "Save Changes" : "Create Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
