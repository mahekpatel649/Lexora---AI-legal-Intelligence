import React from "react";
import { ShieldCheck, X } from "lucide-react";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  open,
  onAccept,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="consent-modal-title"
                className="font-display text-base font-semibold text-slate-900"
              >
                External AI Processing Notice
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Confidentiality & Prototype Disclosure
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          <p>
            To perform AI document analysis, case summarization, or question-answering,
            Lexora sends extracted document text and your query securely through the
            application server to the <strong>Google Gemini API</strong>.
          </p>
          <p>
            <strong>Prototype Notice:</strong> This application is a functional prototype
            storing workspace data in your browser&apos;s local storage and does not
            provide enterprise-grade security certifications or attorney-client
            privilege guarantees. Avoid uploading sensitive unredacted client secrets
            unless authorized for prototype evaluation.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-medium text-white hover:bg-[#182E52]"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
