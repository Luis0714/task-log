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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { extractImageFiles } from "@/lib/clipboard/extract-image-files";
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
  /** Nombre accesible (aria-label) y, por defecto, contenido del Tooltip. */
  title: string;
  /** Override del contenido del Tooltip (p. ej. atajos de teclado). Si se
   *  omite, se usa `title`. */
  tooltip?: React.ReactNode;
  children: React.ReactNode;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  tooltip,
  children,
}: Readonly<ToolbarButtonProps>) {
  // Se reutiliza la marca nativa que arma IconActionButton: el `<button>`
  // se pasa como `render` a `TooltipTrigger`, que internamente le inyecta el
  // ref/eventos y maneja el ARIA, dejándonos un único punto de estilo.
  const button = (
    <button
      type="button"
      onMouseDown={(event) => {
        // Evita que el editor pierda foco al hacer click en la toolbar.
        event.preventDefault();
        onClick();
      }}
      disabled={disabled}
      aria-label={title}
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

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="top">{tooltip ?? title}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarSeparator() {
  return <div className="bg-border mx-0.5 h-5 w-px" />;
}

/** Máximo de imágenes que se pueden subir en una sola tanda. */
const MAX_IMAGES_PER_UPLOAD = 5;

/** Sube un único archivo al endpoint de adjuntos de ADO. Devuelve la URL final
 *  o `null` si falla — no rompe el flujo de los demás archivos de la tanda. */
async function uploadOneImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ado/attachments", { method: "POST", body: formData });
  if (!res.ok) return null;

  const data = (await res.json()) as { url?: unknown };
  return typeof data.url === "string" ? data.url : null;
}

export function RichTextarea({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
}: Readonly<RichTextareaProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const uploadImagesRef = useRef<((files: File[]) => void) | undefined>(undefined);
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
      Image.configure({
        inline: false,
        resize: {
          enabled: true,
          directions: ["bottom-right", "bottom-left", "top-right", "top-left"],
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: rewriteAdoImgSrcsForDisplay(value),
    editable: !disabled,
    onUpdate({ editor: e }) {
      onChangeRef.current?.(rewriteProxyImgSrcsForStorage(e.getHTML()));
    },
    editorProps: {
      handlePaste(_, event) {
        const files = extractImageFiles(event.clipboardData);
        if (files.length === 0) return false;

        event.preventDefault();
        uploadImagesRef.current?.(files);
        return true;
      },
    },
  });

  /** Valida la tanda, sube todos en paralelo y, si todo OK, inserta cada
   *  imagen devuelta por la API en orden.
   *
   *  Regla dura: si el usuario intenta subir más de `MAX_IMAGES_PER_UPLOAD`
   *  archivos, NO se sube NADA — se le avisa con un warning y se aborta. */
  const uploadImages = useCallback(
    (rawFiles: File[]) => {
      if (rawFiles.length === 0) return;

      let existingImages = 0;
      if (editor && !editor.isDestroyed) {
        editor.state.doc.descendants((node) => {
          if (node.type.name === "image") existingImages++;
        });
      }

      const totalImages = existingImages + rawFiles.length;
      if (totalImages > MAX_IMAGES_PER_UPLOAD) {
        const remaining = MAX_IMAGES_PER_UPLOAD - existingImages;
        if (remaining <= 0) {
          appToast.warning(
            `Ya tienes el máximo de ${MAX_IMAGES_PER_UPLOAD} imágenes insertadas.`,
          );
        } else {
          appToast.warning(
            `Solo puedes añadir ${remaining} imagen(es) más (tienes ${existingImages} de ${MAX_IMAGES_PER_UPLOAD}).`,
          );
        }
        return;
      }

      setUploadProgress(0);
      // "Falsa" animación inicial para feedback inmediato; el 100% lo marcamos
      // cuando TODAS las promesas resuelven.
      const fakeProgressTimer = setTimeout(() => setUploadProgress(80), 50);

      void Promise.all(rawFiles.map(uploadOneImage))
        .then((urls) => {
          const validUrls = urls.filter((url): url is string => Boolean(url));
          if (validUrls.length === 0 && rawFiles.length > 0) {
            appToast.error("No se pudo subir ninguna imagen a Azure DevOps.");
            return;
          }
          if (validUrls.length < rawFiles.length) {
            appToast.error(
              `Solo ${validUrls.length} de ${rawFiles.length} imágenes se subieron correctamente.`,
            );
          }
          if (!editor || editor.isDestroyed) return;

          editor
            .chain()
            .focus()
            .insertContent(
              validUrls.map((src) => ({
                type: "image",
                attrs: {
                  src: `/api/ado/attachments/proxy?url=${encodeURIComponent(src)}`,
                },
              })),
            )
            .run();
        })
        .finally(() => {
          clearTimeout(fakeProgressTimer);
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 400);
        });
    },
    [editor],
  );

  useEffect(() => {
    uploadImagesRef.current = uploadImages;
  }, [uploadImages]);

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
          title={`Insertar imagen(es) (máx. ${MAX_IMAGES_PER_UPLOAD})`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            if (files.length > 0) uploadImages(files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
