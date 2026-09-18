'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Baseline,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  CodeXml,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  RemoveFormatting,
  ChevronDown,
  Check,
  FoldVertical,
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [
  { label: '10 pt', value: '10pt' },
  { label: '11 pt', value: '11pt' },
  { label: '12 pt', value: '12pt' },
  { label: '14 pt', value: '14pt' },
  { label: '16 pt', value: '16pt' },
  { label: '18 pt', value: '18pt' },
  { label: '20 pt', value: '20pt' },
  { label: '24 pt', value: '24pt' },
  { label: '28 pt', value: '28pt' },
  { label: '32 pt', value: '32pt' },
];

const TEXT_COLORS = [
  { name: 'Default Dark', color: '#0f172a' },
  { name: 'Slate Gray', color: '#64748b' },
  { name: 'Sync Indigo', color: '#4f46e5' },
  { name: 'Sky Blue', color: '#0284c7' },
  { name: 'Emerald Green', color: '#059669' },
  { name: 'Amber Orange', color: '#d97706' },
  { name: 'Crimson Red', color: '#dc2626' },
  { name: 'Purple', color: '#7c3aed' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', color: '' },
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bae6fd' },
  { name: 'Purple', color: '#e9d5ff' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Orange', color: '#fed7aa' },
];

const LINE_SPACINGS = [
  { label: 'Single (1.0)', value: '1.0' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: 'Double (2.0)', value: '2.0' },
];

const ZOOM_LEVELS = [80, 90, 100, 110, 120, 130];

export const Toolbar: React.FC<ToolbarProps> = ({ editor, zoom, onZoomChange }) => {
  // Dropdown / Popover states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [, setTick] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Reactive listener so toolbar immediately updates active state on selection/cursor changes
  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      setTick((t) => t + 1);
    };
    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setShowLinkModal(false);
        setShowImageModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!editor) return null;

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded-lg transition-all duration-150 flex items-center justify-center text-xs font-semibold cursor-pointer ${
      isActive
        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-300 dark:ring-indigo-700'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
    }`;

  const divider = <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 self-center flex-shrink-0" />;

  // Detect current active styles for dropdown labels
  const getCurrentStyleLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Normal text';
  };

  const getCurrentFontLabel = () => {
    const rawFont = editor.getAttributes('textStyle').fontFamily;
    if (!rawFont) return 'Inter';
    const found = FONT_FAMILIES.find(
      (f) => f.value.toLowerCase() === rawFont.toLowerCase() || rawFont.toLowerCase().includes(f.label.toLowerCase())
    );
    return found ? found.label : 'Font';
  };

  const getCurrentFontSizeLabel = () => {
    const rawSize = editor.getAttributes('textStyle').fontSize;
    if (!rawSize) return '11 pt';
    const found = FONT_SIZES.find((s) => s.value === rawSize);
    return found ? found.label : rawSize;
  };

  const handleSetFontFamily = (fontValue: string) => {
    const currentAttrs = editor.getAttributes('textStyle') || {};
    editor.chain().focus().setMark('textStyle', { ...currentAttrs, fontFamily: fontValue }).run();
    setOpenDropdown(null);
  };

  const handleSetFontSize = (sizeValue: string) => {
    const currentAttrs = editor.getAttributes('textStyle') || {};
    editor.chain().focus().setMark('textStyle', { ...currentAttrs, fontSize: sizeValue }).run();
    setOpenDropdown(null);
  };

  const handleSetColor = (colorValue: string) => {
    const currentAttrs = editor.getAttributes('textStyle') || {};
    editor.chain().focus().setMark('textStyle', { ...currentAttrs, color: colorValue }).run();
    setOpenDropdown(null);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
      let formattedUrl = linkInput.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkModal(false);
    setLinkInput('');
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageInput.trim()) {
      editor.chain().focus().setImage({ src: imageInput.trim() }).run();
    }
    setShowImageModal(false);
    setImageInput('');
  };

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Document editing toolbar"
      className="flex flex-wrap items-center gap-1 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 select-none shadow-xs transition-colors duration-200"
    >
      {/* GROUP 1: Undo / Redo */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {divider}

      {/* GROUP 2: Zoom Control */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('zoom')}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 cursor-pointer"
          title="Canvas Zoom"
          aria-label="Zoom Level"
        >
          <span>{zoom}%</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {openDropdown === 'zoom' && (
          <div className="absolute left-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
            {ZOOM_LEVELS.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => {
                  onZoomChange(z);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer ${
                  zoom === z ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{z}%</span>
                {zoom === z && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {divider}

      {/* GROUP 3: Text Style / Heading Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('textStyle')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 min-w-[105px] justify-between cursor-pointer"
          title="Paragraph / Heading Style"
          aria-label="Text Style"
        >
          <span className="truncate">{getCurrentStyleLabel()}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
        </button>

        {openDropdown === 'textStyle' && (
          <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                setOpenDropdown(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer"
            >
              Normal text
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                setOpenDropdown(null);
              }}
              className="w-full text-left px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer"
            >
              Heading 1
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                setOpenDropdown(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer"
            >
              Heading 2
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                setOpenDropdown(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer"
            >
              Heading 3
            </button>
          </div>
        )}
      </div>

      {/* GROUP 4: Font Family & Font Size */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('fontFamily')}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 min-w-[95px] justify-between cursor-pointer"
          title="Font Family"
          aria-label="Font Family"
        >
          <span className="truncate max-w-[70px]">{getCurrentFontLabel()}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
        </button>

        {openDropdown === 'fontFamily' && (
          <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
            {FONT_FAMILIES.map((f) => {
              const currentFont = editor.getAttributes('textStyle').fontFamily || '';
              const isActive =
                currentFont.toLowerCase() === f.value.toLowerCase() ||
                currentFont.toLowerCase().includes(f.label.toLowerCase()) ||
                (!currentFont && f.label === 'Inter');
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => handleSetFontFamily(f.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer ${
                    isActive
                      ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-slate-800'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                  style={{ fontFamily: f.value }}
                >
                  <span>{f.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('fontSize')}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 min-w-[65px] justify-between cursor-pointer"
          title="Font Size"
          aria-label="Font Size"
        >
          <span>{getCurrentFontSizeLabel()}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {openDropdown === 'fontSize' && (
          <div className="absolute left-0 mt-1 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
            {FONT_SIZES.map((s) => {
              const currentSize = editor.getAttributes('textStyle').fontSize || '';
              const isActive = currentSize === s.value || (!currentSize && s.value === '11pt');
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSetFontSize(s.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer ${
                    isActive
                      ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-slate-800'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{s.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {divider}

      {/* GROUP 5: Bold / Italic / Underline / Strike */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
          aria-label="Toggle Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
          aria-label="Toggle Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
          aria-label="Toggle Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
          aria-label="Toggle Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GROUP 6: Text Color & Highlight */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 relative">
        {/* Text Color */}
        <button
          type="button"
          onClick={() => toggleDropdown('textColor')}
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-0.5 cursor-pointer"
          title="Text Color"
          aria-label="Text Color"
        >
          <Baseline className="w-3.5 h-3.5" />
          <div
            className="w-2 h-0.5 rounded-full"
            style={{ backgroundColor: editor.getAttributes('textStyle').color || '#0f172a' }}
          />
        </button>

        {openDropdown === 'textColor' && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1.5 w-40 animate-fadeIn">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSetColor(c.color)}
                className={`w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                  editor.getAttributes('textStyle').color === c.color ? 'ring-2 ring-indigo-600 scale-105' : ''
                }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
              >
                {editor.getAttributes('textStyle').color === c.color && (
                  <Check className="w-3 h-3 text-white drop-shadow-xs" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Text Highlight */}
        <button
          type="button"
          onClick={() => toggleDropdown('highlightColor')}
          className={btnClass(editor.isActive('highlight'))}
          title="Highlight Color"
          aria-label="Highlight Color"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>

        {openDropdown === 'highlightColor' && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1.5 w-44 animate-fadeIn">
            {HIGHLIGHT_COLORS.map((h) => (
              <button
                key={h.name}
                type="button"
                onClick={() => {
                  if (h.color) {
                    editor.chain().focus().setHighlight({ color: h.color }).run();
                  } else {
                    editor.chain().focus().unsetHighlight().run();
                  }
                  setOpenDropdown(null);
                }}
                className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: h.color || 'transparent' }}
                title={h.name}
              >
                {!h.color && '✕'}
              </button>
            ))}
          </div>
        )}
      </div>

      {divider}

      {/* GROUP 7: Text Alignment */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={btnClass(editor.isActive({ textAlign: 'left' }))}
          title="Align Left"
          aria-label="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={btnClass(editor.isActive({ textAlign: 'center' }))}
          title="Align Center"
          aria-label="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={btnClass(editor.isActive({ textAlign: 'right' }))}
          title="Align Right"
          aria-label="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={btnClass(editor.isActive({ textAlign: 'justify' }))}
          title="Justify"
          aria-label="Justify"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GROUP 8: Line Spacing */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('lineHeight')}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 cursor-pointer"
          title="Line Spacing"
          aria-label="Line Spacing"
        >
          <span className="hidden sm:inline">Spacing</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {openDropdown === 'lineHeight' && (
          <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
            {LINE_SPACINGS.map((ls) => (
              <button
                key={ls.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().setLineHeight(ls.value).run();
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-900 dark:hover:text-white cursor-pointer"
              >
                {ls.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {divider}

      {/* GROUP 9: Lists & Tasks */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={btnClass(editor.isActive('taskList'))}
          title="Checklist / Task List"
          aria-label="Toggle Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
          aria-label="Toggle Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
          aria-label="Toggle Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GROUP 10: Indentation */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().outdent().run()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Decrease Indent"
          aria-label="Decrease Indent"
        >
          <OutdentIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().indent().run()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Increase Indent"
          aria-label="Increase Indent"
        >
          <IndentIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {divider}

      {/* GROUP 11: Insertion (Link & Image) */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            setLinkInput(editor.getAttributes('link').href || '');
            setShowLinkModal(true);
          }}
          className={btnClass(editor.isActive('link'))}
          title="Insert Link (Ctrl+K)"
          aria-label="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setImageInput('');
            setShowImageModal(true);
          }}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Insert Image URL"
          aria-label="Insert Image"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GROUP 12: Blocks (Quote / Code / Code block / Horizontal rule) */}
      <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
          aria-label="Toggle Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code"
          aria-label="Toggle Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(editor.isActive('codeBlock'))}
          title="Code Block"
          aria-label="Toggle Code Block"
        >
          <CodeXml className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Horizontal Rule"
          aria-label="Insert Horizontal Rule"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setPageBreak().run()}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Insert Page Break (Ctrl+Enter)"
          aria-label="Insert Page Break"
        >
          <FoldVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {divider}

      {/* GROUP 13: Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        title="Clear Formatting"
        aria-label="Clear Formatting"
      >
        <RemoveFormatting className="w-3.5 h-3.5" />
      </button>

      {/* LINK INSERTION MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Insert Link
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  URL Destination
                </label>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editor.isActive('link') && (
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setShowLinkModal(false);
                      setLinkInput('');
                    }}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold mr-auto cursor-pointer"
                  >
                    Unlink
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/20 cursor-pointer"
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE INSERTION MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Insert Image URL
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Embed any public HTTPS image directly into the document.
            </p>

            <form onSubmit={handleImageSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Image Web URL
                </label>
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1517842645767-c639042777db"
                  autoFocus
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!imageInput.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/20 cursor-pointer"
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
