'use client';

import React, { Suspense } from 'react';
import Home from '../page';

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
          Loading SyncSpace Editor...
        </div>
      }
    >
      <Home />
    </Suspense>
  );
}
