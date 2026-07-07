"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Escribe aquí el contenido...", minHeight = "200px" }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ inline: false }),
            Underline,
            Placeholder.configure({ placeholder }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-3 py-2',
            },
        },
    });

    const ToolButton = ({ onClick, pressed, children }: { onClick: () => void; pressed: boolean; children: React.ReactNode }) => (
        <Toggle
            size="sm"
            pressed={pressed}
            onPressedChange={onClick}
            className="h-8 w-8 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        >
            {children}
        </Toggle>
    );

    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt('URL de la imagen:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-background">
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 sticky top-0 z-10">
                <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} pressed={editor.isActive('bold')}>
                    <Bold className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} pressed={editor.isActive('italic')}>
                    <Italic className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} pressed={editor.isActive('underline')}>
                    <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolButton>

                <div className="w-px h-6 bg-border mx-1" />

                <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} pressed={editor.isActive('heading', { level: 1 })}>
                    <Heading1 className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} pressed={editor.isActive('heading', { level: 2 })}>
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} pressed={editor.isActive('heading', { level: 3 })}>
                    <Heading3 className="h-3.5 w-3.5" />
                </ToolButton>

                <div className="w-px h-6 bg-border mx-1" />

                <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} pressed={editor.isActive('bulletList')}>
                    <List className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} pressed={editor.isActive('orderedList')}>
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolButton>

                <div className="w-px h-6 bg-border mx-1" />

                <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} pressed={editor.isActive({ textAlign: 'left' })}>
                    <AlignLeft className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} pressed={editor.isActive({ textAlign: 'center' })}>
                    <AlignCenter className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} pressed={editor.isActive({ textAlign: 'right' })}>
                    <AlignRight className="h-3.5 w-3.5" />
                </ToolButton>
                <ToolButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} pressed={editor.isActive({ textAlign: 'justify' })}>
                    <AlignJustify className="h-3.5 w-3.5" />
                </ToolButton>

                <div className="w-px h-6 bg-border mx-1" />

                <ToolButton onClick={addImage} pressed={false}>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                    </svg>
                </ToolButton>

                <div className="ml-auto flex items-center gap-0.5">
                    <ToolButton onClick={() => editor.chain().focus().undo().run()} pressed={false}>
                        <Undo className="h-3.5 w-3.5" />
                    </ToolButton>
                    <ToolButton onClick={() => editor.chain().focus().redo().run()} pressed={false}>
                        <Redo className="h-3.5 w-3.5" />
                    </ToolButton>
                </div>
            </div>
            <EditorContent editor={editor} className={cn("p-0", `min-h-[${minHeight}]`)} />
        </div>
    );
}
