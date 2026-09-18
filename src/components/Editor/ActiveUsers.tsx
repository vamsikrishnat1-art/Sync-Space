'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserPresence, ConnectionStatus } from '../../types/collaboration';
import { Users, Wifi, WifiOff, Loader2, HardDrive, Circle, ChevronDown, Check } from 'lucide-react';

interface ActiveUsersProps {
  users: UserPresence[];
  currentUser: UserPresence;
  localClientId?: number | null;
  status: ConnectionStatus;
  isIndexedDbSynced: boolean;
  synced?: boolean;
}

export const ActiveUsers: React.FC<ActiveUsersProps> = ({
  users,
  currentUser,
  localClientId,
  status,
  isIndexedDbSynced,
  synced = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Display count: if users array is populated use users.length, fallback to at least 1 (local user)
  const displayCount = Math.max(users.length, 1);

  return (
    <div ref={popoverRef} className="relative flex items-center gap-2 sm:gap-2.5">
      {/* Network / DB Status Badges */}
      <div
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
        title={
          status === 'connected'
            ? synced
              ? 'Connected to WebSocket server and fully synchronized with Yjs CRDT.'
              : 'Connected, synchronizing state...'
            : status === 'connecting'
            ? 'Establishing WebSocket connection...'
            : 'Disconnected from server. Edits are being stored locally in IndexedDB.'
        }
      >
        {status === 'connected' && (
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">
              {synced ? 'Online • Synced' : 'Online • Syncing...'}
            </span>
          </span>
        )}
        {status === 'connecting' && (
          <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
            <span>Connecting...</span>
          </span>
        )}
        {status === 'disconnected' && (
          <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
            <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Offline (IDB)</span>
          </span>
        )}

        {isIndexedDbSynced && (
          <span className="text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-1.5 hidden md:flex items-center gap-1 text-[10px] font-mono">
            <HardDrive className="w-3 h-3 text-slate-400" />
            IDB Ready
          </span>
        )}
      </div>

      {/* Collaborator Avatars & Participant Count Trigger Button */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen((prev) => !prev)}
        aria-expanded={isPopoverOpen}
        aria-label="View connected participants in this document"
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
        title="Click to view all collaborators in this document"
      >
        {/* Collaborator Avatars */}
        <div
          className="flex items-center -space-x-1.5 overflow-hidden py-0.5"
          aria-label="Active collaborators"
        >
          {users.length > 0 ? (
            users.map((u) => {
              const isMe = localClientId != null ? u.id === localClientId : u.name === currentUser.name;
              const initials = (u.name || 'U')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={u.id}
                  className="relative transition-transform group-hover:scale-105"
                  aria-label={`${u.name} ${isMe ? '(You)' : ''}`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-xs transition-all"
                    style={{ backgroundColor: u.color }}
                  >
                    {initials}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 shadow-xs"
              style={{ backgroundColor: currentUser.color }}
            >
              {(currentUser.name || 'U').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Count Pill */}
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 pl-1 border-l border-slate-200 dark:border-slate-700">
          <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {displayCount}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 transition-transform duration-150 group-hover:translate-y-0.5" />
        </div>
      </button>

      {/* PARTICIPANT LIST POPOVER / DROPDOWN */}
      {isPopoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3 animate-fadeIn">
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-slate-900 dark:text-white">People in this document</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 font-mono">
              {displayCount} active
            </span>
          </div>

          {/* User List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
            {users.length > 0 ? (
              users.map((u) => {
                const isMe = localClientId != null ? u.id === localClientId : u.name === currentUser.name;
                const initials = (u.name || 'U')
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                      isMe
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/70 dark:border-indigo-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: u.color }}
                        >
                          {initials}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {u.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] uppercase tracking-wide">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">
                          {isMe ? 'Local Session' : `Client #${u.id}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Online</span>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Fallback showing local user */
              <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: currentUser.color }}
                    >
                      {(currentUser.name || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {currentUser.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] uppercase tracking-wide">
                        You
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">Local Session</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
            Real-time peer presence synchronized via Yjs Awareness
          </p>
        </div>
      )}
    </div>
  );
};
