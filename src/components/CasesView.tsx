import React, { useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckSquare,
  Edit3,
  FileText,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CaseDeadline,
  CaseStatus,
  DeadlinePriority,
  LegalCase,
  LegalCategory,
  LegalDocument,
} from "../types";
import { formatDate, formatFileSize } from "../utils/formatters";
import {
  AnalysisStatusText,
  CaseStatusText,
  PriorityText,
} from "./StatusIndicator";
import { ConfirmDialog } from "./ConfirmDialog";

interface CasesViewProps {
  cases: LegalCase[];
  documents: LegalDocument[];
  deadlines: CaseDeadline[];
  selectedCaseId: string | null;
  aiConsent: boolean;
  onRequireConsent: (pendingAction?: () => void) => void;
  onSelectCase: (caseId: string | null) => void;
  onOpenNewCaseModal: () => void;
  onOpenEditCaseModal: (legalCase: LegalCase) => void;
  onDeleteCase: (caseInternalId: string) => void;
  onOpenUploadForCase: (caseInternalId: string) => void;
  onOpenDocumentAnalysis: (docId: string) => void;
  onAskAIAboutCase: (caseInternalId: string) => void;
  onUpdateCaseAISummary: (
    caseInternalId: string,
    summary: LegalCase["aiSummary"]
  ) => void;
  onAddDeadline: (payload: Omit<CaseDeadline, "id" | "completed">) => void;
  onToggleDeadline: (deadlineId: string) => void;
  onDeleteDeadline: (deadlineId: string) => void;
}

const CATEGORIES: Array<"All" | LegalCategory> = [
  "All",
  "Civil",
  "Criminal",
  "Corporate",
  "Intellectual Property",
  "Employment",
  "Contract Disputes",
  "Family",
  "Other",
];

const STATUSES: Array<"All" | CaseStatus> = ["All", "Active", "Pending", "Closed"];

export const CasesView: React.FC<CasesViewProps> = ({
  cases,
  documents,
  deadlines,
  selectedCaseId,
  aiConsent,
  onRequireConsent,
  onSelectCase,
  onOpenNewCaseModal,
  onOpenEditCaseModal,
  onDeleteCase,
  onOpenUploadForCase,
  onOpenDocumentAnalysis,
  onAskAIAboutCase,
  onUpdateCaseAISummary,
  onAddDeadline,
  onToggleDeadline,
  onDeleteDeadline,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatus>("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | LegalCategory>("All");
  const [deleteTarget, setDeleteTarget] = useState<LegalCase | null>(null);

  // Deadline quick form state
  const [dlTitle, setDlTitle] = useState("");
  const [dlDate, setDlDate] = useState("");
  const [dlPriority, setDlPriority] = useState<DeadlinePriority>("Medium");

  // AI Case Summary loading/error state
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const activeCase = selectedCaseId
    ? cases.find((c) => c.id === selectedCaseId) || null
    : null;

  const runSummary = async (targetCase: LegalCase) => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const caseDocs = documents.filter((d) => d.caseId === targetCase.id);
      const res = await fetch("/api/ai/case-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseData: targetCase,
          documents: caseDocs.map((d) => ({
            name: d.name,
            type: d.fileType,
            hasPageNumbers: d.hasPageNumbers,
            pages: d.pages,
            fullText: d.fullText,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to generate AI case summary.");
      }
      onUpdateCaseAISummary(targetCase.id, {
        ...data.summary,
        generatedAt: data.generatedAt || new Date().toISOString(),
      });
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to connect to AI summary service."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateSummary = (targetCase: LegalCase) => {
    if (!aiConsent) {
      onRequireConsent(() => void runSummary(targetCase));
      return;
    }
    void runSummary(targetCase);
  };

  if (activeCase) {
    const caseDocs = documents.filter((d) => d.caseId === activeCase.id);
    const caseDeadlines = deadlines
      .filter((d) => d.caseId === activeCase.id)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const handleCreateDeadline = (e: React.FormEvent) => {
      e.preventDefault();
      if (!dlTitle.trim() || !dlDate) return;
      onAddDeadline({
        caseId: activeCase.id,
        title: dlTitle.trim(),
        dueDate: dlDate,
        priority: dlPriority,
      });
      setDlTitle("");
      setDlDate("");
      setDlPriority("Medium");
    };

    return (
      <div className="space-y-6">
        {/* Back + Actions Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => onSelectCase(null)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to My Cases</span>
            </button>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {activeCase.title}
              </h1>
              <CaseStatusText status={activeCase.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-mono">{activeCase.caseId}</span>
              <span className="mx-1.5">·</span>
              <span>{activeCase.category}</span>
              <span className="mx-1.5">·</span>
              <span>Client: {activeCase.clientName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onAskAIAboutCase(activeCase.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#182E52] whitespace-nowrap"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              <span>Ask AI Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenUploadForCase(activeCase.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5 text-blue-700" />
              <span>Upload Document</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenEditCaseModal(activeCase)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(activeCase)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Overview & Case Details Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Case Overview
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                {activeCase.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Court / Forum</p>
                  <p className="mt-1 text-xs font-medium text-slate-900">
                    {activeCase.courtName || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Filing Date</p>
                  <p className="mt-1 font-mono text-xs font-medium text-slate-900 tabular-nums">
                    {formatDate(activeCase.filingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Next Hearing</p>
                  <p className="mt-1 font-mono text-xs font-medium text-slate-900 tabular-nums">
                    {formatDate(activeCase.nextHearingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="mt-1 font-mono text-xs font-medium text-slate-900 tabular-nums">
                    {formatDate(activeCase.lastUpdated)}
                  </p>
                </div>
              </div>
            </section>

            {/* AI-Generated Case Summary */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    AI-Generated Case Summary
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Synthesized strictly from case metadata and associated uploaded files.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={summaryLoading}
                  onClick={() => handleGenerateSummary(activeCase)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-60 whitespace-nowrap"
                >
                  {summaryLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {activeCase.aiSummary ? "Refresh AI Summary" : "Generate AI Summary"}
                  </span>
                </button>
              </div>

              {summaryError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {summaryError}
                </div>
              )}

              {activeCase.aiSummary ? (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  <p className="text-sm leading-relaxed text-slate-700">
                    {activeCase.aiSummary.overview}
                  </p>

                  {activeCase.aiSummary.keyFindings.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900">
                        Key Findings
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                        {activeCase.aiSummary.keyFindings.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeCase.aiSummary.recommendedNextSteps.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900">
                        Points for Legal Review
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                        {activeCase.aiSummary.recommendedNextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="font-mono text-[11px] text-slate-400">
                    Generated {formatDate(activeCase.aiSummary.generatedAt)} · Subject to attorney verification
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                  No AI case summary generated yet. Click "Generate AI Summary" to synthesize case documents.
                </div>
              )}
            </section>

            {/* Associated Documents */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Associated Documents ({caseDocs.length})
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenUploadForCase(activeCase.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add document</span>
                </button>
              </div>

              {caseDocs.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <FileText className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    No documents attached
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload contracts, pleadings, or memos to analyze with Gemini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {caseDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {doc.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                            {doc.fileType} · {formatFileSize(doc.fileSize)} · Uploaded{" "}
                            {formatDate(doc.uploadDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <AnalysisStatusText status={doc.analysisStatus} />
                        <button
                          type="button"
                          onClick={() => onOpenDocumentAnalysis(doc.id)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                        >
                          {doc.analysisStatus === "Analyzed"
                            ? "View Analysis"
                            : "Analyze"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Important Dates & Deadlines */}
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Important Dates & Deadlines
                </h2>
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {caseDeadlines.length === 0 ? (
                  <p className="py-4 text-xs text-slate-500">
                    No deadlines logged for this matter.
                  </p>
                ) : (
                  caseDeadlines.map((dl) => (
                    <div key={dl.id} className="flex items-start gap-2.5 py-3">
                      <button
                        type="button"
                        onClick={() => onToggleDeadline(dl.id)}
                        className="mt-0.5 text-slate-400 hover:text-blue-700"
                        aria-label="Toggle deadline completion"
                      >
                        {dl.completed ? (
                          <CheckSquare className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-medium ${
                            dl.completed
                              ? "line-through text-slate-400"
                              : "text-slate-900"
                          }`}
                        >
                          {dl.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="font-mono text-slate-500 tabular-nums">
                            {formatDate(dl.dueDate)}
                          </span>
                          <span className="text-slate-300">·</span>
                          <PriorityText priority={dl.priority} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteDeadline(dl.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        aria-label="Remove deadline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleCreateDeadline}
                className="mt-4 space-y-3 border-t border-slate-200 pt-4"
              >
                <p className="text-xs font-semibold text-slate-700">Add Deadline</p>
                <input
                  type="text"
                  value={dlTitle}
                  onChange={(e) => setDlTitle(e.target.value)}
                  placeholder="Deadline description..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dlDate}
                    onChange={(e) => setDlDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <select
                    value={dlPriority}
                    onChange={(e) => setDlPriority(e.target.value as DeadlinePriority)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!dlTitle.trim() || !dlDate}
                  className="w-full rounded-lg bg-[#0F1E36] px-3 py-2 text-xs font-medium text-white hover:bg-[#182E52] disabled:opacity-50"
                >
                  Save Deadline
                </button>
              </form>
            </section>
          </div>
        </div>

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete Case Matter"
          description={`Are you sure you want to delete "${deleteTarget?.title}"? Associated documents will remain in your Documents library as unassigned unless deleted separately.`}
          confirmLabel="Delete Case"
          onConfirm={() => {
            if (deleteTarget) {
              onDeleteCase(deleteTarget.id);
              setDeleteTarget(null);
            }
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  // Cases Directory List View
  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || c.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.caseId.toLowerCase().includes(q) ||
      c.clientName.toLowerCase().includes(q);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            My Cases
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage legal matters, associate documents, and track filing schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewCaseModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-medium text-white hover:bg-[#182E52] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Case</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, ID, or client..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none sm:w-64"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as "All" | LegalCategory)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            aria-label="Filter by legal category"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filteredCases.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Briefcase className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              No matching cases found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Adjust your search filters or create a new legal case.
            </p>
            <button
              type="button"
              onClick={onOpenNewCaseModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-4 py-2 text-xs font-medium text-white hover:bg-[#182E52]"
            >
              <Plus className="h-3.5 w-3.5" />
              New Case
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="px-5 py-3">Case Title & ID</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3">Next Hearing</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => {
                  const docCount = documents.filter((d) => d.caseId === c.id).length;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{c.title}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                          {c.caseId}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">
                        {c.clientName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {c.category}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
                        {docCount}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDate(c.nextHearingDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <CaseStatusText status={c.status} />
                      </td>
                      <td
                        className="px-5 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEditCaseModal(c)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label={`Edit ${c.title}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Delete ${c.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Case Matter"
        description={`Are you sure you want to delete "${deleteTarget?.title}" (${deleteTarget?.caseId})? This action cannot be undone.`}
        confirmLabel="Delete Case"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteCase(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
