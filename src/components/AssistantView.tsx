import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  FileText,
  Info,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  AssistantMessage,
  AssistantThread,
  Citation,
  LegalCase,
  LegalDocument,
} from "../types";
import { formatDate, generateId } from "../utils/formatters";

interface AssistantViewProps {
  cases: LegalCase[];
  documents: LegalDocument[];
  threads: Record<string, AssistantThread>;
  initialCaseId: string | null;
  initialDocScope: string | null;
  aiConsent: boolean;
  onRequireConsent: (pendingAction?: () => void) => void;
  onSaveThread: (threadKey: string, thread: AssistantThread) => void;
}

const SUGGESTED_QUESTIONS = [
  "Summarize this case.",
  "What are the main legal issues?",
  "What are the important dates?",
  "Identify the obligations of both parties.",
  "Are there any potential risks in this contract?",
  "What facts support the claimant's position?",
];

export const AssistantView: React.FC<AssistantViewProps> = ({
  cases,
  documents,
  threads,
  initialCaseId,
  initialDocScope,
  aiConsent,
  onRequireConsent,
  onSaveThread,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    initialCaseId || cases[0]?.id || ""
  );
  const [docScope, setDocScope] = useState<string>(initialDocScope || "all");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewCitation, setPreviewCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCaseId) {
      setSelectedCaseId(initialCaseId);
    }
    if (initialDocScope) {
      setDocScope(initialDocScope);
    }
  }, [initialCaseId, initialDocScope]);

  const caseDocs = selectedCaseId
    ? documents.filter((d) => d.caseId === selectedCaseId)
    : documents;

  const activeDocs =
    docScope === "all"
      ? caseDocs
      : caseDocs.filter((d) => d.id === docScope);

  const threadKey = `${selectedCaseId || "all"}::${docScope}`;
  const currentThread = threads[threadKey] || {
    caseId: selectedCaseId,
    documentScope: docScope,
    messages: [],
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentThread.messages.length, loading]);

  const executeSendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || activeDocs.length === 0) return;

    const userMsg: AssistantMessage = {
      id: generateId("msg"),
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentThread.messages, userMsg];
    onSaveThread(threadKey, {
      caseId: selectedCaseId,
      documentScope: docScope,
      messages: updatedMessages,
    });
    setInput("");
    setLoading(true);

    try {
      const caseContext = cases.find((c) => c.id === selectedCaseId) || null;
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          caseContext,
          documents: activeDocs.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.fileType,
            hasPageNumbers: d.hasPageNumbers,
            pages: d.pages,
            fullText: d.fullText,
          })),
          history: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI Legal Assistant could not process your request.");
      }

      const assistantMsg: AssistantMessage = {
        id: generateId("msg"),
        role: "assistant",
        text: data.answer,
        timestamp: new Date().toISOString(),
        insufficientEvidence: Boolean(data.insufficientEvidence),
        citations: Array.isArray(data.citations) ? data.citations : [],
        legalAuthoritiesNotice: data.legalAuthoritiesNotice || "",
      };

      onSaveThread(threadKey, {
        caseId: selectedCaseId,
        documentScope: docScope,
        messages: [...updatedMessages, assistantMsg],
      });
    } catch (err) {
      const errorMsg: AssistantMessage = {
        id: generateId("msg"),
        role: "assistant",
        text: "",
        timestamp: new Date().toISOString(),
        error:
          err instanceof Error
            ? err.message
            : "Error communicating with Gemini API.",
      };
      onSaveThread(threadKey, {
        caseId: selectedCaseId,
        documentScope: docScope,
        messages: [...updatedMessages, errorMsg],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    if (!aiConsent) {
      const q = input;
      onRequireConsent(() => executeSendQuestion(q));
      return;
    }
    void executeSendQuestion(input);
  };

  const handlePromptClick = (q: string) => {
    if (loading || activeDocs.length === 0) return;
    if (!aiConsent) {
      onRequireConsent(() => executeSendQuestion(q));
      return;
    }
    void executeSendQuestion(q);
  };

  const handleClearThread = () => {
    onSaveThread(threadKey, {
      caseId: selectedCaseId,
      documentScope: docScope,
      messages: [],
    });
  };

  const matchedSourceDoc = previewCitation
    ? documents.find((d) => d.name === previewCitation.documentName)
    : null;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[560px] flex-col gap-4">
      {/* Header & Case/Document Context Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900">
            AI Legal Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Ask grounded questions across case files with verbatim source citations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setDocScope("all");
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            aria-label="Select case"
          >
            <option value="">All Cases</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseId} · {c.title}
              </option>
            ))}
          </select>

          <select
            value={docScope}
            onChange={(e) => setDocScope(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none max-w-[260px]"
            aria-label="Select document scope"
          >
            <option value="all">
              All Case Documents ({caseDocs.length})
            </option>
            {caseDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {currentThread.messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearThread}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Active Scope Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-blue-700" />
            <span>
              Grounding scope:{" "}
              <strong className="text-slate-900">
                {activeDocs.length === 0
                  ? "No documents available in selection"
                  : activeDocs.map((d) => d.name).join(", ")}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Citations strictly verified against uploaded files
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {currentThread.messages.length === 0 ? (
            <div className="mx-auto max-w-2xl py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#0F1E36]">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Query Your Case Documents
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Responses include inline citations such as{" "}
                <span className="font-mono text-xs text-blue-700">
                  [Document: Contract.pdf, Page 2]
                </span>{" "}
                and clearly distinguish uploaded evidence from unverified general legal concepts.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 text-left">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={activeDocs.length === 0 || loading}
                    onClick={() => handlePromptClick(q)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-[#0F1E36] disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-2xl rounded-xl bg-[#0F1E36] px-4 py-3 text-sm text-white">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-3xl space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                    {msg.error ? (
                      <div className="flex items-start justify-between gap-3 text-sm text-red-700">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold">Unable to Generate Response</p>
                            <p className="mt-1 text-xs">{msg.error}</p>
                          </div>
                        </div>
                        {(() => {
                          const idx = currentThread.messages.findIndex((m) => m.id === msg.id);
                          const prevUser = [...currentThread.messages]
                            .slice(0, idx)
                            .reverse()
                            .find((m) => m.role === "user");
                          if (!prevUser) return null;
                          return (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handlePromptClick(prevUser.text)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 shrink-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Retry</span>
                            </button>
                          );
                        })()}
                      </div>
                    ) : (
                      <>
                        {msg.insufficientEvidence && (
                          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                            <span>
                              The currently selected documents do not contain sufficient
                              information to fully answer this query.
                            </span>
                          </div>
                        )}

                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {msg.text}
                        </div>

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold text-slate-700">
                              Supporting Citations ({msg.citations.length})
                            </p>
                            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {msg.citations.map((cit, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setPreviewCitation(cit)}
                                  className="rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-300"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                                      <BookOpen className="h-3 w-3 shrink-0" />
                                      <span>
                                        {cit.sourceCategory === "uploaded_document"
                                          ? "Uploaded Document"
                                          : "General Legal Reference (Unverified)"}
                                      </span>
                                    </span>
                                  </div>
                                  <p className="mt-1 font-mono text-xs font-medium text-slate-900 truncate">
                                    {cit.documentName}
                                    {cit.pageAvailable && cit.pageNumber
                                      ? `, Page ${cit.pageNumber}`
                                      : ", Page unavailable"}
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-xs italic text-slate-600">
                                    &ldquo;{cit.excerpt}&rdquo;
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {msg.legalAuthoritiesNotice && (
                          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                            <span>{msg.legalAuthoritiesNotice}</span>
                          </div>
                        )}

                        <p className="font-mono text-[11px] text-slate-400">
                          {formatDate(msg.timestamp)} · Verify citations against original documents
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                <span>Reviewing uploaded documents and verifying citations...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || activeDocs.length === 0}
              placeholder={
                activeDocs.length === 0
                  ? "Select a case with uploaded documents to ask questions..."
                  : "Ask a legal question about the selected document(s)..."
              }
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || activeDocs.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#182E52] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Ask</span>
            </button>
          </div>
        </form>
      </div>

      {/* Source Citation Excerpt Modal */}
      {previewCitation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  {previewCitation.sourceCategory === "uploaded_document"
                    ? "Uploaded Document Citation"
                    : "Unverified Legal Reference"}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                  {previewCitation.documentName}
                  {previewCitation.pageAvailable && previewCitation.pageNumber
                    ? ` — Page ${previewCitation.pageNumber}`
                    : " — Page unavailable"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCitation(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Cited Excerpt
                </p>
                <blockquote className="mt-1.5 rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 text-sm italic text-slate-800">
                  &ldquo;{previewCitation.excerpt}&rdquo;
                </blockquote>
                {previewCitation.note && (
                  <p className="mt-2 text-xs text-slate-600">
                    {previewCitation.note}
                  </p>
                )}
              </div>

              {matchedSourceDoc && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Full Page Context
                  </p>
                  <div className="mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">
                      {(previewCitation.pageNumber
                        ? matchedSourceDoc.pages.find(
                            (p) => p.pageNumber === previewCitation.pageNumber
                          )?.text
                        : null) || matchedSourceDoc.fullText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
