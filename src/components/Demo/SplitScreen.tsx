'use client';

import React from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { CollaborativeEditor } from '../Editor/Editor';
import { Wifi, WifiOff, Layers } from 'lucide-react';

interface SplitScreenProps {
  roomName: string;
}

export const SplitScreen: React.FC<SplitScreenProps> = ({ roomName }) => {
  // Client A (Alice - Emerald)
  const clientA = useCollaboration({
    room: roomName,
    idbName: `${roomName}-alice`,
    initialUser: {
      id: 'demo-user-alice',
      name: 'Alice (Client A)',
      color: '#10b981',
      colorLight: 'rgba(16, 185, 129, 0.25)',
    },
  });

  // Client B (Bob - Rose)
  const clientB = useCollaboration({
    room: roomName,
    idbName: `${roomName}-bob`,
    initialUser: {
      id: 'demo-user-bob',
      name: 'Bob (Client B)',
      color: '#f43f5e',
      colorLight: 'rgba(244, 63, 94, 0.25)',
    },
  });

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-8.5rem)] animate-fadeIn">
      {/* Subheader Banner */}
      <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-slate-900 dark:text-white">
            Two independent clients — one shared CRDT document
          </span>
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline font-mono">| Room: #{roomName}</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
          Test concurrent edits &amp; disconnect one side to demonstrate conflict-free convergence.
        </div>
      </div>

      {/* Side-by-Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Client A Panel */}
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">CLIENT A — Alice</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold">
                {clientA.status === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>

            <button
              onClick={clientA.toggleConnection}
              aria-label={clientA.status === 'connected' ? 'Disconnect Client A' : 'Reconnect Client A'}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                clientA.status === 'connected'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {clientA.status === 'connected' ? (
                <>
                  <WifiOff className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Go Offline
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Reconnect
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-2 bg-slate-50/50 dark:bg-[#070a12]/60">
            <CollaborativeEditor
              ydoc={clientA.ydoc}
              provider={clientA.provider}
              currentUser={clientA.currentUser}
              title={clientA.title}
            />
          </div>
        </div>

        {/* Client B Panel */}
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-xs" />
              <span className="text-xs font-bold text-rose-800 dark:text-rose-400">CLIENT B — Bob</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">
                {clientB.status === 'connected' ? 'Online' : 'Offline'}
              </span>
            </div>

            <button
              onClick={clientB.toggleConnection}
              aria-label={clientB.status === 'connected' ? 'Disconnect Client B' : 'Reconnect Client B'}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                clientB.status === 'connected'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {clientB.status === 'connected' ? (
                <>
                  <WifiOff className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Go Offline
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Reconnect
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-2 bg-slate-50/50 dark:bg-[#070a12]/60">
            <CollaborativeEditor
              ydoc={clientB.ydoc}
              provider={clientB.provider}
              currentUser={clientB.currentUser}
              title={clientB.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
