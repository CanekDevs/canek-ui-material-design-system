/*
 * Herramientas y presets de la barra del editor enriquecido. Viven aparte (sin
 * tiptap) para que el skeleton pueda usarlos sin cargar el editor.
 */

export type CnRichTextTool =
  | "undo"
  | "heading"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "highlight"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "horizontalRule"
  | "align"
  | "link"
  | "image"
  | "table"
  | "clear";

export const RICH_TEXT_TOOLBARS: Record<"basic" | "standard" | "full", CnRichTextTool[]> = {
  basic: ["bold", "italic", "underline", "bulletList", "orderedList", "link"],
  standard: [
    "undo",
    "heading",
    "bold",
    "italic",
    "underline",
    "strike",
    "highlight",
    "bulletList",
    "orderedList",
    "blockquote",
    "align",
    "link",
    "clear",
  ],
  full: [
    "undo",
    "heading",
    "bold",
    "italic",
    "underline",
    "strike",
    "code",
    "highlight",
    "bulletList",
    "orderedList",
    "blockquote",
    "horizontalRule",
    "align",
    "link",
    "image",
    "table",
    "clear",
  ],
};

export type CnRichTextToolbar = keyof typeof RICH_TEXT_TOOLBARS | CnRichTextTool[];
