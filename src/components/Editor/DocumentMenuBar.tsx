'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  FilePlus,
  Download,
  FileText,
  Printer,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  CodeXml,
  CheckSquare,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RemoveFormatting,
  Info,
  ChevronRight,
  FileCode,
  FoldVertical,
} from 'lucide-react';
import { exportAsTxt, exportAsDocx, exportAsPdf } from '../../utils/exportDocument';

interface DocumentMenuBarProps {
  editor: Editor | null;
  title: string;
  onNewDocument?: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  wordCount: number;
  characterCount: number;
}

export const DocumentMenuBar: React.FC<DocumentMenuBarProps> = ({
  editor,
  title,
  onNewDocument,
  zoom,
  onZoomChange,
  wordCount,
  characterCount,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDownloadSubmenuOpen, setIsDownloadSubmenuOpen] = useState(false);
  const [showDocInfo, setShowDocInfo] = useState(false);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close open dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setIsDownloadSubmenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setIsDownloadSubmenuOpen(false);
        setShowDocInfo(false);
        setShowLinkPrompt(false);
        setShowImagePrompt(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMenu = (menuName: string) => {
    setIsDownloadSubmenuOpen(false);
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    if (urlInput.trim()) {
      let formattedUrl = urlInput.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkPrompt(false);
    setUrlInput('');
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    if (urlInput.trim()) {
      editor.chain().focus().setImage({ src: urlInput.trim() }).run();
    }
    setShowImagePrompt(false);
    setUrlInput('');
  };

  const handleTxtDownload = () => {
    if (!editor) return;
    exportAsTxt(title, editor);
    setActiveMenu(null);
    setIsDownloadSubmenuOpen(false);
  };

  const handleDocxDownload = async () => {
    if (!editor) return;
    await exportAsDocx(title, editor);
    setActiveMenu(null);
    setIsDownloadSubmenuOpen(false);
  };

  const handlePdfDownload = () => {
    exportAsPdf(title);
    setActiveMenu(null);
    setIsDownloadSubmenuOpen(false);
  };

  const menuButtonClass = (menuName: string) =>
    `px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
      activeMenu === menuName
        ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  const menuItemClass =
    'w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white flex items-center justify-between gap-3 transition-colors cursor-pointer';

  return (
    <div
      ref={menuBarRef}
      className="flex items-center gap-1 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs select-none relative z-20 transition-colors duration-200"
      role="menubar"
      aria-label="Document Menu Bar"
    >
      {/* FILE MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('file')}
          className={menuButtonClass('file')}
          aria-haspopup="true"
          aria-expanded={activeMenu === 'file'}
        >
          File
        </button>

        {activeMenu === 'file' && (
          <div className="absolute left-0 mt-1 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
            {/* New Document */}
            {onNewDocument && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  onNewDocument();
                }}
                className={menuItemClass}
              >
                <span className="flex items-center gap-2">
                  <FilePlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> New Document
                </span>
              </button>
            )}

            {/* Download Submenu */}
            <div
              className="relative"
              onMouseEnter={() => setIsDownloadSubmenuOpen(true)}
              onMouseLeave={() => setIsDownloadSubmenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsDownloadSubmenuOpen(!isDownloadSubmenuOpen)}
                className={menuItemClass}
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Download
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Submenu flyout */}
              {isDownloadSubmenuOpen && (
                <div className="absolute left-full top-0 -mt-1 ml-0.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                  <button
                    type="button"
                    onClick={handleDocxDownload}
                    className={menuItemClass}
                    title="Export styled Word Document"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Microsoft Word (.docx)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTxtDownload}
                    className={menuItemClass}
                    title="Export plain text document"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <FileCode className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Plain Text (.txt)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePdfDownload}
                    className={menuItemClass}
                    title="Print to PDF via browser print"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> PDF Document (.pdf)
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

            {/* Print */}
            <button
              type="button"
              onClick={handlePdfDownload}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Print
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+P</span>
            </button>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

            {/* Document Details */}
            <button
              type="button"
              onClick={() => {
                setShowDocInfo(true);
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400" /> Document Details
              </span>
            </button>
          </div>
        )}
      </div>

      {/* EDIT MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('edit')}
          className={menuButtonClass('edit')}
          aria-haspopup="true"
          aria-expanded={activeMenu === 'edit'}
        >
          Edit
        </button>

        {activeMenu === 'edit' && (
          <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
            <button
              type="button"
              disabled={!editor?.can().chain().focus().undo().run()}
              onClick={() => {
                editor?.chain().focus().undo().run();
                setActiveMenu(null);
              }}
              className={`${menuItemClass} disabled:opacity-40 disabled:hover:bg-transparent`}
            >
              <span className="flex items-center gap-2">
                <Undo2 className="w-3.5 h-3.5 text-slate-500" /> Undo
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+Z</span>
            </button>

            <button
              type="button"
              disabled={!editor?.can().chain().focus().redo().run()}
              onClick={() => {
                editor?.chain().focus().redo().run();
                setActiveMenu(null);
              }}
              className={`${menuItemClass} disabled:opacity-40 disabled:hover:bg-transparent`}
            >
              <span className="flex items-center gap-2">
                <Redo2 className="w-3.5 h-3.5 text-slate-500" /> Redo
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+Y</span>
            </button>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().selectAll().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span>Select All</span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+A</span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().unsetAllMarks().clearNodes().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <RemoveFormatting className="w-3.5 h-3.5 text-slate-500" /> Clear Formatting
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+\</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('view')}
          className={menuButtonClass('view')}
          aria-haspopup="true"
          aria-expanded={activeMenu === 'view'}
        >
          View
        </button>

        {activeMenu === 'view' && (
          <div className="absolute left-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
            <button
              type="button"
              disabled={zoom >= 150}
              onClick={() => {
                onZoomChange(Math.min(150, zoom + 10));
                setActiveMenu(null);
              }}
              className={`${menuItemClass} disabled:opacity-40`}
            >
              <span className="flex items-center gap-2">
                <ZoomIn className="w-3.5 h-3.5 text-slate-500" /> Zoom In (+10%)
              </span>
            </button>

            <button
              type="button"
              disabled={zoom <= 60}
              onClick={() => {
                onZoomChange(Math.max(60, zoom - 10));
                setActiveMenu(null);
              }}
              className={`${menuItemClass} disabled:opacity-40`}
            >
              <span className="flex items-center gap-2">
                <ZoomOut className="w-3.5 h-3.5 text-slate-500" /> Zoom Out (-10%)
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onZoomChange(100);
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Zoom (100%)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{zoom}%</span>
            </button>
          </div>
        )}
      </div>

      {/* INSERT MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('insert')}
          className={menuButtonClass('insert')}
          aria-haspopup="true"
          aria-expanded={activeMenu === 'insert'}
        >
          Insert
        </button>

        {activeMenu === 'insert' && (
          <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setUrlInput(editor?.getAttributes('link').href || '');
                setShowLinkPrompt(true);
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" /> Link
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+K</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUrlInput('');
                setShowImagePrompt(true);
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" /> Image URL
              </span>
            </button>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().toggleTaskList().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-slate-500" /> Task Checklist
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().toggleCodeBlock().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <CodeXml className="w-3.5 h-3.5 text-slate-500" /> Code Block
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().setHorizontalRule().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <Minus className="w-3.5 h-3.5 text-slate-500" /> Horizontal Line
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().setPageBreak().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <FoldVertical className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Page Break
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+Enter</span>
            </button>
          </div>
        )}
      </div>

      {/* FORMAT MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('format')}
          className={menuButtonClass('format')}
          aria-haspopup="true"
          aria-expanded={activeMenu === 'format'}
        >
          Format
        </button>

        {activeMenu === 'format' && (
          <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().toggleBold().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <Bold className="w-3.5 h-3.5 text-slate-500" /> Bold
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+B</span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().toggleItalic().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <Italic className="w-3.5 h-3.5 text-slate-500" /> Italic
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+I</span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().toggleUnderline().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <UnderlineIcon className="w-3.5 h-3.5 text-slate-500" /> Underline
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ctrl+U</span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().toggleStrike().run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <Strikethrough className="w-3.5 h-3.5 text-slate-500" /> Strikethrough
              </span>
            </button>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().setTextAlign('left').run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <AlignLeft className="w-3.5 h-3.5 text-slate-500" /> Align Left
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().setTextAlign('center').run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <AlignCenter className="w-3.5 h-3.5 text-slate-500" /> Align Center
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().setTextAlign('right').run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <AlignRight className="w-3.5 h-3.5 text-slate-500" /> Align Right
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().setTextAlign('justify').run();
                setActiveMenu(null);
              }}
              className={menuItemClass}
            >
              <span className="flex items-center gap-2">
                <AlignJustify className="w-3.5 h-3.5 text-slate-500" /> Justify
              </span>
            </button>
          </div>
        )}
      </div>

      {/* DOCUMENT DETAILS MODAL */}
      {showDocInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Document Statistics
              </h3>
              <button
                type="button"
                onClick={() => setShowDocInfo(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Document Title:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{title || 'Untitled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Words:</span>
                <span className="font-bold text-slate-900 dark:text-white">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Characters:</span>
                <span className="font-bold text-slate-900 dark:text-white">{characterCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Current Zoom:</span>
                <span className="font-bold text-slate-900 dark:text-white">{zoom}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">CRDT Engine:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Yjs CRDT (YATA)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDocInfo(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* INSERT LINK MODAL */}
      {showLinkPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkPrompt(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editor?.isActive('link') && (
                  <button
                    type="button"
                    onClick={() => {
                      editor?.chain().focus().unsetLink().run();
                      setShowLinkPrompt(false);
                      setUrlInput('');
                    }}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold mr-auto cursor-pointer"
                  >
                    Remove Link
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowLinkPrompt(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSERT IMAGE MODAL */}
      {showImagePrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Insert Public Image URL
              </h3>
              <button
                type="button"
                onClick={() => setShowImagePrompt(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter any public or HTTPS image URL to embed it into the document canvas.
            </p>

            <form onSubmit={handleImageSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Image Web URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  autoFocus
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImagePrompt(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
