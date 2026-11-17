import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Briefcase,
  Check,
  FileText,
  Menu,
  Search,
  X,
} from "lucide-react";
import {
  AppNotification,
  LegalCase,
  LegalDocument,
  NavSection,
  UserProfile,
} from "../types";
import { formatDate } from "../utils/formatters";

interface TopBarProps {
  onOpenMobileMenu: () => void;
  cases: LegalCase[];
  documents: LegalDocument[];
  notifications: AppNotification[];
  userProfile: UserProfile;
  onNavigateToCase: (caseId: string) => void;
  onNavigateToDocument: (docId: string) => void;
  onNavigateSection: (section: NavSection) => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const AVATAR_SRC = "/src/assets/images/avatar_counsel_portrait_1794918582060.jpg";

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  cases,
  documents,
  notifications,
  userProfile,
  onNavigateToCase,
  onNavigateToDocument,
  onNavigateSection,
  onMarkNotificationRead,
  onMarkAllRead,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const matchedCases = q
    ? cases
        .filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.caseId.toLowerCase().includes(q) ||
            c.clientName.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];
  const matchedDocs = q
    ? documents
        .filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.fileType.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials = userProfile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div ref={searchRef} className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search cases, IDs, clients, or documents..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            aria-label="Global search"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {searchFocused && q && (
            <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {matchedCases.length === 0 && matchedDocs.length === 0 ? (
                <div className="px-4 py-5 text-center text-sm text-slate-500">
                  No cases or documents matching "{searchQuery}".
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {matchedCases.length > 0 && (
                    <div className="p-2">
                      <div className="px-2.5 py-1 text-xs font-medium text-slate-400">
                        Cases
                      </div>
                      {matchedCases.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onNavigateToCase(c.id);
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                        >
                          <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {c.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              <span className="font-mono">{c.caseId}</span> · {c.clientName}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedDocs.length > 0 && (
                    <div className="p-2">
                      <div className="px-2.5 py-1 text-xs font-medium text-slate-400">
                        Documents
                      </div>
                      {matchedDocs.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            onNavigateToDocument(d.id);
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-blue-700" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {d.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {d.fileType} · {d.analysisStatus}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-700 px-1 font-mono text-[10px] font-semibold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="font-display text-sm font-semibold text-slate-900">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        setNotifOpen(false);
                        if (n.targetSection === "cases" && n.targetId) {
                          onNavigateToCase(n.targetId);
                        } else if (n.targetSection === "documents" && n.targetId) {
                          onNavigateToDocument(n.targetId);
                        } else {
                          onNavigateSection(n.targetSection);
                        }
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        n.read ? "bg-white" : "bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{n.detail}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400 tabular-nums">
                        {formatDate(n.timestamp)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <button
          type="button"
          onClick={() => onNavigateSection("settings")}
          className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-slate-50"
        >
          {!avatarError ? (
            <img
              src={AVATAR_SRC}
              alt={userProfile.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F1E36] text-xs font-semibold text-white">
              {initials || "EV"}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight whitespace-nowrap">
              {userProfile.name}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight whitespace-nowrap">
              {userProfile.role}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
