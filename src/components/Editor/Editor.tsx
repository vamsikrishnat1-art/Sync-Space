'use client';

import React, { useState, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Toolbar } from './Toolbar';
import { DocumentMenuBar } from './DocumentMenuBar';
import { PaginatedCanvas } from './PaginatedCanvas';
import { FontSize, Indent, LineHeight, PageBreak, PaginationGapGuard } from '../../extensions/editorExtensions';
import { UserPresence } from '../../types/collaboration';
import { Loader2, FileText, CheckCircle2, Layers } from 'lucide-react';

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  currentUser: UserPresence;
  title?: string;
  onNewDocument?: () => void;
  readOnly?: boolean;
}

interface EditorCoreProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  currentUser: UserPresence;
  title?: string;
  onNewDocument?: () => void;
  readOnly?: boolean;
}

const EditorCore: React.FC<EditorCoreProps> = ({
  ydoc,
  provider,
  currentUser,
  title = 'Untitled Document',
  onNewDocument,
  readOnly = false,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [pageInfo, setPageInfo] = useState<{ current: number; total: number }>({
    current: 1,
    total: 1,
  });

  const handlePageChange = useCallback((current: number, total: number) => {
    setPageInfo((prev) => {
      if (prev.current === current && prev.total === total) {
        return prev;
      }
      return { current, total };
    });
  }, []);

  const editor = useEditor(
    {
      editable: !readOnly,
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          // History is disabled because Collaboration extension manages CRDT undo/redo
          history: false,
        }),
        Underline,
        Highlight.configure({ multicolor: true }),
        Placeholder.configure({
          placeholder: 'Start writing or collaborating together in real-time...',
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        Indent,
        LineHeight,
        PageBreak,
        PaginationGapGuard,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-indigo-600 dark:text-indigo-400 underline cursor-pointer',
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Image.configure({
          inline: false,
          HTMLAttributes: {
            class: 'rounded-xl max-w-full my-4 border border-slate-200 dark:border-slate-700 shadow-sm',
          },
        }),
        Collaboration.configure({
          document: ydoc,
          field: 'default',
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: currentUser.name,
            color: currentUser.color,
          },
        }),
      ],
    },
    [ydoc, provider]
  );

  // Compute text statistics
  const characterCount = editor?.getText().length || 0;
  const wordCount = editor?.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
      {/* Top Professional Document Menu Bar (File, Edit, View, Insert, Format) */}
      <DocumentMenuBar
        editor={editor}
        title={title}
        onNewDocument={onNewDocument}
        zoom={zoom}
        onZoomChange={setZoom}
        wordCount={wordCount}
        characterCount={characterCount}
      />

      {/* Editor Formatting Toolbar */}
      <Toolbar
        editor={editor}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* Editor Paginated Canvas (Google Docs / MS Word A4 Stacked Paper sheets) */}
      <PaginatedCanvas
        editor={editor}
        title={title}
        zoom={zoom}
        onPageChange={handlePageChange}
      />

      {/* Document Meta / Stats Footer */}
      <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="flex items-center gap-3">
          {/* Page Counter Indicator */}
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              Page {pageInfo.current} of {pageInfo.total}
            </span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{wordCount} words</span>
          </span>
          <span>•</span>
          <span>{characterCount} characters</span>
          <span>•</span>
          <span className="text-slate-400 font-mono text-[11px]">Zoom: {zoom}%</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">CRDT Live Synced (Yjs)</span>
        </div>
      </div>
    </div>
  );
};

export const CollaborativeEditor: React.FC<EditorProps> = ({
  ydoc,
  provider,
  currentUser,
  title = 'Untitled Document',
  onNewDocument,
  readOnly = false,
}) => {
  if (!provider) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden items-center justify-center p-8 text-slate-400 text-sm transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium text-slate-600 dark:text-slate-300">Connecting to CRDT session...</span>
        </div>
      </div>
    );
  }

  return (
    <EditorCore
      key={`${provider.roomname}-${ydoc.guid}`}
      ydoc={ydoc}
      provider={provider}
      currentUser={currentUser}
      title={title}
      onNewDocument={onNewDocument}
      readOnly={readOnly}
    />
  );
};
