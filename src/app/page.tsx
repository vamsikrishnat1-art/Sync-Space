'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollaboration } from '../hooks/useCollaboration';
import { CollaborativeEditor } from '../components/Editor/Editor';
import { Header } from '../components/Header/Header';
import { NetworkModal } from '../components/Header/NetworkModal';
import { SplitScreen } from '../components/Demo/SplitScreen';
import { LandingPage } from '../components/Landing/LandingPage';
import {
  Sparkles,
  CheckCircle2,
  Network,
  User,
  Layers,
  ArrowRight,
} from 'lucide-react';

function SyncSpaceContent({
  roomName,
  initialTitle,
  initialUserName,
  onBackHome,
}: {
  roomName: string;
  initialTitle?: string;
  initialUserName?: string;
  onBackHome: () => void;
}) {
  const [currentRoom, setCurrentRoom] = useState(roomName);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  // Name prompt modal for direct URL visitors without a set name
  const [showNameModal, setShowNameModal] = useState(false);
  const [joinNameInput, setJoinNameInput] = useState('');

  // Synchronize room in URL query param without full page reload
  const handleRoomChange = (newRoom: string) => {
    setCurrentRoom(newRoom);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoom);
      window.history.pushState({}, '', url);
    }
  };

  const collab = useCollaboration({
    room: currentRoom,
    initialTitle,
    initialUserName,
  });

  // Check if user came from a direct URL link without having set a name
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (initialUserName) {
        collab.updateUserName(initialUserName);
        return;
      }
      const stored = sessionStorage.getItem('syncspace_user');
      if (!stored) {
        setShowNameModal(true);
      } else {
        try {
          const parsed = JSON.parse(stored);
          if (!parsed.name || parsed.name === 'Collaborator') {
            setShowNameModal(true);
          }
        } catch {
          setShowNameModal(true);
        }
      }
    }
  }, [initialUserName]);

  const handleNameModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinNameInput.trim()) {
      collab.updateUserName(joinNameInput.trim());
      setShowNameModal(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 animate-fadeIn transition-colors duration-200">
      {/* Top Header */}
      <Header
        roomName={currentRoom}
        title={collab.title}
        onTitleChange={collab.updateTitle}
        onRoomChange={handleRoomChange}
        onBackHome={onBackHome}
        status={collab.status}
        synced={collab.synced}
        isIndexedDbSynced={collab.isIndexedDbSynced}
        activeUsers={collab.activeUsers}
        currentUser={collab.currentUser}
        localClientId={collab.localClientId}
        onUpdateUserName={collab.updateUserName}
        onUpdateUserColor={collab.updateUserColor}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col p-3 md:p-6 max-w-7xl mx-auto w-full">
        {/* Judge Demo Flow Banner */}
        {showDemoBanner && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 shadow-xs transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/80">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <strong className="text-slate-900 dark:text-white font-semibold">Judge Demo Flow:</strong>{' '}
                Click{' '}
                <button
                  onClick={() => setIsSplitView(true)}
                  className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Split Demo
                </button>{' '}
                to open dual side-by-side clients, or click{' '}
                <button
                  onClick={() => setIsNetworkModalOpen(true)}
                  className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Inspector
                </button>{' '}
                to simulate offline network drops and observe CRDT conflict resolution.
              </div>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              aria-label="Dismiss judge demo tip"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-1 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {isSplitView ? (
          <SplitScreen roomName={currentRoom} />
        ) : (
          <div className="flex-1 flex flex-col h-[calc(100vh-9.5rem)]">
            <CollaborativeEditor
              ydoc={collab.ydoc}
              provider={collab.provider}
              currentUser={collab.currentUser}
              title={collab.title}
              onNewDocument={onBackHome}
            />
          </div>
        )}
      </main>

      {/* Footer Info / CRDT Guarantee */}
      <footer className="py-2.5 px-4 md:px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-3">
          <span>
            CRDT: <strong className="text-slate-700 dark:text-slate-300 font-semibold">Yjs v13</strong>
          </span>
          <span>•</span>
          <span>
            Protocol: <strong className="text-slate-700 dark:text-slate-300 font-semibold">y-websocket (Port 1234)</strong>
          </span>
          <span>•</span>
          <span>
            Local Store: <strong className="text-slate-700 dark:text-slate-300 font-semibold">IndexedDB</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsNetworkModalOpen(true)}
            className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Architecture Diagram</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mathematical Convergence (No LWW)</span>
          </div>
        </div>
      </footer>

      {/* Name Entry Modal for Direct URL visitors */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">JOIN DOCUMENT</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Room: #{currentRoom}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Please enter your display name to collaborate in this document session.
            </p>

            <form onSubmit={handleNameModalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Your name:
                </label>
                <input
                  type="text"
                  value={joinNameInput}
                  onChange={(e) => setJoinNameInput(e.target.value)}
                  placeholder="e.g. Alice, Bob"
                  autoFocus
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!joinNameInput.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Join Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CRDT & Network Modal */}
      <NetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        status={collab.status}
        vectorStateSize={collab.vectorStateSize}
        isIndexedDbSynced={collab.isIndexedDbSynced}
        onToggleConnection={collab.toggleConnection}
        roomName={currentRoom}
      />
    </div>
  );
}

function PageController() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');

  const [activeRoom, setActiveRoom] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('room') || roomParam;
    }
    return roomParam;
  });
  const [initialDocTitle, setInitialDocTitle] = useState<string | undefined>(undefined);
  const [initialDocUserName, setInitialDocUserName] = useState<string | undefined>(undefined);

  const handleOpenRoom = (roomName: string, docTitle?: string, userName?: string) => {
    setInitialDocTitle(docTitle);
    setInitialDocUserName(userName);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin + '/editor');
      url.searchParams.set('room', roomName);
      window.history.pushState({}, '', url);
      setActiveRoom(roomName);
    }
  };

  const handleBackHome = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      setActiveRoom(null);
    }
  };

  useEffect(() => {
    const r = searchParams.get('room');
    if (r) {
      setActiveRoom(r);
    }
  }, [searchParams]);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveRoom(params.get('room'));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (!activeRoom) {
    return <LandingPage onOpenRoom={handleOpenRoom} />;
  }

  return (
    <SyncSpaceContent
      key={activeRoom}
      roomName={activeRoom}
      initialTitle={initialDocTitle}
      initialUserName={initialDocUserName}
      onBackHome={handleBackHome}
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
          Loading SyncSpace...
        </div>
      }
    >
      <PageController />
    </Suspense>
  );
}
