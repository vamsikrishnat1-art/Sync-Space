'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  FilePlus,
  ArrowRight,
  ShieldCheck,
  Wifi,
  Database,
  Users,
  GitMerge,
  HardDrive,
  Cpu,
  Sparkles,
  CheckCircle2,
  Lock,
  Code2,
  Activity,
  FileText,
  User,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { generateRoomCode, sanitizeRoomCode } from '../../utils/roomCode';
import { useTheme } from '../../context/ThemeContext';

interface LandingPageProps {
  onOpenRoom: (roomName: string, initialTitle?: string, userName?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenRoom }) => {
  const { theme, toggleTheme } = useTheme();
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Form states for New Document
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUserName, setNewDocUserName] = useState('');
  const [newDocError, setNewDocError] = useState('');

  // Form states for Join Document
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinUserName, setJoinUserName] = useState('');
  const [joinError, setJoinError] = useState('');

  // Load stored user name from sessionStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('syncspace_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.name) {
            setNewDocUserName(parsed.name);
            setJoinUserName(parsed.name);
          }
        } catch {
          // ignore
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNewDocModalOpen(false);
        setIsJoinModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNewDocModal = () => {
    setNewDocTitle('');
    setNewDocError('');
    setIsNewDocModalOpen(true);
  };

  const handleOpenJoinModal = () => {
    setJoinRoomCode('');
    setJoinError('');
    setIsJoinModalOpen(true);
  };

  const handleCreateDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      setNewDocError('Document name is required.');
      return;
    }
    if (!newDocUserName.trim()) {
      setNewDocError('Your name is required.');
      return;
    }

    const roomCode = generateRoomCode();
    setIsNewDocModalOpen(false);
    onOpenRoom(roomCode, newDocTitle.trim(), newDocUserName.trim());
  };

  const handleJoinDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCode.trim()) {
      setJoinError('Document code is required.');
      return;
    }
    if (!joinUserName.trim()) {
      setJoinError('Your name is required.');
      return;
    }

    const sanitized = sanitizeRoomCode(joinRoomCode.trim());
    setIsJoinModalOpen(false);
    onOpenRoom(sanitized, undefined, joinUserName.trim());
  };

  const handleQuickDemoJoin = (room: string) => {
    setIsJoinModalOpen(false);
    onOpenRoom(room, undefined, joinUserName.trim() || undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
      {/* Top Navigation */}
      <header className="h-16 px-6 md:px-12 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">SyncSpace</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
            CRDT Engine
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={handleOpenJoinModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Join Document
          </button>
          <button
            onClick={handleOpenNewDocModal}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>+ New Document</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 md:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Real-Time Collaboration • Zero Last-Write-Wins Overwrites</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-6">
          Collaborate. Create. <span className="text-indigo-600 dark:text-indigo-400">Sync.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          A real-time collaborative document editor powered by Yjs CRDT technology. Edit simultaneously, work offline, and converge deterministically without data loss.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md justify-center">
          <button
            onClick={handleOpenNewDocModal}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>+ New Document</span>
          </button>

          <button
            onClick={handleOpenJoinModal}
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Join Document</span>
          </button>
        </div>

        {/* Quick Demo Shortcuts */}
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Quick demo rooms:</span>
          <button
            onClick={() => onOpenRoom('human-test')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
          >
            #human-test
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenRoom('hackathon-demo-1')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
          >
            #hackathon-demo-1
          </button>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-12 px-6 md:px-12 bg-white dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Engineered for Mathematical Convergence</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Built from first principles on Conflict-Free Replicated Data Types.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Real-Time Multi-User Editing</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Seamless peer editing with live colored cursor carets, remote selection highlights, and instant active presence trays.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Yjs CRDT Conflict Resolution</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Guaranteed deterministic state convergence without Last-Write-Wins overwrites or centralized locking bottlenecks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Offline-First IndexedDB</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Edit continuously offline. All document state and changes persist locally and sync automatically upon network reconnection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Tech Architecture Specs */}
      <section className="py-14 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
                Zero-Database Architecture
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Pure State Vectors &amp; Cryptographic Sync
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                SyncSpace operates without centralized database bottlenecks. Documents are synchronized using binary state vectors over WebSocket and stored in client IndexedDB.
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>State vectors exchange only missing update fragments</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Sub-10ms synchronization latency under concurrent typing</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>100% mathematically proven convergence guarantees</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Code2 className="w-4 h-4" /> Technical Architecture
                </span>
                <span className="text-[10px] text-slate-500">Live Stack</span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">CRDT Engine:</span>
                  <span className="text-indigo-300 font-semibold">Yjs v13</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rich Text:</span>
                  <span className="text-indigo-300 font-semibold">Tiptap v2 (ProseMirror)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Real-Time Transport:</span>
                  <span className="text-indigo-300 font-semibold">y-websocket (Port 1234)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Local Persistence:</span>
                  <span className="text-indigo-300 font-semibold">y-indexeddb (Client DB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Conflict Strategy:</span>
                  <span className="text-emerald-400 font-semibold">YATA CRDT (No LWW)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 md:px-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            S
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">SyncSpace</span>
          <span>— Collaborative CRDT Workspace</span>
        </div>
        <div>
          <span>Built for Hackathon • High-Performance Real-Time Collaboration</span>
        </div>
      </footer>

      {/* CREATE NEW DOCUMENT MODAL */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">CREATE NEW DOCUMENT</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Start a new real-time collaborative session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocumentSubmit} className="space-y-4 pt-1">
              {newDocError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {newDocError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Document name:
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => {
                    setNewDocTitle(e.target.value);
                    if (newDocError) setNewDocError('');
                  }}
                  placeholder="e.g. Hackathon Demo, Sprint Notes"
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Your name:
                </label>
                <input
                  type="text"
                  value={newDocUserName}
                  onChange={(e) => {
                    setNewDocUserName(e.target.value);
                    if (newDocError) setNewDocError('');
                  }}
                  placeholder="e.g. Vamsi, Alice"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FilePlus className="w-4 h-4" />
                  Create Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN DOCUMENT MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">JOIN A DOCUMENT</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enter a room code or shared document name</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinDocumentSubmit} className="space-y-4 pt-1">
              {joinError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {joinError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Document Code:
                </label>
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => {
                    setJoinRoomCode(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  placeholder="e.g. SYNC-7K4P2 or human-test"
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-colors uppercase placeholder:normal-case font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Your name:
                </label>
                <input
                  type="text"
                  value={joinUserName}
                  onChange={(e) => {
                    setJoinUserName(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  placeholder="e.g. Alice, Bob"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Quick Join Demo Rooms:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoJoin('human-test')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    #human-test
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoJoin('hackathon-demo-1')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    #hackathon-demo-1
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  Join Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
