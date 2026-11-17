import React, { useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DocumentAnalysis,
  DocumentFileType,
  LegalCase,
  LegalCategory,
  LegalDocument,
} from "../types";
import {
  formatDate,
  formatFileSize,
  generateId,
  getTodayISO,
} from "../utils/formatters";
import { AnalysisStatusText } from "./StatusIndicator";
import { ConfirmDialog } from "./ConfirmDialog";

interface DocumentsViewProps {
  cases: LegalCase[];
  documents: LegalDocument[];
  selectedDocumentId: string | null;
  uploadMode: boolean;
  preselectedCaseId: string | null;
  aiConsent: boolean;
  onRequireConsent: (pendingAction?: () => void) => void;
  onSelectDocument: (docId: string | null) => void;
  onSetUploadMode: (open: boolean) => void;
  onAddDocument: (doc: LegalDocument) => void;
  onUpdateDocument: (doc: LegalDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onCreateQuickCase: (payload: Omit<LegalCase, "id" | "lastUpdated" | "aiSummary">) => LegalCase;
  onAskAIAboutDocument: (caseId: string, docId: string) => void;
}

type AnalysisTab = "summary" | "key_info" | "risks" | "important" | "source";

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  cases,
  documents,
  selectedDocumentId,
  uploadMode,
  preselectedCaseId,
  aiConsent,
  onRequireConsent,
  onSelectDocument,
  onSetUploadMode,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onCreateQuickCase,
  onAskAIAboutDocument,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | DocumentFileType>("All");
  const [caseFilter, setCaseFilter] = useState<string>("All");
  const [deleteTarget, setDeleteTarget] = useState<LegalDocument | null>(null);

  // Upload & extraction state
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [assignCaseId, setAssignCaseId] = useState<string>(
    preselectedCaseId || cases[0]?.id || ""
  );
  const [showQuickCaseForm, setShowQuickCaseForm] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickClient, setQuickClient] = useState("");
  const [quickCategory, setQuickCategory] =
    useState<LegalCategory>("Contract Disputes");

  // Analysis state
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("summary");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDoc = selectedDocumentId
    ? documents.find((d) => d.id === selectedDocumentId) || null
    : null;

  const getCaseLabel = (caseInternalId: string) => {
    const found = cases.find((c) => c.id === caseInternalId);
    return found ? `${found.caseId} · ${found.title}` : "Unassigned";
  };

  const handleFileUpload = async (file: File) => {
    setExtractError("");
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract document text.");
      }

      const targetCaseId = assignCaseId || cases[0]?.id || "";
      const newDoc: LegalDocument = {
        id: generateId("doc"),
        name: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        caseId: targetCaseId,
        uploadDate: getTodayISO(),
        analysisStatus: "Pending Analysis",
        pageCount: data.pageCount,
        hasPageNumbers: data.hasPageNumbers,
        wordCount: data.wordCount,
        pages: data.pages,
        fullText: data.fullText,
      };

      onAddDocument(newDoc);
      onSetUploadMode(false);
      onSelectDocument(newDoc.id);
      setActiveTab("summary");
    } catch (err) {
      setExtractError(
        err instanceof Error ? err.message : "Unable to process uploaded file."
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateInlineCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickClient.trim()) return;
    const created = onCreateQuickCase({
      title: quickTitle.trim(),
      caseId: `LEX-2026-${Math.floor(200 + Math.random() * 700)}`,
      clientName: quickClient.trim(),
      category: quickCategory,
      description: `Matter created during document upload for ${quickClient.trim()}.`,
      status: "Active",
    });
    setAssignCaseId(created.id);
    if (activeDoc) {
      onUpdateDocument({ ...activeDoc, caseId: created.id });
    }
    setQuickTitle("");
    setQuickClient("");
    setShowQuickCaseForm(false);
  };

  const runAnalysis = async (doc: LegalDocument) => {
    setAnalyzingDocId(doc.id);
    try {
      const associatedCase = cases.find((c) => c.id === doc.caseId);
      const res = await fetch("/api/ai/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: doc.name,
          fileType: doc.fileType,
          hasPageNumbers: doc.hasPageNumbers,
          pages: doc.pages,
          fullText: doc.fullText,
          caseTitle: associatedCase?.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Document analysis failed.");
      }

      onUpdateDocument({
        ...doc,
        analysisStatus: "Analyzed",
        analysisError: undefined,
        analyzedAt: data.analyzedAt || new Date().toISOString(),
        analysis: data.analysis as DocumentAnalysis,
      });
      setActiveTab("summary");
    } catch (err) {
      onUpdateDocument({
        ...doc,
        analysisStatus: "Error",
        analysisError:
          err instanceof Error
            ? err.message
            : "Gemini AI service could not complete analysis.",
      });
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const handleTriggerAnalyze = (doc: LegalDocument) => {
    if (!aiConsent) {
      onRequireConsent(() => runAnalysis(doc));
      return;
    }
    void runAnalysis(doc);
  };

  // Upload View
  if (uploadMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => onSetUploadMode(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Documents</span>
            </button>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              Upload Legal Document
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Extract text from PDF, DOCX, or TXT files and associate them with a case for AI analysis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Case Association Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              1. Associate with Case
            </h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Select Existing Case
              </label>
              <select
                value={assignCaseId}
                onChange={(e) => setAssignCaseId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="">Unassigned (General Library)</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseId} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickCaseForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showQuickCaseForm ? "Hide new case form" : "Or create a new case"}</span>
            </button>

            {showQuickCaseForm && (
              <form
                onSubmit={handleCreateInlineCase}
                className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5"
              >
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Case title..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                />
                <input
                  type="text"
                  value={quickClient}
                  onChange={(e) => setQuickClient(e.target.value)}
                  placeholder="Client name..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                />
                <select
                  value={quickCategory}
                  onChange={(e) =>
                    setQuickCategory(e.target.value as LegalCategory)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                >
                  <option value="Contract Disputes">Contract Disputes</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Civil">Civil</option>
                  <option value="Intellectual Property">Intellectual Property</option>
                  <option value="Employment">Employment</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Family">Family</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  type="submit"
                  disabled={!quickTitle.trim() || !quickClient.trim()}
                  className="w-full rounded-lg bg-[#0F1E36] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#182E52] disabled:opacity-50"
                >
                  Create & Select Case
                </button>
              </form>
            )}
          </div>

          {/* Drag and Drop Upload Panel */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-slate-900">
              2. Upload Document File
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Supported formats: PDF (text-based), DOCX, and TXT up to 15 MB.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) void handleFileUpload(dropped);
              }}
              className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-600 bg-blue-50/60"
                  : "border-slate-300 bg-slate-50/60 hover:border-slate-400"
              }`}
            >
              {extracting ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    Extracting document text and page structure...
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Preparing grounded source pages for citation tracking.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#0F1E36]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    Drag and drop a legal document here
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    PDF, DOCX, or TXT · Max 15 MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const chosen = e.target.files?.[0];
                      if (chosen) void handleFileUpload(chosen);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 rounded-lg bg-[#0F1E36] px-4 py-2 text-xs font-medium text-white hover:bg-[#182E52]"
                  >
                    Select File from Computer
                  </button>
                </>
              )}
            </div>

            {extractError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Document Intelligence & Analysis Detail View
  if (activeDoc) {
    const isAnalyzing = analyzingDocId === activeDoc.id;
    const analysis = activeDoc.analysis;

    return (
      <div className="space-y-6">
        {/* Header & Primary Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => onSelectDocument(null)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Documents</span>
            </button>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {activeDoc.name}
              </h1>
              <AnalysisStatusText status={activeDoc.analysisStatus} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span className="font-mono">{activeDoc.fileType}</span>
              <span>·</span>
              <span>{formatFileSize(activeDoc.fileSize)}</span>
              <span>·</span>
              <span>
                {activeDoc.hasPageNumbers
                  ? `${activeDoc.pageCount} pages`
                  : `${activeDoc.wordCount} words`}
              </span>
              <span>·</span>
              <span>Uploaded {formatDate(activeDoc.uploadDate)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <select
              value={activeDoc.caseId}
              onChange={(e) =>
                onUpdateDocument({ ...activeDoc, caseId: e.target.value })
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
              aria-label="Associated case"
            >
              <option value="">Unassigned</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseId} · {c.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onAskAIAboutDocument(activeDoc.caseId, activeDoc.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <MessageSquareText className="h-3.5 w-3.5 text-blue-700" />
              <span>Ask AI Assistant</span>
            </button>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => handleTriggerAnalyze(activeDoc)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-4 py-2 text-xs font-medium text-white hover:bg-[#182E52] disabled:opacity-60 whitespace-nowrap"
            >
              {isAnalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>
                {isAnalyzing
                  ? "Analyzing..."
                  : analysis
                    ? "Re-Analyze Document"
                    : "Analyze Document"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeleteTarget(activeDoc)}
              className="rounded-lg border border-red-200 bg-white p-2 text-red-700 hover:bg-red-50"
              aria-label="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Confidentiality Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
          <p>
            Clicking <strong>Analyze Document</strong> sends the extracted text of this
            file to Google Gemini for structured legal review. Findings are grounded
            strictly in extracted text and uncertain items are flagged for attorney verification.
          </p>
        </div>

        {/* Error Alert */}
        {activeDoc.analysisStatus === "Error" && activeDoc.analysisError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold">AI Analysis Failed</p>
              <p className="mt-1 text-xs">{activeDoc.analysisError}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-700" />
            <p className="mt-3 font-display text-base font-semibold text-slate-900">
              Analyzing {activeDoc.name} with Gemini
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Extracting summary, parties, clauses, risks, and source citations...
            </p>
          </div>
        )}

        {/* Pending Analysis Prompt */}
        {!isAnalyzing && !analysis && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <Sparkles className="mx-auto h-9 w-9 text-blue-700" />
            <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">
              Ready for AI Document Intelligence
            </h2>
            <p className="mx-auto mt-1.5 max-w-lg text-sm text-slate-600">
              Text has been extracted ({activeDoc.wordCount} words). Click{" "}
              <strong>Analyze Document</strong> to generate a structured summary, key
              information extraction, risk analysis, and review points.
            </p>
            <button
              type="button"
              onClick={() => handleTriggerAnalyze(activeDoc)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#182E52]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Analyze Document</span>
            </button>
          </div>
        )}

        {/* Structured Analysis Tabs */}
        {!isAnalyzing && (
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-4 pt-3">
              {[
                { id: "summary" as const, label: "A. Document Summary", disabled: !analysis },
                { id: "key_info" as const, label: "B. Key Information", disabled: !analysis },
                { id: "risks" as const, label: "C. Risk Analysis", disabled: !analysis },
                { id: "important" as const, label: "D. Important Points", disabled: !analysis },
                { id: "source" as const, label: "Extracted Source Text", disabled: false },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  disabled={tab.disabled}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-40 ${
                    activeTab === tab.id
                      ? "border-[#0F1E36] text-[#0F1E36]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "summary" && analysis && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500">
                      Overview
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
                      {analysis.documentSummary.overview}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Main Purpose
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
                      {analysis.documentSummary.mainPurpose}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Important Facts
                    </h3>
                    <div className="mt-3 divide-y divide-slate-100">
                      {analysis.documentSummary.importantFacts.map((item, i) => (
                        <div key={i} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm text-slate-800 flex-1">{item.fact}</p>
                            {item.uncertain && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Uncertain</span>
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-mono text-xs text-blue-700">
                            {item.citation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "key_info" && analysis && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Case / Reference Number
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                        {analysis.keyInformation.caseNumber || "Not specified in document"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500">
                        Parties Involved
                      </h3>
                      <div className="mt-3 divide-y divide-slate-100">
                        {analysis.keyInformation.partiesInvolved.length === 0 ? (
                          <p className="text-xs text-slate-500">None identified.</p>
                        ) : (
                          analysis.keyInformation.partiesInvolved.map((p, i) => (
                            <div key={i} className="py-2.5 first:pt-0">
                              <p className="text-sm font-medium text-slate-900">{p.name}</p>
                              <p className="text-xs text-slate-600">{p.role}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-blue-700">
                                {p.citation}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-500">
                        Important Dates
                      </h3>
                      <div className="mt-3 divide-y divide-slate-100">
                        {analysis.keyInformation.importantDates.length === 0 ? (
                          <p className="text-xs text-slate-500">No dates specified.</p>
                        ) : (
                          analysis.keyInformation.importantDates.map((d, i) => (
                            <div key={i} className="py-2.5 first:pt-0">
                              <p className="font-mono text-xs font-semibold text-slate-900">
                                {d.date}
                              </p>
                              <p className="text-xs text-slate-600">{d.significance}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-blue-700">
                                {d.citation}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Legal Issues Identified
                    </h3>
                    <div className="mt-3 divide-y divide-slate-100">
                      {analysis.keyInformation.legalIssues.map((iss, i) => (
                        <div key={i} className="py-2.5 first:pt-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-slate-800">{iss.issue}</p>
                            {iss.uncertain && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 shrink-0">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Uncertain</span>
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-blue-700">
                            {iss.citation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Important Clauses
                    </h3>
                    <div className="mt-3 divide-y divide-slate-100">
                      {analysis.keyInformation.importantClauses.map((cl, i) => (
                        <div key={i} className="py-2.5 first:pt-0">
                          <p className="text-sm font-medium text-slate-900">{cl.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                            {cl.summary}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-blue-700">
                            {cl.citation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "risks" && analysis && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500">
                      Potential Risks
                    </h3>
                    <div className="mt-3 divide-y divide-slate-100">
                      {analysis.riskAnalysis.potentialRisks.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No specific risks flagged in extracted text.
                        </p>
                      ) : (
                        analysis.riskAnalysis.potentialRisks.map((r, i) => (
                          <div key={i} className="py-3 first:pt-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {r.title}
                              </p>
                              <div className="flex items-center gap-3 text-xs">
                                {r.uncertain && (
                                  <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Uncertain
                                  </span>
                                )}
                                <span
                                  className={`font-semibold ${
                                    r.severity === "High"
                                      ? "text-red-700"
                                      : r.severity === "Medium"
                                        ? "text-amber-700"
                                        : "text-slate-600"
                                  }`}
                                >
                                  Severity: {r.severity}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-slate-700">{r.description}</p>
                            <p className="mt-1 font-mono text-xs text-blue-700">
                              {r.citation}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-5 md:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500">
                        Contradictions or Inconsistencies
                      </h3>
                      <div className="mt-2.5 space-y-3">
                        {analysis.riskAnalysis.contradictions.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No internal contradictions detected.
                          </p>
                        ) : (
                          analysis.riskAnalysis.contradictions.map((c, i) => (
                            <div key={i} className="text-sm text-slate-700">
                              <p>{c.description}</p>
                              <p className="mt-0.5 font-mono text-xs text-blue-700">
                                {c.citation}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-500">
                        Missing Information
                      </h3>
                      <div className="mt-2.5 space-y-3">
                        {analysis.riskAnalysis.missingInformation.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No critical omissions identified.
                          </p>
                        ) : (
                          analysis.riskAnalysis.missingInformation.map((m, i) => (
                            <div key={i}>
                              <p className="text-sm font-medium text-slate-900">{m.item}</p>
                              <p className="text-xs text-slate-600">{m.impact}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Unclear Clauses
                    </h3>
                    <div className="mt-2.5 space-y-3">
                      {analysis.riskAnalysis.unclearClauses.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No ambiguous clauses flagged.
                        </p>
                      ) : (
                        analysis.riskAnalysis.unclearClauses.map((u, i) => (
                          <div key={i}>
                            <p className="text-sm font-medium text-slate-900">{u.clause}</p>
                            <p className="text-xs text-slate-600">{u.concern}</p>
                            <p className="mt-0.5 font-mono text-xs text-blue-700">
                              {u.citation}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "important" && analysis && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500">
                      Key Observations
                    </h3>
                    <ul className="mt-2.5 space-y-3">
                      {analysis.importantPoints.keyObservations.map((obs, i) => (
                        <li key={i} className="text-sm text-slate-800">
                          <p>{obs.point}</p>
                          <p className="mt-0.5 font-mono text-xs text-blue-700">
                            {obs.citation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Relevant Facts
                    </h3>
                    <ul className="mt-2.5 space-y-3">
                      {analysis.importantPoints.relevantFacts.map((rf, i) => (
                        <li key={i} className="text-sm text-slate-800">
                          <p>{rf.fact}</p>
                          <p className="mt-0.5 font-mono text-xs text-blue-700">
                            {rf.citation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Points Requiring Further Review
                    </h3>
                    <ul className="mt-2.5 space-y-3">
                      {analysis.importantPoints.furtherReviewItems.map((fr, i) => (
                        <li key={i}>
                          <p className="text-sm font-medium text-slate-900">{fr.item}</p>
                          <p className="text-xs text-slate-600">{fr.reason}</p>
                          <p className="mt-0.5 font-mono text-xs text-blue-700">
                            {fr.citation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "source" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Extracted verbatim text ({activeDoc.hasPageNumbers ? "Page numbers verified" : "Continuous text — no fixed page numbers"})
                    </p>
                  </div>
                  <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                    {activeDoc.pages.map((p) => (
                      <div
                        key={p.pageNumber}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-mono text-xs font-semibold text-[#0F1E36]">
                          {activeDoc.hasPageNumbers
                            ? `Page ${p.pageNumber}`
                            : "Extracted Document Content"}
                        </p>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">
                          {p.text}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete Document"
          description={`Are you sure you want to permanently remove "${deleteTarget?.name}" and its AI analysis?`}
          confirmLabel="Delete Document"
          onConfirm={() => {
            if (deleteTarget) {
              onDeleteDocument(deleteTarget.id);
              setDeleteTarget(null);
            }
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  // Document Management Table View
  const filteredDocs = documents.filter((d) => {
    const matchesType = typeFilter === "All" || d.fileType === typeFilter;
    const matchesCase = caseFilter === "All" || d.caseId === caseFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || d.name.toLowerCase().includes(q);
    return matchesType && matchesCase && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Documents & Legal Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload PDF, DOCX, or TXT files, manage case associations, and inspect AI risk analyses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSetUploadMode(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-medium text-white hover:bg-[#182E52] whitespace-nowrap shrink-0"
        >
          <Upload className="h-4 w-4" />
          <span>Upload & Analyze</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(["All", "PDF", "DOCX", "TXT"] as const).map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setTypeFilter(ft)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                typeFilter === ft
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {ft}
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
              placeholder="Search documents by name..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none sm:w-64"
            />
          </div>

          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            aria-label="Filter by associated case"
          >
            <option value="All">All Cases</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseId} · {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              No matching documents
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Upload a legal PDF, DOCX, or TXT file to begin AI document analysis.
            </p>
            <button
              type="button"
              onClick={() => onSetUploadMode(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-4 py-2 text-xs font-medium text-white hover:bg-[#182E52]"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="px-5 py-3">Document Name</th>
                  <th className="px-4 py-3">Associated Case</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Analysis Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
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
                      {getCaseLabel(doc.caseId)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {doc.fileType}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDate(doc.uploadDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <AnalysisStatusText status={doc.analysisStatus} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectDocument(doc.id)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                        >
                          {doc.analysisStatus === "Analyzed" ? "View" : "Analyze"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onAskAIAboutDocument(doc.caseId, doc.id)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                          aria-label={`Ask AI about ${doc.name}`}
                        >
                          <MessageSquareText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(doc)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${doc.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove the file and its analysis results.`}
        confirmLabel="Delete Document"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteDocument(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
