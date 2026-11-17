import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import {
  AssistantThread,
  CaseDeadline,
  LegalCase,
  LegalDocument,
  NavSection,
  UserProfile,
  WorkspaceState,
} from "./types";
import {
  loadWorkspaceState,
  resetWorkspaceState,
  saveWorkspaceState,
} from "./utils/storage";
import { generateId, getTodayISO } from "./utils/formatters";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./components/DashboardView";
import { CasesView } from "./components/CasesView";
import { DocumentsView } from "./components/DocumentsView";
import { AssistantView } from "./components/AssistantView";
import { SettingsView } from "./components/SettingsView";
import { CaseModal } from "./components/CaseModal";
import { ConsentModal } from "./components/ConsentModal";

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() =>
    loadWorkspaceState()
  );
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation context state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [docUploadMode, setDocUploadMode] = useState(false);
  const [uploadPreselectCaseId, setUploadPreselectCaseId] = useState<
    string | null
  >(null);
  const [assistantCaseId, setAssistantCaseId] = useState<string | null>(null);
  const [assistantDocScope, setAssistantDocScope] = useState<string | null>(
    null
  );

  // Modals
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const pendingConsentActionRef = useRef<(() => void) | null>(null);

  // Feedback banner
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ type, text });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const result = saveWorkspaceState(workspace);
    if (!result.ok && result.error) {
      showToast(result.error, "error");
    }
  }, [workspace]);

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    if (section !== "cases") setSelectedCaseId(null);
    if (section !== "documents") {
      setSelectedDocumentId(null);
      setDocUploadMode(false);
    }
  };

  const handleSaveCase = (
    payload: Omit<LegalCase, "id" | "lastUpdated" | "aiSummary">
  ) => {
    const today = getTodayISO();
    if (editingCase) {
      setWorkspace((prev) => ({
        ...prev,
        cases: prev.cases.map((c) =>
          c.id === editingCase.id
            ? { ...c, ...payload, lastUpdated: today }
            : c
        ),
      }));
      showToast(`Updated case "${payload.title}".`);
    } else {
      const newCase: LegalCase = {
        ...payload,
        id: generateId("case"),
        lastUpdated: today,
      };
      setWorkspace((prev) => ({
        ...prev,
        cases: [newCase, ...prev.cases],
      }));
      setSelectedCaseId(newCase.id);
      setActiveSection("cases");
      showToast(`Created case "${newCase.title}".`);
    }
    setEditingCase(null);
  };

  const handleCreateQuickCase = (
    payload: Omit<LegalCase, "id" | "lastUpdated" | "aiSummary">
  ): LegalCase => {
    const newCase: LegalCase = {
      ...payload,
      id: generateId("case"),
      lastUpdated: getTodayISO(),
    };
    setWorkspace((prev) => ({
      ...prev,
      cases: [newCase, ...prev.cases],
    }));
    showToast(`Created case "${newCase.title}".`);
    return newCase;
  };

  const handleDeleteCase = (caseInternalId: string) => {
    const target = workspace.cases.find((c) => c.id === caseInternalId);
    setWorkspace((prev) => ({
      ...prev,
      cases: prev.cases.filter((c) => c.id !== caseInternalId),
      deadlines: prev.deadlines.filter((d) => d.caseId !== caseInternalId),
      documents: prev.documents.map((doc) =>
        doc.caseId === caseInternalId ? { ...doc, caseId: "" } : doc
      ),
    }));
    setSelectedCaseId(null);
    showToast(`Deleted case "${target?.title || "matter"}".`);
  };

  const handleAddDocument = (doc: LegalDocument) => {
    setWorkspace((prev) => ({
      ...prev,
      documents: [doc, ...prev.documents],
      cases: prev.cases.map((c) =>
        c.id === doc.caseId ? { ...c, lastUpdated: getTodayISO() } : c
      ),
    }));
    showToast(`Uploaded "${doc.name}". Ready for AI analysis.`);
  };

  const handleUpdateDocument = (updatedDoc: LegalDocument) => {
    setWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === updatedDoc.id ? updatedDoc : d
      ),
      notifications:
        updatedDoc.analysisStatus === "Analyzed"
          ? [
              {
                id: generateId("notif"),
                title: "Document analysis complete",
                detail: `${updatedDoc.name} structured legal review is ready.`,
                timestamp: new Date().toISOString(),
                read: false,
                targetSection: "documents",
                targetId: updatedDoc.id,
              },
              ...prev.notifications.slice(0, 14),
            ]
          : prev.notifications,
    }));
  };

  const handleDeleteDocument = (docId: string) => {
    const target = workspace.documents.find((d) => d.id === docId);
    setWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== docId),
    }));
    if (selectedDocumentId === docId) {
      setSelectedDocumentId(null);
    }
    showToast(`Removed document "${target?.name || "file"}".`);
  };

  const handleAddDeadline = (payload: Omit<CaseDeadline, "id" | "completed">) => {
    const newDl: CaseDeadline = {
      ...payload,
      id: generateId("dl"),
      completed: false,
    };
    setWorkspace((prev) => ({
      ...prev,
      deadlines: [...prev.deadlines, newDl],
    }));
    showToast(`Added deadline "${newDl.title}".`);
  };

  const handleToggleDeadline = (deadlineId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      deadlines: prev.deadlines.map((d) =>
        d.id === deadlineId ? { ...d, completed: !d.completed } : d
      ),
    }));
  };

  const handleDeleteDeadline = (deadlineId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      deadlines: prev.deadlines.filter((d) => d.id !== deadlineId),
    }));
  };

  const handleUpdateCaseAISummary = (
    caseInternalId: string,
    summary: LegalCase["aiSummary"]
  ) => {
    setWorkspace((prev) => ({
      ...prev,
      cases: prev.cases.map((c) =>
        c.id === caseInternalId
          ? { ...c, aiSummary: summary, lastUpdated: getTodayISO() }
          : c
      ),
    }));
    showToast("AI case summary generated.");
  };

  const handleSaveThread = (threadKey: string, thread: AssistantThread) => {
    setWorkspace((prev) => ({
      ...prev,
      threads: {
        ...prev.threads,
        [threadKey]: thread,
      },
    }));
  };

  const handleRequireConsent = (pendingAction?: () => void) => {
    pendingConsentActionRef.current = pendingAction || null;
    setConsentModalOpen(true);
  };

  const handleAcceptConsent = () => {
    setWorkspace((prev) => ({ ...prev, aiProcessingConsent: true }));
    setConsentModalOpen(false);
    const fn = pendingConsentActionRef.current;
    pendingConsentActionRef.current = null;
    if (fn) {
      fn();
    }
  };

  const handleSaveProfile = (profile: UserProfile) => {
    setWorkspace((prev) => ({ ...prev, userProfile: profile }));
    showToast("Practitioner profile updated.");
  };

  const handleResetDemoData = () => {
    const fresh = resetWorkspaceState();
    setWorkspace(fresh);
    setSelectedCaseId(null);
    setSelectedDocumentId(null);
    setDocUploadMode(false);
    showToast("Workspace restored to initial demo dataset.");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        caseCount={workspace.cases.length}
        documentCount={workspace.documents.length}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          cases={workspace.cases}
          documents={workspace.documents}
          notifications={workspace.notifications}
          userProfile={workspace.userProfile}
          onNavigateToCase={(caseId) => {
            setSelectedCaseId(caseId);
            setActiveSection("cases");
          }}
          onNavigateToDocument={(docId) => {
            setDocUploadMode(false);
            setSelectedDocumentId(docId);
            setActiveSection("documents");
          }}
          onNavigateSection={handleSelectSection}
          onMarkNotificationRead={(id) =>
            setWorkspace((prev) => ({
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
            }))
          }
          onMarkAllRead={() =>
            setWorkspace((prev) => ({
              ...prev,
              notifications: prev.notifications.map((n) => ({ ...n, read: true })),
            }))
          }
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeSection === "dashboard" && (
              <DashboardView
                cases={workspace.cases}
                documents={workspace.documents}
                deadlines={workspace.deadlines}
                onCreateCase={() => {
                  setEditingCase(null);
                  setCaseModalOpen(true);
                }}
                onOpenUploadDocument={() => {
                  setUploadPreselectCaseId(null);
                  setSelectedDocumentId(null);
                  setDocUploadMode(true);
                  setActiveSection("documents");
                }}
                onSelectCase={(caseId) => {
                  setSelectedCaseId(caseId);
                  setActiveSection("cases");
                }}
                onSelectDocument={(docId) => {
                  setDocUploadMode(false);
                  setSelectedDocumentId(docId);
                  setActiveSection("documents");
                }}
                onToggleDeadline={handleToggleDeadline}
                onViewAllCases={() => {
                  setSelectedCaseId(null);
                  setActiveSection("cases");
                }}
                onViewAllDocuments={() => {
                  setSelectedDocumentId(null);
                  setDocUploadMode(false);
                  setActiveSection("documents");
                }}
              />
            )}

            {activeSection === "cases" && (
              <CasesView
                cases={workspace.cases}
                documents={workspace.documents}
                deadlines={workspace.deadlines}
                selectedCaseId={selectedCaseId}
                aiConsent={workspace.aiProcessingConsent}
                onRequireConsent={handleRequireConsent}
                onSelectCase={setSelectedCaseId}
                onOpenNewCaseModal={() => {
                  setEditingCase(null);
                  setCaseModalOpen(true);
                }}
                onOpenEditCaseModal={(legalCase) => {
                  setEditingCase(legalCase);
                  setCaseModalOpen(true);
                }}
                onDeleteCase={handleDeleteCase}
                onOpenUploadForCase={(caseId) => {
                  setUploadPreselectCaseId(caseId);
                  setSelectedDocumentId(null);
                  setDocUploadMode(true);
                  setActiveSection("documents");
                }}
                onOpenDocumentAnalysis={(docId) => {
                  setDocUploadMode(false);
                  setSelectedDocumentId(docId);
                  setActiveSection("documents");
                }}
                onAskAIAboutCase={(caseId) => {
                  setAssistantCaseId(caseId);
                  setAssistantDocScope("all");
                  setActiveSection("assistant");
                }}
                onUpdateCaseAISummary={handleUpdateCaseAISummary}
                onAddDeadline={handleAddDeadline}
                onToggleDeadline={handleToggleDeadline}
                onDeleteDeadline={handleDeleteDeadline}
              />
            )}

            {activeSection === "documents" && (
              <DocumentsView
                cases={workspace.cases}
                documents={workspace.documents}
                selectedDocumentId={selectedDocumentId}
                uploadMode={docUploadMode}
                preselectedCaseId={uploadPreselectCaseId}
                aiConsent={workspace.aiProcessingConsent}
                onRequireConsent={handleRequireConsent}
                onSelectDocument={setSelectedDocumentId}
                onSetUploadMode={setDocUploadMode}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                onDeleteDocument={handleDeleteDocument}
                onCreateQuickCase={handleCreateQuickCase}
                onAskAIAboutDocument={(caseId, docId) => {
                  setAssistantCaseId(caseId);
                  setAssistantDocScope(docId);
                  setActiveSection("assistant");
                }}
              />
            )}

            {activeSection === "assistant" && (
              <AssistantView
                cases={workspace.cases}
                documents={workspace.documents}
                threads={workspace.threads}
                initialCaseId={assistantCaseId}
                initialDocScope={assistantDocScope}
                aiConsent={workspace.aiProcessingConsent}
                onRequireConsent={handleRequireConsent}
                onSaveThread={handleSaveThread}
              />
            )}

            {activeSection === "settings" && (
              <SettingsView
                userProfile={workspace.userProfile}
                aiConsent={workspace.aiProcessingConsent}
                workspaceState={workspace}
                onSaveProfile={handleSaveProfile}
                onToggleConsent={(consent) =>
                  setWorkspace((prev) => ({
                    ...prev,
                    aiProcessingConsent: consent,
                  }))
                }
                onResetDemoData={handleResetDemoData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Case Create / Edit Modal */}
      <CaseModal
        open={caseModalOpen}
        initialCase={editingCase}
        onClose={() => {
          setCaseModalOpen(false);
          setEditingCase(null);
        }}
        onSave={handleSaveCase}
      />

      {/* External AI Processing Consent Modal */}
      <ConsentModal
        open={consentModalOpen}
        onAccept={handleAcceptConsent}
        onCancel={() => {
          setConsentModalOpen(false);
          pendingConsentActionRef.current = null;
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-xs font-medium shadow-lg ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-slate-200 bg-[#0F1E36] text-white"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" />
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 rounded p-0.5 opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
