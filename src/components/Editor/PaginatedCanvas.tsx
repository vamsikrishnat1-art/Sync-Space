'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { Selection } from '@tiptap/pm/state';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  FileText,
  Plus,
  Compass,
  Trash2,
} from 'lucide-react';

interface PaginatedCanvasProps {
  editor: Editor | null;
  title: string;
  zoom: number;
  onPageChange?: (currentPage: number, totalPages: number) => void;
}

// Standard A4 Paper Dimensions at 96 DPI
export const A4_PAGE_WIDTH = 816; // 8.5 inches = 816px
export const A4_PAGE_HEIGHT = 1056; // 11.0 inches = 1056px
export const PAGE_GAP = 28; // Gap between discrete pages in px
export const PAGE_SLOT = A4_PAGE_HEIGHT + PAGE_GAP; // 1084px

// Consistent Document Margins (Shared across sheets, header, footer, and editor surface)
export const PAGE_PADDING_LEFT = 64;   // 64px horizontal margin (matches header/footer px-16)
export const PAGE_PADDING_RIGHT = 64;  // 64px horizontal margin
export const PAGE_HEADER_HEIGHT = 48;  // Visual header region: 0px to 48px
export const PAGE_PADDING_TOP = 72;    // Editable writing area starts at 72px (clean 24px below header)
export const PAGE_FOOTER_HEIGHT = 48;  // Visual footer region: 1008px to 1056px
export const PAGE_PADDING_BOTTOM = 64; // Editable writing area stops at 992px (leaving 16px buffer above footer)
export const PAGE_CONTENT_HEIGHT = A4_PAGE_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM; // 1056 - 72 - 64 = 920px

export const PaginatedCanvas: React.FC<PaginatedCanvasProps> = ({
  editor,
  title,
  zoom,
  onPageChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [showPageNav, setShowPageNav] = useState<boolean>(false);

  // Refs to avoid feedback loops in effects
  const totalPagesRef = useRef<number>(1);
  const activePageRef = useRef<number>(1);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  });

  // Apply true paginated layout using DOM measurement and margins
  const applyPaginationLayout = useCallback(() => {
    if (!editorWrapperRef.current) return;
    const prosemirrorEl = editorWrapperRef.current.querySelector('.ProseMirror') as HTMLElement | null;
    if (!prosemirrorEl) return;

    const PAGE_HEIGHT = A4_PAGE_HEIGHT;
    const PAGE_TOTAL = PAGE_SLOT;
    const CONTENT_TOP = PAGE_PADDING_TOP;
    const CONTENT_BOTTOM = PAGE_PADDING_BOTTOM;

    const children = Array.from(prosemirrorEl.children) as HTMLElement[];
    if (children.length === 0) return;

    // 1. Reset all layout pushes to measure natural flow
    // (children[0] starts naturally at PAGE_PADDING_TOP = 72px due to .ProseMirror CSS padding)
    children.forEach((el) => {
      el.style.marginTop = '';
      el.style.marginBottom = '';
    });

    // 2. Multi-pass layout for page breaks and automatic overflow
    let hasChanges = true;
    let maxLoops = 50; // Safety against infinite loops
    
    while (hasChanges && maxLoops > 0) {
      hasChanges = false;
      maxLoops--;
      
      for (let i = 0; i < children.length; i++) {
        const el = children[i];
        const offsetTop = el.offsetTop;
        const height = el.offsetHeight;
        
        if (el.classList.contains('syncspace-page-break')) {
          const pageIndex = Math.floor(offsetTop / PAGE_TOTAL);
          const nextContentTop = (pageIndex + 1) * PAGE_TOTAL + CONTENT_TOP;
          const currentBottom = offsetTop + height;
          const pushAmount = nextContentTop - currentBottom;
          
          if (pushAmount > 5 && el.style.marginBottom !== `${pushAmount}px`) {
            el.style.marginBottom = `${pushAmount}px`;
            hasChanges = true;
            break; // Restart loop to measure updated offsetTops
          }
        } else if (i > 0) {
          const naturalBottom = offsetTop + height;
          const pageIndex = Math.floor(offsetTop / PAGE_TOTAL);
          const pageContentBottom = pageIndex * PAGE_TOTAL + PAGE_HEIGHT - CONTENT_BOTTOM;
          
          if (naturalBottom > pageContentBottom) {
            const nextContentTop = (pageIndex + 1) * PAGE_TOTAL + CONTENT_TOP;
            const pushAmount = nextContentTop - offsetTop;
            
            // Only push if it's not already near the top (allow huge blocks to overflow)
            if (offsetTop > pageIndex * PAGE_TOTAL + CONTENT_TOP + 5) {
              if (el.style.marginTop !== `${pushAmount}px`) {
                el.style.marginTop = `${pushAmount}px`;
                hasChanges = true;
                break; // Restart loop
              }
            }
          }
        }
      }
    }

    // 3. Finally, calculate total height to update page count
    let maxPageFromBreaks = 1;
    for (const el of children) {
      if (el.classList.contains('syncspace-page-break')) {
        const pageIdx = Math.floor(el.offsetTop / PAGE_TOTAL);
        maxPageFromBreaks = Math.max(maxPageFromBreaks, pageIdx + 2);
      }
    }

    const lastChild = children[children.length - 1];
    let totalHeight = 0;
    if (lastChild) {
      const mb = parseFloat(lastChild.style.marginBottom) || 0;
      totalHeight = lastChild.offsetTop + lastChild.offsetHeight + mb + CONTENT_BOTTOM;
    }
    
    const newTotalPages = Math.max(maxPageFromBreaks, Math.ceil(totalHeight / PAGE_TOTAL));
    if (newTotalPages !== totalPagesRef.current) {
      totalPagesRef.current = newTotalPages;
      setTotalPages(newTotalPages);
      onPageChangeRef.current?.(activePageRef.current, newTotalPages);
    }

    // Ensure .ProseMirror contentEditable surface covers all pages so
    // ProseMirror can handle clicks on any page (not just where content is).
    // The PaginationGapGuard plugin then blocks cursor placement in gap regions.
    const requiredHeight = newTotalPages * A4_PAGE_HEIGHT + Math.max(0, newTotalPages - 1) * PAGE_GAP;
    if (prosemirrorEl.style.minHeight !== `${requiredHeight}px`) {
      prosemirrorEl.style.minHeight = `${requiredHeight}px`;
    }
  }, []);

  // Reactive listeners for editor transactions, updates, and content element resize
  useEffect(() => {
    if (!editor) return;

    // Initial measurement
    applyPaginationLayout();

    const handleUpdate = () => {
      applyPaginationLayout();
    };

    editor.on('transaction', handleUpdate);
    editor.on('update', handleUpdate);

    // Observe ONLY the inner .ProseMirror element
    let resizeObserver: ResizeObserver | null = null;
    const prosemirrorEl = editorWrapperRef.current?.querySelector('.ProseMirror');
    if (prosemirrorEl) {
      resizeObserver = new ResizeObserver(() => {
        applyPaginationLayout();
      });
      resizeObserver.observe(prosemirrorEl);
    }

    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('update', handleUpdate);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [editor, applyPaginationLayout]);

  // Track active page based on scroll position (idempotent state update)
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollTop = scrollContainerRef.current.scrollTop;
    const effectivePageSlot = (A4_PAGE_HEIGHT + PAGE_GAP) * (zoom / 100);
    const currentPage = Math.min(
      totalPagesRef.current,
      Math.max(1, Math.floor((scrollTop + 150) / effectivePageSlot) + 1)
    );
    if (currentPage !== activePageRef.current) {
      activePageRef.current = currentPage;
      setActivePage(currentPage);
      onPageChangeRef.current?.(currentPage, totalPagesRef.current);
    }
  };

  // Smooth jump to target page
  const scrollToPage = (pageNumber: number) => {
    if (!scrollContainerRef.current) return;
    const effectivePageSlot = (A4_PAGE_HEIGHT + PAGE_GAP) * (zoom / 100);
    const targetScrollTop = (pageNumber - 1) * effectivePageSlot;
    scrollContainerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
    if (pageNumber !== activePageRef.current) {
      activePageRef.current = pageNumber;
      setActivePage(pageNumber);
      onPageChangeRef.current?.(pageNumber, totalPagesRef.current);
    }
  };


  // Quick insert manual page break
  const handleInsertPageBreak = () => {
    if (!editor) return;
    editor.chain().focus().setPageBreak().run();
  };

  // Safe delete empty page / page break — uses backward top-level child iteration
  // to avoid ALL stale-position bugs. Positions are computed directly from
  // doc.child(i).nodeSize arithmetic, which is always valid for the current state.
  const handleDeletePage = (e: React.MouseEvent, pageNum: number) => {
    e.stopPropagation();
    if (!editor || !editor.view) return;
    if (totalPagesRef.current <= 1) return; // Never delete the only page

    const { state, view } = editor;
    const { doc } = state;
    const docSize = doc.content.size;
    if (docSize === 0) return;

    // Walk backward through top-level document children to find
    // trailing deletable content (page breaks and empty blocks).
    let deleteFrom: number | null = null;
    const deleteTo = docSize;
    let pos = docSize;

    for (let i = doc.childCount - 1; i >= 0; i--) {
      const child = doc.child(i);
      pos -= child.nodeSize;

      if (child.type.name === 'pageBreak') {
        // Found a manual page break — delete from here to end
        deleteFrom = pos;
        break;
      } else if (child.isBlock && child.content.size === 0) {
        // Trailing empty block — mark for deletion and keep searching
        deleteFrom = pos;
      } else {
        // Reached a block with real content — stop to protect user data
        break;
      }
    }

    if (deleteFrom !== null && deleteFrom < deleteTo) {
      const tr = state.tr;
      tr.delete(deleteFrom, deleteTo);

      // Place cursor at a safe position in the modified document
      const newSize = tr.doc.content.size;
      const cursorPos = Math.min(deleteFrom, newSize);
      try {
        tr.setSelection(Selection.near(tr.doc.resolve(Math.max(0, cursorPos)), -1));
      } catch {
        // Ultimate fallback — start of document
        try {
          tr.setSelection(Selection.near(tr.doc.resolve(0), 1));
        } catch { /* document is empty — Tiptap will handle */ }
      }

      view.dispatch(tr);
    }

    applyPaginationLayout();
  };

  return (
    <div className="relative flex-1 flex overflow-hidden bg-slate-100/80 dark:bg-[#070a12] transition-colors duration-200">
      {/* FLOATING QUICK PAGE NAVIGATOR TOGGLE */}
      <div className="absolute top-4 left-4 z-30 no-print flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowPageNav((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border transition-all cursor-pointer backdrop-blur-md ${
            showPageNav
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Toggle Page Navigator"
          aria-label="Toggle Page Navigator"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>
            Pages ({activePage}/{totalPages})
          </span>
        </button>

        {/* COLLAPSIBLE PAGE NAVIGATOR PANEL */}
        {showPageNav && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 w-52 space-y-2 animate-fadeIn z-30">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                Document Map
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
              </span>
            </div>

            {/* Page List Pills */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all group ${
                    activePage === pageNum
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => scrollToPage(pageNum)}
                    className="flex-1 text-left flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 opacity-70" />
                    Page {pageNum}
                  </button>

                  {/* Delete empty page action when multi-page */}
                  {totalPages > 1 && pageNum === totalPages && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePage(e, pageNum)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity cursor-pointer"
                      title="Delete this page / page break"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {activePage === pageNum && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={handleInsertPageBreak}
                className="w-full py-1.5 px-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Insert a page break at current cursor"
              >
                <Plus className="w-3 h-3" />
                Add Page Break
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK PREV / NEXT PAGE FLOATING ARROWS (BOTTOM RIGHT) */}
      <div className="absolute bottom-4 right-4 z-30 no-print flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-lg">
        <button
          type="button"
          disabled={activePage <= 1}
          onClick={() => scrollToPage(Math.max(1, activePage - 1))}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-bold px-2 text-slate-700 dark:text-slate-200 font-mono">
          {activePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={activePage >= totalPages}
          onClick={() => scrollToPage(Math.min(totalPages, activePage + 1))}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* MAIN SCROLLABLE VIEWPORT */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 md:p-12 flex justify-center items-start cursor-default selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100"
      >
        {/* ZOOM SCALED CONTAINER */}
        <div
          ref={editorWrapperRef}
          className="relative transition-transform duration-150 origin-top flex flex-col items-center"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: `${A4_PAGE_WIDTH}px`,
          }}
        >
          {/* Print Title Header */}
          <h1 className="print-only-title">{title || 'Untitled Document'}</h1>

          {/* PAGE SHEET STACK BACKDROPS */}
          <div className="relative w-full">
            {/* Real discrete A4 Paper sheets with realistic gaps, borders, shadows & page numbers */}
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNum = i + 1;
              return (
                <div
                  key={pageNum}
                  id={`page-sheet-${pageNum}`}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-sm shadow-md flex flex-col justify-between transition-colors duration-200 relative mb-7 last:mb-0 pointer-events-none"
                  style={{
                    height: `${A4_PAGE_HEIGHT}px`,
                    width: `${A4_PAGE_WIDTH}px`,
                  }}
                >
                  {/* Subtle Page Header (Visual SaaS feel) */}
                  <div
                    className="px-16 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none no-print pointer-events-none"
                    style={{ height: `${PAGE_HEADER_HEIGHT}px` }}
                  >
                    <span className="truncate max-w-[300px] text-slate-400 dark:text-slate-500">
                      {title || 'Untitled Document'}
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-slate-300 dark:text-slate-600 uppercase">
                      SyncSpace A4
                    </span>
                  </div>

                  {/* Middle reading content area */}
                  <div className="flex-1 pointer-events-none" />

                  {/* Page Footer with Page Number */}
                  <div
                    className="px-16 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100/60 dark:border-slate-800/60 select-none no-print pointer-events-none"
                    style={{ height: `${PAGE_FOOTER_HEIGHT}px` }}
                  >
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      SyncSpace Collaborative
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono text-xs bg-slate-50 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                      Page {pageNum} of {totalPages}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* VISUAL PAGE GAP MARKERS — purely visual, no event handling.
                The PaginationGapGuard ProseMirror plugin handles cursor blocking
                at the engine level (the only correct architectural layer). */}
            {Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => {
              const topOffset = (i + 1) * A4_PAGE_HEIGHT + i * PAGE_GAP;
              return (
                <div
                  key={`page-gap-visual-${i}`}
                  className="absolute left-0 w-full z-20 select-none cursor-default bg-slate-100/90 dark:bg-[#070a12] border-y border-slate-200/60 dark:border-slate-800/60 pointer-events-none"
                  style={{
                    top: `${topOffset}px`,
                    height: `${PAGE_GAP}px`,
                    width: `${A4_PAGE_WIDTH}px`,
                  }}
                />
              );
            })}

            {/* ProseMirror Content Overlay (Single unified CRDT Tiptap document spanning across sheets) */}
            <div
              onMouseDown={(e) => {
                // If user clicks in empty area outside .ProseMirror, focus editor cleanly
                if (e.target === e.currentTarget && editor) {
                  e.preventDefault();
                  editor.commands.focus();
                }
              }}
              className="absolute top-0 left-0 pointer-events-auto cursor-text"
              style={{
                width: `${A4_PAGE_WIDTH}px`,
                minHeight: `${A4_PAGE_HEIGHT * totalPages + Math.max(0, totalPages - 1) * PAGE_GAP}px`,
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
