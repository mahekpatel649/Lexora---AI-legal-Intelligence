import React from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquareText,
  Settings,
  Scale,
  X,
  ShieldAlert,
} from "lucide-react";
import { NavSection } from "../types";

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  caseCount: number;
  documentCount: number;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "cases", label: "My Cases", icon: Briefcase },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "assistant", label: "AI Legal Assistant", icon: MessageSquareText },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  caseCount,
  documentCount,
}) => {
  const handleNav = (id: NavSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <button
            type="button"
            onClick={() => handleNav("dashboard")}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F1E36] text-white">
              <Scale className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-[#0F1E36] whitespace-nowrap">
              Lexora
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            const count =
              item.id === "cases"
                ? caseCount
                : item.id === "documents"
                  ? documentCount
                  : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#0F1E36] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? "text-blue-300" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {count !== null && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      active ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F1E36]">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-700 shrink-0" />
              <span>Working Prototype</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              Lexora is an AI-assisted legal productivity tool. AI-generated summaries,
              analysis, and responses may contain errors and must be reviewed by a
              qualified legal professional. This platform does not provide legal advice.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
