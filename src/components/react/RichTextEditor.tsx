import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle as TipTapTextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

// ─── Toolbar Components ────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ToolbarButton({ onClick, active, disabled, title, children, className = '' }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded text-xs font-medium transition-all ${className} ${
        active
          ? 'bg-violet-100 text-violet-700'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('Enter URL:', editor.getAttributes('link').href || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:', 'https://');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      {/* Text style */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <span className="font-bold text-sm">B</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <span className="italic text-sm">I</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <span className="underline text-sm">U</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <span className="line-through text-sm">S</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <span className="font-mono text-sm">{'`code`'}</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
        <span className="text-sm">X<sub>2</sub></span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
        <span className="text-sm">X<sup>2</sup></span>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Highlights */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} active={editor.isActive('highlight')} title="Highlight">
        <span className="px-1 py-0.5 rounded bg-yellow-200 text-yellow-800 text-xs font-bold">H</span>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <span className="font-bold text-sm">H1</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <span className="font-bold text-sm">H2</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <span className="font-bold text-sm">H3</span>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Blocks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Insert */}
      <ToolbarButton onClick={insertTable} title="Insert table">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Insert image">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Insert link">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo/Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

// Table controls toolbar (shown when table is selected)
function TableControls({ editor }: { editor: Editor | null }) {
  if (!editor || !editor.isActive('table')) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border-b border-violet-100 text-xs">
      <span className="text-violet-600 font-medium">Table Tools:</span>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}
        className="px-2 py-1 rounded bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors"
      >+ Col</button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}
        className="px-2 py-1 rounded bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors"
      >+ Row</button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }}
        className="px-2 py-1 rounded bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors"
      >− Col</button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }}
        className="px-2 py-1 rounded bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors"
      >− Row</button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
        className="px-2 py-1 rounded bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >Delete Table</button>
    </div>
  );
}

// ─── Main Editor Component ───────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: { color: '#7C3AED', width: 2 },
      }),
      Underline,
      TipTapTextStyle,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlock.configure({ HTMLAttributes: { class: 'bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm' } }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <EditorToolbar editor={editor} />
      <TableControls editor={editor} />
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-5 py-4 min-h-[400px] focus-within:ring-2 focus-within:ring-violet-100"
        />
        <style>{`
          .ProseMirror {
            outline: none;
            min-height: 400px;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            float: left;
            height: 0;
          }
          .ProseMirror h1 { font-size: 1.5rem; font-weight: 800; margin: 1.5rem 0 0.5rem; color: #0f172a; line-height: 1.2; }
          .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.4rem; color: #1e293b; line-height: 1.3; }
          .ProseMirror h3 { font-size: 1.1rem; font-weight: 700; margin: 1rem 0 0.3rem; color: #334155; }
          .ProseMirror h4 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; color: #475569; }
          .ProseMirror p { margin-bottom: 0.6rem; line-height: 1.7; color: #374151; }
          .ProseMirror ul { list-style: disc; margin: 0.5rem 0 0.75rem 1.25rem; }
          .ProseMirror ol { list-style: decimal; margin: 0.5rem 0 0.75rem 1.25rem; }
          .ProseMirror li { margin-bottom: 0.25rem; padding-left: 0.25rem; }
          .ProseMirror blockquote {
            border-left: 3px solid #7C3AED;
            padding: 0.5rem 1rem;
            margin: 1rem 0;
            background: #f5f3ff;
            border-radius: 0 8px 8px 0;
            color: #5b21b6;
          }
          .ProseMirror blockquote p { margin-bottom: 0; }
          .ProseMirror a { color: #7C3AED; text-decoration: underline; }
          .ProseMirror code {
            background: #f1f5f9;
            padding: 0.15rem 0.35rem;
            border-radius: 3px;
            font-size: 0.85em;
            font-family: monospace;
            color: #7C3AED;
          }
          .ProseMirror pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            overflow-x: auto;
          }
          .ProseMirror pre code { background: none; padding: 0; color: inherit; font-size: 0.85rem; }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1rem 0;
            border: 1px solid #e2e8f0;
          }
          .ProseMirror hr {
            border: none;
            border-top: 2px solid #e2e8f0;
            margin: 1.5rem 0;
          }
          .ProseMirror table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
            font-size: 0.875rem;
          }
          .ProseMirror th {
            background: #f8fafc;
            font-weight: 700;
            padding: 0.5rem 0.75rem;
            border: 1px solid #e2e8f0;
            text-align: left;
            color: #334155;
          }
          .ProseMirror td {
            padding: 0.5rem 0.75rem;
            border: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .ProseMirror tr:nth-child(even) td { background: #f8fafc; }
          .ProseMirror mark {
            background: #fef08a;
            padding: 0.1rem 0.2rem;
            border-radius: 2px;
          }
          .ProseMirror .task-list-item { display: flex; align-items: flex-start; gap: 0.5rem; }
          .ProseMirror .task-list-item input { margin-top: 0.25rem; }
          .ProseMirror .task-list-item[data-checked="true"] > div > p { text-decoration: line-through; color: #9ca3af; }
        `}</style>
      </div>
    </div>
  );
}
