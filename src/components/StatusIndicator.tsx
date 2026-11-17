import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDot,
  Archive,
} from "lucide-react";
import { AnalysisStatus, CaseStatus, DeadlinePriority } from "../types";

export const CaseStatusText: React.FC<{ status: CaseStatus }> = ({ status }) => {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CircleDot className="h-3.5 w-3.5 shrink-0" />
        <span>Active</span>
      </span>
    );
  }
  if (status === "Pending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>Pending</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
      <Archive className="h-3.5 w-3.5 shrink-0" />
      <span>Closed</span>
    </span>
  );
};

export const AnalysisStatusText: React.FC<{ status: AnalysisStatus }> = ({ status }) => {
  if (status === "Analyzed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Analyzed</span>
      </span>
    );
  }
  if (status === "Error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Analysis Failed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>Pending Analysis</span>
    </span>
  );
};

export const PriorityText: React.FC<{ priority: DeadlinePriority }> = ({ priority }) => {
  if (priority === "High") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>High</span>
      </span>
    );
  }
  if (priority === "Medium") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>Medium</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
      <CircleDot className="h-3.5 w-3.5 shrink-0" />
      <span>Low</span>
    </span>
  );
};
