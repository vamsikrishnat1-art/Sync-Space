'use client';

import React, { useState } from 'react';
import { UserPresence, ConnectionStatus } from '../../types/collaboration';
import { ActiveUsers } from '../Editor/ActiveUsers';
import { USER_PALETTES } from '../../utils/user';
import { useTheme } from '../../context/ThemeContext';
import {
  Layers,
  Columns2,
  Activity,
  User,
  Check,
  Share2,
  ChevronDown,
  Edit3,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  roomName: string;
  title: string;
  onTitleChange: (newTitle: string) => void;
  onRoomChange: (newRoom: string) => void;
  onBackHome?: () => void;
  status: ConnectionStatus;
  synced?: boolean;
  isIndexedDbSynced: boolean;
  activeUsers: UserPresence[];
  currentUser: UserPresence;
  localClientId?: number | null;
  onUpdateUserName: (name: string) => void;
  onUpdateUserColor: (color: string) => void;
  onOpenNetworkModal: () => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomName,
  title,
  onTitleChange,
  onRoomChange,
  onBackHome,
  status,
  synced = false,
  isIndexedDbSynced,
  activeUsers,
  currentUser,
  localClientId,
  onUpdateUserName,
  onUpdateUserColor,
  onOpenNetworkModal,
  isSplitView,
  onToggleSplitView,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tempName, setTempName] = useState(currentUser.name);

  // Sync tempTitle when external shared title updates
  React.useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const copyShareLink = async () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/editor?room=${encodeURIComponent(roomName)}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        // Fallback for browsers without direct async clipboard permission
        try {
          const textArea = document.createElement('textarea');
          textArea.value = url;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2200);
        } catch {
          // Ignore
        }
      }
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md flex items-center justify-between z-30 sticky top-0 shadow-xs transition-colors duration-200">
      {/* Brand & Document Info */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onBackHome}
          className="flex items-center gap-2 text-left group transition-opacity hover:opacity-90 flex-shrink-0 cursor-pointer"
          title="Back to SyncSpace Home"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight hidden sm:inline">
            SyncSpace
          </span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block flex-shrink-0" />

        {/* Shared Document Title Editor */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex-1 min-w-0">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                autoFocus
                onBlur={() => {
                  if (tempTitle.trim()) onTitleChange(tempTitle.trim());
                  setIsEditingTitle(false);
                }}
                aria-label="Document Title"
                className="w-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white px-2 py-1 rounded-lg outline-none border border-indigo-500 shadow-xs"
              />
            </form>
          ) : (
            <button
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              className="text-left font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 truncate max-w-full cursor-pointer"
              title="Click to edit shared title"
            >
              <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="truncate">{title || 'Untitled Document'}</span>
              <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </button>
          )}

          {/* Room Code Badge */}
          <span className="hidden md:inline-flex text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex-shrink-0">
            #{roomName}
          </span>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Active Collaborators */}
        <ActiveUsers
          users={activeUsers}
          currentUser={currentUser}
          localClientId={localClientId}
          status={status}
          synced={synced}
          isIndexedDbSynced={isIndexedDbSynced}
        />

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

        {/* User Identity Customizer */}
        <div className="relative">
          <button
            onClick={() => {
              setTempName(currentUser.name);
              setIsUserMenuOpen(!isUserMenuOpen);
            }}
            aria-expanded={isUserMenuOpen}
            aria-label="User profile settings"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 transition-colors text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
            title="Edit your collaborator display name and cursor color"
          >
            <div
              className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 shadow-xs"
              style={{ backgroundColor: currentUser.color }}
            />
            <span className="font-semibold hidden sm:inline max-w-[90px] truncate">
              {currentUser.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 text-xs space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-white">Collaborator Profile</span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Yjs Awareness</span>
              </div>

              <div>
                <label htmlFor="user-name-input" className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold mb-1 block">
                  Your Display Name
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 transition-colors"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold mb-1.5 block">
                  Cursor & Highlight Color
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {USER_PALETTES.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => onUpdateUserColor(p.color)}
                      aria-label={`Select ${p.name} color`}
                      className={`w-full h-6 rounded-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                        currentUser.color === p.color ? 'ring-2 ring-indigo-600 scale-105' : ''
                      }`}
                      style={{ backgroundColor: p.color }}
                    >
                      {currentUser.color === p.color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (tempName.trim()) {
                    onUpdateUserName(tempName.trim());
                  }
                  setIsUserMenuOpen(false);
                }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden xl:inline">Dark</span>
            </>
          )}
        </button>

        {/* Split Screen Demo Mode Button */}
        <button
          onClick={onToggleSplitView}
          aria-label={isSplitView ? 'Exit split-screen demo view' : 'Open split-screen dual user demo view'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isSplitView
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
          title="Toggle Side-by-Side Dual Client Demo Mode"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isSplitView ? 'Single View' : 'Split Demo'}</span>
        </button>

        {/* Network & Chaos Inspector Modal Button */}
        <button
          onClick={onOpenNetworkModal}
          aria-label="Open CRDT and Network Inspector"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          title="Inspect Yjs State Vectors, Chaos Controls & Architecture"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden lg:inline">Inspector</span>
        </button>

        {/* Share Button */}
        <button
          onClick={copyShareLink}
          aria-label="Copy document link to clipboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          title="Copy full joinable document URL"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
