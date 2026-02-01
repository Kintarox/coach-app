"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface EditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    // DAS HIER IST DER FIX FÜR DEN FEHLER:
    immediatelyRender: false, 
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] prose prose-sm max-w-none text-gray-600 leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Falls sich der Value von außen ändert (beim Laden im Edit-Modus)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-100 rounded-3xl overflow-hidden bg-gray-50/50">
      {/* Toolbar */}
      <div className="flex gap-2 p-3 bg-white border-b border-gray-100">
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${editor.isActive('bold') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <i className="ph-bold ph-text-b"></i>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${editor.isActive('italic') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <i className="ph-bold ph-text-italic"></i>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${editor.isActive('underline') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <i className="ph-bold ph-text-underline"></i>
        </button>
        <div className="w-[1px] h-4 bg-gray-200 self-center mx-1"></div>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${editor.isActive('bulletList') ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <i className="ph-bold ph-list-bullets"></i>
        </button>
      </div>

      {/* Schreibbereich */}
      <div className="p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}