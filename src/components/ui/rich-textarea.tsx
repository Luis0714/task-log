"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { ImageIcon } from "lucide-react";
import { MdFormatListBulleted, MdFormatListNumbered, MdFormatUnderlined } from "react-icons/md";
import { FiLink } from "react-icons/fi";
import { ItalicIcon } from "@/components/icons/italic-icon";
import { rewriteAdoImgSrcsForDisplay, rewriteProxyImgSrcsForStorage } from "@/lib/html/rewrite-ado-image-urls";
import { appToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type RichTextareaProps = {
  value: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-40",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="bg-border mx-0.5 h-5 w-px" />;
}

export function RichTextarea({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
}: RichTextareaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const uploadImageRef = useRef<((file: File) => Promise<void>) | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: rewriteAdoImgSrcsForDisplay(value),
    editable: !disabled,
    onUpdate({ editor: e }) {
      onChangeRef.current?.(rewriteProxyImgSrcsForStorage(e.getHTML()));
    },
    editorProps: {
      handlePaste(_, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((i) => i.type.startsWith("image/"));
        if (!imageItem) return false;

        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return false;

        void uploadImageRef.current?.(file);
        return true;
      },
    },
  });

  const uploadImage = useCallback(
    async (file: File) => {
      setUploadProgress(0);
      setTimeout(() => setUploadProgress(80), 50);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ado/attachments", { method: "POST", body: formData });
      if (!res.ok) {
        setUploadProgress(null);
        appToast.error("No se pudo subir la imagen a Azure DevOps.");
        return;
      }

      const { url } = (await res.json()) as { url: string };
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 400);
      editor?.chain().focus().setImage({ src: url }).run();
    },
    [editor],
  );

  useEffect(() => {
    uploadImageRef.current = uploadImage;
  }, [uploadImage]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    const incoming = rewriteAdoImgSrcsForDisplay(value);
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const handleLinkToggle = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = globalThis.prompt("URL del enlace:");
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "border-input rounded-md border bg-transparent text-sm shadow-xs",
        "focus-within:ring-ring focus-within:ring-1",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none px-3 py-2",
          "min-h-[120px] focus:outline-none",
          "[&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4",
          "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4",
          "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline",
          "[&_.ProseMirror_h1]:text-base [&_.ProseMirror_h1]:font-semibold",
          "[&_.ProseMirror_h2]:text-sm [&_.ProseMirror_h2]:font-semibold",
          "[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded",
        )}
      />

      <div className="bg-muted h-0.5 w-full overflow-hidden">
        <div
          className="bg-primary h-full transition-[width] duration-700 ease-out"
          style={{ width: `${uploadProgress ?? 0}%` }}
        />
      </div>

      <div className="border-border flex flex-wrap items-center gap-0.5 border-t px-1.5 py-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          disabled={disabled}
          title="Negrita"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          disabled={disabled}
          title="Cursiva"
        >
          <ItalicIcon width={10} height={12} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          disabled={disabled}
          title="Subrayado"
        >
          <MdFormatUnderlined width={10} height={12} />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          disabled={disabled}
          title="Lista sin orden"
        >
          <MdFormatListBulleted />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          disabled={disabled}
          title="Lista numerada"
        >
          <MdFormatListNumbered />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={handleLinkToggle}
          active={editor.isActive("link")}
          disabled={disabled}
          title={editor.isActive("link") ? "Quitar enlace" : "Insertar enlace"}
        >
          <FiLink />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Insertar imagen"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadImage(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
