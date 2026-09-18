import { Extension, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import '@tiptap/extension-text-style';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
    pageBreak: {
      setPageBreak: () => ReturnType;
      deletePageBreak: () => ReturnType;
    };
  }
}

/**
 * Custom Tiptap Node Extension for Page Break.
 * Renders an atomic page separator in the collaborative editor.
 * Triggers standard CSS page breaks for printing and DOCX page breaks.
 * Fully synchronized through Yjs CRDT as an atomic document block.
 * Supports natural Backspace deletion to remove empty pages and join content.
 */
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML() {
    return [
      'div',
      {
        'data-type': 'page-break',
        class: 'syncspace-page-break',
      },
      ['div', { class: 'syncspace-page-break-line' }],
      ['span', { class: 'syncspace-page-break-badge' }, 'Page Break'],
      ['div', { class: 'syncspace-page-break-line' }],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent([
              { type: this.name },
              { type: 'paragraph' },
            ])
            .run();
        },
      deletePageBreak:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;
          let deleted = false;

          // Check if cursor is right after or before a pageBreak
          const nodeBefore = $from.nodeBefore;
          const nodeAfter = $from.nodeAfter;

          if (nodeBefore && nodeBefore.type.name === this.name) {
            tr.delete($from.pos - nodeBefore.nodeSize, $from.pos);
            deleted = true;
          } else if (nodeAfter && nodeAfter.type.name === this.name) {
            tr.delete($from.pos, $from.pos + nodeAfter.nodeSize);
            deleted = true;
          } else {
            // Find any pageBreak near the selection
            state.doc.nodesBetween(Math.max(0, $from.pos - 50), Math.min(state.doc.content.size, $from.pos + 50), (node, pos) => {
              if (!deleted && node.type.name === this.name) {
                tr.delete(pos, pos + node.nodeSize);
                deleted = true;
              }
            });
          }

          if (deleted && dispatch) {
            dispatch(tr);
            return true;
          }
          return deleted;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
      'Backspace': ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;
        const { $from, empty } = selection;
        if (!empty) return false;

        // Case 1: Cursor is directly after a pageBreak node
        const nodeBefore = $from.nodeBefore;
        if (nodeBefore && nodeBefore.type.name === this.name) {
          editor.commands.deleteRange({
            from: $from.pos - nodeBefore.nodeSize,
            to: $from.pos,
          });
          return true;
        }

        // Case 2: Cursor is at start of an empty paragraph immediately following a pageBreak
        if ($from.parent.content.size === 0 && $from.parentOffset === 0) {
          const prevPos = $from.before();
          if (prevPos > 0) {
            const resolvedPrev = state.doc.resolve(prevPos);
            const prevNode = resolvedPrev.nodeBefore;
            if (prevNode && prevNode.type.name === this.name) {
              // Delete both the pageBreak and the empty paragraph
              editor.chain()
                .deleteRange({
                  from: prevPos - prevNode.nodeSize,
                  to: $from.after(),
                })
                .focus()
                .run();
              return true;
            }
          }
        }

        // Case 3: Cursor is at start of a non-empty paragraph immediately following a pageBreak
        if ($from.parentOffset === 0) {
          const prevPos = $from.before();
          if (prevPos > 0) {
            const resolvedPrev = state.doc.resolve(prevPos);
            const prevNode = resolvedPrev.nodeBefore;
            if (prevNode && prevNode.type.name === this.name) {
              // Delete the pageBreak node before this paragraph so text flows to previous page
              editor.chain()
                .deleteRange({
                  from: prevPos - prevNode.nodeSize,
                  to: prevPos,
                })
                .focus()
                .run();
              return true;
            }
          }
        }

        return false;
      },
      'Delete': ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;
        const { $from, empty } = selection;
        if (!empty) return false;

        const nodeAfter = $from.nodeAfter;
        if (nodeAfter && nodeAfter.type.name === this.name) {
          editor.commands.deleteRange({
            from: $from.pos,
            to: $from.pos + nodeAfter.nodeSize,
          });
          return true;
        }
        return false;
      },
    };
  },
});

/**
 * ProseMirror plugin that prevents cursor placement in the visual gaps
 * between paginated A4 sheets. This operates at the ProseMirror engine level,
 * which is the ONLY correct layer to intercept cursor placement.
 *
 * DOM overlays and React event handlers cannot reliably prevent the browser's
 * contentEditable behavior from placing a caret — by the time they fire,
 * ProseMirror has already processed the mousedown. This plugin hooks into
 * ProseMirror's own handleDOMEvents pipeline, which runs BEFORE internal
 * selection processing.
 *
 * Page dimensions must match PaginatedCanvas.tsx layout constants.
 */
const paginationGapGuardKey = new PluginKey('paginationGapGuard');

const PG_PAGE_HEIGHT = 1056; // A4_PAGE_HEIGHT at 96 DPI
const PG_GAP = 28;           // PAGE_GAP between sheets
const PG_SLOT = PG_PAGE_HEIGHT + PG_GAP;

export const PaginationGapGuard = Extension.create({
  name: 'paginationGapGuard',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: paginationGapGuardKey,
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              const mouseEvent = event as MouseEvent;
              // Only intercept left-click (don't block right-click context menu)
              if (mouseEvent.button !== 0) return false;

              const editorEl = view.dom;
              // DOM traversal: .ProseMirror → wrapper div → position parent → zoom container
              const wrapper = editorEl.parentElement;
              if (!wrapper) return false;
              const positionParent = wrapper.parentElement;
              if (!positionParent) return false;
              const zoomContainer = positionParent.parentElement;

              // Read current zoom scale from CSS transform
              let scale = 1;
              if (zoomContainer) {
                const match = zoomContainer.style.transform?.match(/scale\(([^)]+)\)/);
                if (match) scale = parseFloat(match[1]) || 1;
              }

              // Compute Y in unscaled position-parent coordinates
              const rect = positionParent.getBoundingClientRect();
              const yInContainer = (mouseEvent.clientY - rect.top) / scale;

              // Gap detection: within each page slot (page + gap),
              // the gap occupies [PAGE_HEIGHT, PAGE_HEIGHT + GAP)
              if (yInContainer >= PG_PAGE_HEIGHT) {
                const slotOffset = yInContainer % PG_SLOT;
                if (slotOffset >= PG_PAGE_HEIGHT) {
                  // Click is in the gap — suppress cursor placement
                  mouseEvent.preventDefault();
                  return true; // Tells ProseMirror: handled, don't process further
                }
              }

              return false; // Not in gap — let ProseMirror handle normally
            },
          },
        },
      }),
    ];
  },
});

/**
 * Custom Tiptap Extension for Font Size.
 * Stores font size as a CSS style attribute in the TextStyle mark.
 * Fully synchronized through Yjs CRDT.
 */
export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

/**
 * Custom Tiptap Extension for Paragraph/Heading Indentation.
 * Stores indentation level as margin-left and data-indent attribute.
 * Fully synchronized through Yjs CRDT.
 */
export const Indent = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 5,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const level = parseInt(element.getAttribute('data-indent') || '0', 10);
              return level || 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) {
                return {};
              }
              return {
                'data-indent': attributes.indent,
                style: `margin-left: ${attributes.indent * 24}px;`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.indent || 0;
              if (current < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: current + 1,
                });
              }
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.indent || 0;
              if (current > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: current - 1,
                });
              }
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/**
 * Custom Tiptap Extension for Line Height / Line Spacing.
 * Stores line height in paragraph / heading inline styles.
 * Fully synchronized through Yjs CRDT.
 */
export const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                lineHeight,
              });
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
      unsetLineHeight:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                lineHeight: null,
              });
            }
          });
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});
