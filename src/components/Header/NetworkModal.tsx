'use client';

import React, { useState } from 'react';
import { ConnectionStatus } from '../../types/collaboration';
import { ConvergenceTest } from '../Demo/ConvergenceTest';
import {
  X,
  Activity,
  Database,
  Wifi,
  WifiOff,
  GitMerge,
  ShieldCheck,
  Zap,
  Network,
  ArrowRight,
  HardDrive,
  Cpu,
  FlaskConical,
} from 'lucide-react';

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ConnectionStatus;
  vectorStateSize: number;
  isIndexedDbSynced: boolean;
  onToggleConnection: () => void;
  roomName: string;
}

export const NetworkModal: React.FC<NetworkModalProps> = ({
  isOpen,
  onClose,
  status,
  vectorStateSize,
  isIndexedDbSynced,
  onToggleConnection,
  roomName,
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'convergence' | 'architecture'>('inspector');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                CRDT &amp; Network Inspector
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Yjs Vector Clocks, Convergence Stress Test &amp; Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'inspector'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Live State &amp; Chaos Sandbox
          </button>

          <button
            onClick={() => setActiveTab('convergence')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'convergence'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            CRDT Convergence Test
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Architecture Flow
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300 flex-1 bg-white dark:bg-slate-900 transition-colors duration-200">
          {activeTab === 'inspector' && (
            <>
              {/* Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WebSocket Connection */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">WebSocket Transport</span>
                    {status === 'connected' ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                      </span>
                    ) : status === 'connecting' ? (
                      <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Connecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Disconnected
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Room: <code className="text-indigo-700 dark:text-indigo-400 font-bold font-mono">#{roomName}</code>
                    </span>
                    <button
                      onClick={onToggleConnection}
                      aria-label={status === 'connected' ? 'Cut WebSocket connection' : 'Reconnect WebSocket'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                        status === 'connected'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {status === 'connected' ? (
                        <>
                          <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Cut Connection
                        </>
                      ) : (
                        <>
                          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Reconnect
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* IndexedDB Persistence */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">IndexedDB Local Cache</span>
                    {isIndexedDbSynced ? (
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Database className="w-3.5 h-3.5" /> Synced
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">Syncing...</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      State Vector Size:
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs">
                      {vectorStateSize} bytes
                    </span>
                  </div>
                </div>
              </div>

              {/* Conflict Resolution Explanation */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  CRDT Guarantee: Zero Last-Write-Wins Overwrites
                </div>
                <p className="text-xs text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed">
                  SyncSpace operates on the <strong>Yjs (YATA)</strong> algorithm. Every insertion and deletion generates an immutable state vector with unique client ID timestamps. When concurrent edits occur offline or across network partitions, changes merge deterministically without overwriting peer edits.
                </p>
              </div>
            </>
          )}

          {activeTab === 'convergence' && (
            <div className="space-y-4">
              <ConvergenceTest />
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 font-mono text-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-indigo-400">
                  <span className="font-bold flex items-center gap-1.5">
                    <GitMerge className="w-4 h-4" /> End-to-End State Sync Pipeline
                  </span>
                  <span className="text-[10px] text-slate-400">Port 1234</span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>1. User Types in Tiptap</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-indigo-300 font-bold">ProseMirror Tr</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>2. CRDT Binding</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-emerald-400 font-bold">Yjs Y.XmlFragment</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>3. Local Offline Cache</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-amber-400 font-bold">IndexedDB Store</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>4. Binary Protocol</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sky-400 font-bold">y-websocket (Binary)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>5. Remote Clients</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-purple-400 font-bold">State Vector Merge</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
