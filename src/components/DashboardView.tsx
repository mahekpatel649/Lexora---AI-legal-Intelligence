import React from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckSquare,
  FileText,
  FolderOpen,
  Plus,
  Square,
  Upload,
} from "lucide-react";
import { CaseDeadline, LegalCase, LegalDocument } from "../types";
import { formatDate } from "../utils/formatters";
import {
  AnalysisStatusText,
  CaseStatusText,
  PriorityText,
} from "./StatusIndicator";

interface DashboardViewProps {
  cases: LegalCase[];
  documents: LegalDocument[];
  deadlines: CaseDeadline[];
  onCreateCase: () => void;
  onOpenUploadDocument: () => void;
  onSelectCase: (caseId: string) => void;
  onSelectDocument: (docId: string) => void;
  onToggleDeadline: (deadlineId: string) => void;
  onViewAllCases: () => void;
  onViewAllDocuments: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cases,
  documents,
  deadlines,
  onCreateCase,
  onOpenUploadDocument,
  onSelectCase,
  onSelectDocument,
  onToggleDeadline,
  onViewAllCases,
  onViewAllDocuments,
}) => {
  const activeCasesCount = cases.filter((c) => c.status === "Active").length;
  const upcomingDeadlines = deadlines
    .filter((d) => !d.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const analyzedDocsCount = documents.filter(
    (d) => d.analysisStatus === "Analyzed"
  ).length;

  const recentCases = [...cases]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 5);

  const recentDocs = [...documents]
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
    .slice(0, 5);

  const getCaseTitle = (caseInternalId: string) => {
    const found = cases.find((c) => c.id === caseInternalId);
    return found ? `${found.caseId} · ${found.title}` : "Unassigned Matter";
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Practice Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor active matters, uploaded legal documents, and upcoming court deadlines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenUploadDocument}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4 text-blue-700" />
            <span>Analyze Document</span>
          </button>
          <button
            type="button"
            onClick={onCreateCase}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#182E52] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Active Cases</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
            {activeCasesCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {cases.length} total matters in workspace
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Documents</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
            {documents.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            PDF, DOCX, and TXT case files
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Upcoming Deadlines</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
            {upcomingDeadlines.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {upcomingDeadlines.filter((d) => d.priority === "High").length} high priority
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Recent AI Analyses</p>
          <p className="mt-2 font-display text-3xl font-bold text-blue-700 tabular-nums">
            {analyzedDocsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {documents.length - analyzedDocsCount} awaiting analysis
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Cases (2 cols) */}
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Recent Cases
            </h2>
            <button
              type="button"
              onClick={onViewAllCases}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              <span>View all cases</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentCases.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">No cases yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Create your first legal matter to begin organizing documents.
              </p>
              <button
                type="button"
                onClick={onCreateCase}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#182E52]"
              >
                <Plus className="h-3.5 w-3.5" />
                Create First Case
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                    <th className="px-5 py-3">Case</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCases.map((c) => (
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
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {c.category}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {c.clientName}
                      </td>
                      <td className="px-4 py-3.5">
                        <CaseStatusText status={c.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDate(c.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Upcoming Deadlines (1 col) */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Upcoming Deadlines
            </h2>
            <CalendarClock className="h-4 w-4 text-slate-400" />
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">No pending deadlines</p>
              <p className="mt-1 text-xs text-slate-500">
                Add deadlines from any Case Details page.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingDeadlines.slice(0, 6).map((dl) => (
                <div
                  key={dl.id}
                  className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => onToggleDeadline(dl.id)}
                    className="mt-0.5 text-slate-400 hover:text-blue-700"
                    aria-label={`Mark "${dl.title}" complete`}
                  >
                    {dl.completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onSelectCase(dl.caseId)}
                      className="text-left text-sm font-medium text-slate-900 hover:text-blue-700"
                    >
                      {dl.title}
                    </button>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {getCaseTitle(dl.caseId)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-600 tabular-nums">
                        Due {formatDate(dl.dueDate)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <PriorityText priority={dl.priority} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Documents */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recent Documents
          </h2>
          <button
            type="button"
            onClick={onViewAllDocuments}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            <span>Open document intelligence</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentDocs.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              No documents uploaded
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Upload a PDF, DOCX, or TXT legal document for structured AI analysis.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                  <th className="px-5 py-3">Document Name</th>
                  <th className="px-4 py-3">Associated Case</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Upload Date</th>
                  <th className="px-5 py-3 text-right">Analysis Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 shrink-0 text-blue-700" />
                        <span className="font-medium text-slate-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {getCaseTitle(doc.caseId)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {doc.fileType}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDate(doc.uploadDate)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex justify-end">
                        <AnalysisStatusText status={doc.analysisStatus} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
