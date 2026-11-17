import { WorkspaceState } from "../types";
import { INITIAL_WORKSPACE_STATE } from "../data/demoData";

const STORAGE_KEY = "lexora_workspace_v1";

export function loadWorkspaceState(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_WORKSPACE_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      cases: Array.isArray(parsed.cases) ? parsed.cases : INITIAL_WORKSPACE_STATE.cases,
      documents: Array.isArray(parsed.documents)
        ? parsed.documents
        : INITIAL_WORKSPACE_STATE.documents,
      deadlines: Array.isArray(parsed.deadlines)
        ? parsed.deadlines
        : INITIAL_WORKSPACE_STATE.deadlines,
      threads:
        parsed.threads && typeof parsed.threads === "object"
          ? parsed.threads
          : {},
      userProfile: parsed.userProfile || INITIAL_WORKSPACE_STATE.userProfile,
      aiProcessingConsent: Boolean(parsed.aiProcessingConsent),
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : INITIAL_WORKSPACE_STATE.notifications,
    };
  } catch {
    return INITIAL_WORKSPACE_STATE;
  }
}

export function saveWorkspaceState(state: WorkspaceState): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Local browser storage quota exceeded. Consider removing large unused documents.",
    };
  }
}

export function resetWorkspaceState(): WorkspaceState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WORKSPACE_STATE));
  return INITIAL_WORKSPACE_STATE;
}
