import React, { useState } from "react";
import { CheckCircle2, Download, RotateCcw, ShieldAlert } from "lucide-react";
import { UserProfile, WorkspaceState } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";

interface SettingsViewProps {
  userProfile: UserProfile;
  aiConsent: boolean;
  workspaceState: WorkspaceState;
  onSaveProfile: (profile: UserProfile) => void;
  onToggleConsent: (consent: boolean) => void;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  aiConsent,
  workspaceState,
  onSaveProfile,
  onToggleConsent,
  onResetDemoData,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [role, setRole] = useState(userProfile.role);
  const [firmName, setFirmName] = useState(userProfile.firmName);
  const [email, setEmail] = useState(userProfile.email);
  const [savedBanner, setSavedBanner] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || userProfile.name,
      role: role.trim() || userProfile.role,
      firmName: firmName.trim() || userProfile.firmName,
      email: email.trim() || userProfile.email,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleExportWorkspace = () => {
    const blob = new Blob([JSON.stringify(workspaceState, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexora-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage practitioner profile, AI processing consent, and local prototype data.
        </p>
      </div>

      {/* Practitioner Profile */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Practitioner Profile
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Title / Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Law Firm / Practice
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedBanner ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Profile saved locally
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-medium text-white hover:bg-[#182E52]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* Confidentiality & External AI Processing */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              AI Processing & Confidentiality
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Control whether extracted document text may be transmitted to the Google Gemini API for AI analysis and assistant queries.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 shrink-0">
            <input
              type="checkbox"
              checked={aiConsent}
              onChange={(e) => onToggleConsent(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#0F1E36] focus:ring-blue-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {aiConsent ? "Authorized" : "Prompt Before Sending"}
            </span>
          </label>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
          <div>
            <p className="font-semibold text-slate-900">
              Legal Disclaimer & Prototype Notice
            </p>
            <p className="mt-1">
              Lexora is an AI-assisted legal productivity tool. AI-generated summaries,
              analysis, and responses may contain errors and must be reviewed by a
              qualified legal professional. This platform does not provide legal advice.
            </p>
            <p className="mt-1.5 text-slate-600">
              Prototype Notice: Cases, uploaded document extracts, and chat histories
              persist in local browser storage and are not backed by enterprise-grade
              encryption or multi-tenant compliance controls.
            </p>
          </div>
        </div>
      </section>

      {/* Prototype Data Management */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Workspace Data
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Export your cases and document analyses as JSON, or restore the initial demo dataset.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportWorkspace}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span>Export Workspace JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Demo Data</span>
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Reset Workspace Data"
        description="This will replace all custom cases, uploaded documents, deadlines, and AI chat threads with the initial Lexora demo dataset."
        confirmLabel="Reset Workspace"
        onConfirm={() => {
          onResetDemoData();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
};
