import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import HighlightIcon from "@mui/icons-material/Highlight";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import RedoIcon from "@mui/icons-material/Redo";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import CodeIcon from "@mui/icons-material/Code";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode, Ref } from "react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useFieldControl } from "../../utils/field-control";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import { CnButton } from "../CnButton";
import { getSafeUrl } from "../CnFileField/file-utils";
import { CnTextField } from "../CnTextField";

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

export type CnRichTextFieldProps = CnFieldBaseProps<string> & {
  placeholder?: string;
  /** Herramientas visibles: un preset o una lista propia. */
  toolbar?: keyof typeof RICH_TEXT_TOOLBARS | CnRichTextTool[];
  minHeight?: number | string;
  maxHeight?: number | string;
  /** Límite de caracteres (se bloquea la escritura al alcanzarlo). */
  maxLength?: number;
  /** Muestra el contador de caracteres y palabras. */
  showCount?: boolean;
  /**
   * Sube una imagen y devuelve su URL pública. Si no se define, las imágenes
   * se incrustan como data URL (limitadas por `maxImageSize`).
   */
  onUploadImage?: (file: File) => Promise<string>;
  /** Tamaño máximo de imagen incrustada, en MB. */
  maxImageSize?: number;
  autoFocus?: boolean;
};

const SAFE_LINK = /^(https?:\/\/|mailto:|tel:)/i;

/** Normaliza el enlace: agrega https:// y rechaza protocolos peligrosos. */
export const normalizeLink = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;
  if (SAFE_LINK.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  if (value.includes("@") && !value.includes("/")) return `mailto:${value}`;
  return `https://${value}`;
};

const ToolButton = ({
  label,
  icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: (anchor: HTMLElement) => void;
}) => (
  <Tooltip title={label} disableInteractive>
    <span>
      <IconButton
        size="small"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => onClick(event.currentTarget)}
        sx={{
          width: 30,
          height: 30,
          borderRadius: "var(--cn-radius-sm, 6px)",
          color: active
            ? "var(--cn-color-brand-700, #1c3d6d)"
            : "var(--cn-color-neutral-600, #4e5660)",
          backgroundColor: active ? "var(--cn-color-brand-50, #eef3fb)" : "transparent",
          "&:hover": {
            backgroundColor: active
              ? "var(--cn-color-brand-100, #d4e0f4)"
              : "var(--cn-color-neutral-100, #f4f5f7)",
          },
          "& svg": { fontSize: 18 },
        }}
      >
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

const Separator = () => <Divider orientation="vertical" flexItem sx={{ mx: "4px", my: "4px" }} />;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const contentSx = (minHeight: number | string, maxHeight?: number | string): SxProps<Theme> => ({
  "& .ProseMirror": {
    minHeight,
    maxHeight,
    overflowY: maxHeight ? ("auto" as const) : ("visible" as const),
    padding: "12px 14px",
    outline: "none",
    fontSize: "var(--cn-font-size-md, 14px)",
    lineHeight: 1.6,
    color: "var(--cn-color-text, #222831)",
    "& > *:first-of-type": { marginTop: 0 },
    "& p": { margin: "0 0 8px" },
    "& h1": { fontSize: "1.6em", margin: "16px 0 8px", lineHeight: 1.25 },
    "& h2": { fontSize: "1.35em", margin: "14px 0 8px", lineHeight: 1.3 },
    "& h3": { fontSize: "1.15em", margin: "12px 0 6px", lineHeight: 1.35 },
    "& ul, & ol": { paddingLeft: "22px", margin: "0 0 8px" },
    "& blockquote": {
      margin: "8px 0",
      paddingLeft: "12px",
      borderLeft: "3px solid var(--cn-color-brand-300, #7c9fdc)",
      color: "var(--cn-color-text-muted, #6e7682)",
    },
    "& code": {
      fontFamily: "var(--cn-font-mono, ui-monospace, monospace)",
      fontSize: "0.9em",
      padding: "1px 4px",
      borderRadius: "var(--cn-radius-xs, 4px)",
      backgroundColor: "var(--cn-color-neutral-100, #f4f5f7)",
    },
    "& pre": {
      padding: "10px 12px",
      borderRadius: "var(--cn-radius-md, 8px)",
      backgroundColor: "var(--cn-color-neutral-900, #111418)",
      color: "#f4f5f7",
      "& code": { backgroundColor: "transparent", color: "inherit", padding: 0 },
    },
    "& mark": { backgroundColor: "#fff3a3", borderRadius: 2, padding: "0 2px" },
    "& a": { color: "var(--cn-color-brand-600, #254d87)", textDecoration: "underline" },
    "& hr": { border: 0, borderTop: "1px solid var(--cn-color-border, #dde0e4)", margin: "12px 0" },
    "& img": { maxWidth: "100%", height: "auto", borderRadius: "var(--cn-radius-md, 8px)" },
    "& img.ProseMirror-selectednode": { outline: "2px solid var(--cn-color-brand-500, #3562a6)" },
    "& table": {
      borderCollapse: "collapse" as const,
      width: "100%",
      margin: "8px 0",
      tableLayout: "fixed" as const,
    },
    "& th, & td": {
      border: "1px solid var(--cn-color-border, #dde0e4)",
      padding: "6px 8px",
      verticalAlign: "top",
      position: "relative" as const,
    },
    "& th": {
      backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
      fontWeight: 600,
      textAlign: "left" as const,
    },
    "& .selectedCell": { backgroundColor: "var(--cn-color-brand-50, #eef3fb)" },
    "& p.is-editor-empty:first-of-type::before": {
      content: "attr(data-placeholder)",
      color: "var(--cn-color-text-subtle, #9aa1aa)",
      float: "left" as const,
      height: 0,
      pointerEvents: "none" as const,
    },
  },
});

/**
 * Editor de texto enriquecido (tiptap) con barra configurable, enlaces
 * seguros, imágenes (subida propia o incrustadas), tablas, contador y
 * validación integrada. El valor es HTML; un editor vacío emite `""`.
 */
export const CnRichTextField = forwardRef<HTMLDivElement, CnRichTextFieldProps>(
  function CnRichTextField(
    {
      id,
      name,
      label,
      helperText,
      error,
      required,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      onBlur,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs,
      internalValidation,
      reserveHelperSpace,
      sx,
      className,
      placeholder = "Escribe aquí…",
      toolbar = "standard",
      minHeight = 180,
      maxHeight,
      maxLength,
      showCount = false,
      onUploadImage,
      maxImageSize = 1,
      autoFocus = false,
    },
    ref,
  ) {
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
    const html = (isControlled ? value : uncontrolled) ?? "";
    const lastEmittedRef = useRef(html);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [imageOpen, setImageOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [toolError, setToolError] = useState<string | null>(null);
    const [tableAnchor, setTableAnchor] = useState<HTMLElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [focused, setFocused] = useState(false);
    const blocked = Boolean(disabled || readOnly);
    const tools = useMemo(
      () => new Set(Array.isArray(toolbar) ? toolbar : RICH_TEXT_TOOLBARS[toolbar]),
      [toolbar],
    );

    const control = useFieldControl(html, {
      id,
      rules,
      formValues,
      sectionContext,
      validateOnChange,
      validateOnBlur,
      debounceMs,
      internalValidation,
      error,
      helperText,
      reserveHelperSpace,
    });
    const controlRef = useRef(control);
    controlRef.current = control;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const editor = useEditor(
      {
        extensions: [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
            link: {
              openOnClick: false,
              autolink: true,
              defaultProtocol: "https",
              protocols: ["http", "https", "mailto", "tel"],
              // Bloquea javascript:, data:, vbscript:, etc. también al pegar.
              isAllowedUri: (url) => SAFE_LINK.test(url),
              HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
            },
          }),
          Placeholder.configure({ placeholder }),
          CharacterCount.configure({ limit: maxLength }),
          TextAlign.configure({ types: ["heading", "paragraph"] }),
          Highlight,
          Image.configure({ allowBase64: true }),
          TableKit.configure({ table: { resizable: false } }),
        ],
        content: html,
        editable: !blocked,
        autofocus: autoFocus,
        shouldRerenderOnTransaction: true,
        editorProps: {
          attributes: {
            id: `${control.id}-editor`,
            role: "textbox",
            "aria-multiline": "true",
            ...(label ? { "aria-labelledby": `${control.id}-label` } : {}),
          },
        },
        onUpdate: ({ editor: instance }) => {
          const next = instance.isEmpty ? "" : instance.getHTML();
          lastEmittedRef.current = next;
          controlRef.current.markChanged();
          if (!isControlled) setUncontrolled(next);
          onChangeRef.current?.(next);
        },
        onFocus: () => setFocused(true),
        onBlur: () => {
          setFocused(false);
          controlRef.current.markBlurred();
          onBlur?.();
        },
      },
      [],
    );

    // Valor externo (reset, carga de datos).
    useEffect(() => {
      if (!editor || html === lastEmittedRef.current) return;
      lastEmittedRef.current = html;
      editor.commands.setContent(html || "", { emitUpdate: false });
    }, [editor, html]);

    useEffect(() => {
      editor?.setEditable(!blocked);
    }, [blocked, editor]);

    // Atributos de accesibilidad que dependen del estado.
    useEffect(() => {
      const dom = editor?.view.dom;
      if (!dom) return;
      dom.setAttribute("aria-invalid", String(control.error));
      if (control.helperText) dom.setAttribute("aria-describedby", control.helperId);
      else dom.removeAttribute("aria-describedby");
      dom.setAttribute("aria-readonly", String(blocked));
    }, [blocked, control.error, control.helperId, control.helperText, editor]);

    const run = (fn: (e: Editor) => void) => {
      if (editor && !blocked) fn(editor);
    };

    const openLinkDialog = () => {
      setLinkValue(editor?.getAttributes("link").href ?? "");
      setToolError(null);
      setLinkOpen(true);
    };

    const applyLink = () => {
      if (!editor) return;
      if (!linkValue.trim()) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        setLinkOpen(false);
        return;
      }
      const href = normalizeLink(linkValue);
      if (!href) {
        setToolError("Solo se permiten enlaces http(s), correo o teléfono.");
        return;
      }
      const chain = editor.chain().focus().extendMarkRange("link");
      if (editor.state.selection.empty && !editor.isActive("link")) {
        chain
          .insertContent({
            type: "text",
            text: linkValue.trim(),
            marks: [{ type: "link", attrs: { href } }],
          })
          .run();
      } else {
        chain.setLink({ href }).run();
      }
      setLinkOpen(false);
    };

    const insertImageUrl = () => {
      const safe = getSafeUrl(imageUrl);
      if (!safe || !/^https?:/i.test(safe)) {
        setToolError("Ingresa una URL de imagen válida (https://…).");
        return;
      }
      editor?.chain().focus().setImage({ src: safe }).run();
      setImageUrl("");
      setImageOpen(false);
    };

    const uploadImage = async (file: File | undefined) => {
      if (!file || !editor) return;
      if (!file.type.startsWith("image/")) {
        setToolError("El archivo debe ser una imagen.");
        return;
      }
      try {
        let src: string;
        if (onUploadImage) {
          src = await onUploadImage(file);
        } else {
          if (file.size > maxImageSize * 1024 * 1024) {
            setToolError(`La imagen supera el máximo de ${maxImageSize} MB.`);
            return;
          }
          src = await readAsDataUrl(file);
        }
        editor.chain().focus().setImage({ src, alt: file.name }).run();
        setImageOpen(false);
      } catch {
        setToolError("No se pudo subir la imagen.");
      }
    };

    const headingValue = editor?.isActive("heading", { level: 1 })
      ? "1"
      : editor?.isActive("heading", { level: 2 })
        ? "2"
        : editor?.isActive("heading", { level: 3 })
          ? "3"
          : "0";

    const characters = editor?.storage.characterCount?.characters?.() ?? 0;
    const words = editor?.storage.characterCount?.words?.() ?? 0;
    const inTable = Boolean(editor?.isActive("table"));

    return (
      <FormControl
        ref={ref as Ref<HTMLFieldSetElement>}
        component="fieldset"
        fullWidth
        error={control.error}
        disabled={disabled}
        required={required}
        className={className}
        data-cn-rich-text-field
        sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
      >
        {label && (
          <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
            {label}
          </FormLabel>
        )}
        <input type="hidden" name={name} value={html} />
        <Box
          sx={{
            border: "1px solid",
            borderColor: control.error
              ? "var(--cn-color-error-500, #d63c3c)"
              : focused
                ? "var(--cn-color-brand-500, #3562a6)"
                : "var(--cn-color-border, #dde0e4)",
            boxShadow:
              focused && !control.error ? "0 0 0 1px var(--cn-color-brand-500, #3562a6)" : "none",
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: disabled
              ? "var(--cn-color-neutral-100, #f4f5f7)"
              : "var(--cn-color-surface, #ffffff)",
            overflow: "hidden",
            transition: "border-color 140ms ease, box-shadow 140ms ease",
          }}
        >
          {!readOnly && (
            <Box
              role="toolbar"
              aria-label="Formato de texto"
              aria-controls={`${control.id}-editor`}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "2px",
                padding: "4px 6px",
                borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
                backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
              }}
            >
              {tools.has("undo") && (
                <>
                  <ToolButton
                    label="Deshacer"
                    icon={<UndoIcon />}
                    disabled={blocked || !editor?.can().undo()}
                    onClick={() => run((e) => e.chain().focus().undo().run())}
                  />
                  <ToolButton
                    label="Rehacer"
                    icon={<RedoIcon />}
                    disabled={blocked || !editor?.can().redo()}
                    onClick={() => run((e) => e.chain().focus().redo().run())}
                  />
                  <Separator />
                </>
              )}
              {tools.has("heading") && (
                <>
                  <Select
                    size="small"
                    variant="standard"
                    disableUnderline
                    value={headingValue}
                    disabled={blocked}
                    inputProps={{ "aria-label": "Estilo de párrafo" }}
                    onChange={(event) => {
                      const level = Number(event.target.value);
                      run((e) =>
                        level === 0
                          ? e.chain().focus().setParagraph().run()
                          : e
                              .chain()
                              .focus()
                              .toggleHeading({ level: level as 1 | 2 | 3 })
                              .run(),
                      );
                    }}
                    sx={{ fontSize: "var(--cn-font-size-sm, 12px)", minWidth: 96, px: "6px" }}
                  >
                    <MenuItem value="0">Párrafo</MenuItem>
                    <MenuItem value="1">Título 1</MenuItem>
                    <MenuItem value="2">Título 2</MenuItem>
                    <MenuItem value="3">Título 3</MenuItem>
                  </Select>
                  <Separator />
                </>
              )}
              {tools.has("bold") && (
                <ToolButton
                  label="Negrita (Ctrl+B)"
                  icon={<FormatBoldIcon />}
                  active={editor?.isActive("bold")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleBold().run())}
                />
              )}
              {tools.has("italic") && (
                <ToolButton
                  label="Cursiva (Ctrl+I)"
                  icon={<FormatItalicIcon />}
                  active={editor?.isActive("italic")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleItalic().run())}
                />
              )}
              {tools.has("underline") && (
                <ToolButton
                  label="Subrayado (Ctrl+U)"
                  icon={<FormatUnderlinedIcon />}
                  active={editor?.isActive("underline")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleUnderline().run())}
                />
              )}
              {tools.has("strike") && (
                <ToolButton
                  label="Tachado"
                  icon={<FormatStrikethroughIcon />}
                  active={editor?.isActive("strike")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleStrike().run())}
                />
              )}
              {tools.has("code") && (
                <ToolButton
                  label="Código"
                  icon={<CodeIcon />}
                  active={editor?.isActive("code")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleCode().run())}
                />
              )}
              {tools.has("highlight") && (
                <ToolButton
                  label="Resaltar"
                  icon={<HighlightIcon />}
                  active={editor?.isActive("highlight")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleHighlight().run())}
                />
              )}
              {(tools.has("bulletList") || tools.has("orderedList") || tools.has("blockquote")) && (
                <Separator />
              )}
              {tools.has("bulletList") && (
                <ToolButton
                  label="Lista con viñetas"
                  icon={<FormatListBulletedIcon />}
                  active={editor?.isActive("bulletList")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleBulletList().run())}
                />
              )}
              {tools.has("orderedList") && (
                <ToolButton
                  label="Lista numerada"
                  icon={<FormatListNumberedIcon />}
                  active={editor?.isActive("orderedList")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleOrderedList().run())}
                />
              )}
              {tools.has("blockquote") && (
                <ToolButton
                  label="Cita"
                  icon={<FormatQuoteIcon />}
                  active={editor?.isActive("blockquote")}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().toggleBlockquote().run())}
                />
              )}
              {tools.has("horizontalRule") && (
                <ToolButton
                  label="Línea horizontal"
                  icon={<HorizontalRuleIcon />}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().setHorizontalRule().run())}
                />
              )}
              {tools.has("align") && (
                <>
                  <Separator />
                  {(
                    [
                      ["left", "Alinear a la izquierda", <FormatAlignLeftIcon key="l" />],
                      ["center", "Centrar", <FormatAlignCenterIcon key="c" />],
                      ["right", "Alinear a la derecha", <FormatAlignRightIcon key="r" />],
                      ["justify", "Justificar", <FormatAlignJustifyIcon key="j" />],
                    ] as const
                  ).map(([align, text, icon]) => (
                    <ToolButton
                      key={align}
                      label={text}
                      icon={icon}
                      active={editor?.isActive({ textAlign: align })}
                      disabled={blocked}
                      onClick={() => run((e) => e.chain().focus().setTextAlign(align).run())}
                    />
                  ))}
                </>
              )}
              {(tools.has("link") || tools.has("image") || tools.has("table")) && <Separator />}
              {tools.has("link") && (
                <>
                  <ToolButton
                    label="Insertar enlace (Ctrl+K)"
                    icon={<LinkIcon />}
                    active={editor?.isActive("link")}
                    disabled={blocked}
                    onClick={openLinkDialog}
                  />
                  {editor?.isActive("link") && (
                    <ToolButton
                      label="Quitar enlace"
                      icon={<LinkOffIcon />}
                      disabled={blocked}
                      onClick={() =>
                        run((e) => e.chain().focus().extendMarkRange("link").unsetLink().run())
                      }
                    />
                  )}
                </>
              )}
              {tools.has("image") && (
                <ToolButton
                  label="Insertar imagen"
                  icon={<ImageOutlinedIcon />}
                  disabled={blocked}
                  onClick={() => {
                    setToolError(null);
                    setImageOpen(true);
                  }}
                />
              )}
              {tools.has("table") && (
                <ToolButton
                  label="Tabla"
                  icon={<TableChartOutlinedIcon />}
                  active={inTable}
                  disabled={blocked}
                  onClick={setTableAnchor}
                />
              )}
              {tools.has("clear") && (
                <ToolButton
                  label="Quitar formato"
                  icon={<FormatClearIcon />}
                  disabled={blocked}
                  onClick={() => run((e) => e.chain().focus().unsetAllMarks().clearNodes().run())}
                />
              )}
            </Box>
          )}
          <Box
            onKeyDown={(event) => {
              if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k" &&
                tools.has("link")
              ) {
                event.preventDefault();
                openLinkDialog();
              }
            }}
            sx={contentSx(minHeight, maxHeight)}
          >
            <EditorContent editor={editor} />
          </Box>
        </Box>

        {(control.helperText || showCount || maxLength) && (
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
            <FormHelperText id={control.helperId} sx={helperTextSx}>
              {control.helperText}
            </FormHelperText>
            {(showCount || maxLength) && (
              <FormHelperText
                component="span"
                aria-live="polite"
                sx={{
                  ...helperTextSx,
                  flexShrink: 0,
                  color: "var(--cn-color-text-muted, #6e7682)",
                }}
              >
                {showCount && `${words} ${words === 1 ? "palabra" : "palabras"} · `}
                {maxLength ? `${characters}/${maxLength}` : `${characters} caracteres`}
              </FormHelperText>
            )}
          </Box>
        )}

        <Menu
          anchorEl={tableAnchor}
          open={Boolean(tableAnchor)}
          onClose={() => setTableAnchor(null)}
        >
          {(
            [
              [
                "Insertar tabla 3 × 3",
                (e: Editor) =>
                  e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
                !inTable,
              ],
              [
                "Agregar fila debajo",
                (e: Editor) => e.chain().focus().addRowAfter().run(),
                inTable,
              ],
              [
                "Agregar columna a la derecha",
                (e: Editor) => e.chain().focus().addColumnAfter().run(),
                inTable,
              ],
              ["Eliminar fila", (e: Editor) => e.chain().focus().deleteRow().run(), inTable],
              ["Eliminar columna", (e: Editor) => e.chain().focus().deleteColumn().run(), inTable],
              ["Eliminar tabla", (e: Editor) => e.chain().focus().deleteTable().run(), inTable],
            ] as const
          ).map(([text, action, enabled]) => (
            <MenuItem
              key={text}
              disabled={!enabled}
              onClick={() => {
                run(action);
                setTableAnchor(null);
              }}
              sx={{ fontSize: "var(--cn-font-size-base, 13px)" }}
            >
              {text}
            </MenuItem>
          ))}
        </Menu>

        <Dialog
          open={linkOpen}
          onClose={() => setLinkOpen(false)}
          maxWidth="xs"
          fullWidth
          aria-labelledby={`${control.id}-link-title`}
        >
          <DialogTitle
            id={`${control.id}-link-title`}
            sx={{ fontSize: "var(--cn-font-size-lg, 16px)" }}
          >
            Enlace
          </DialogTitle>
          <DialogContent>
            <CnTextField
              label="URL, correo o teléfono"
              placeholder="https://canek.mx"
              value={linkValue}
              onChange={setLinkValue}
              autoFocus
              error={Boolean(toolError)}
              helperText={toolError ?? "Déjalo vacío para quitar el enlace."}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
              sx={{ mt: "8px" }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <CnButton variant="outlined" color="neutral" onClick={() => setLinkOpen(false)}>
              Cancelar
            </CnButton>
            <CnButton onClick={applyLink}>Aplicar</CnButton>
          </DialogActions>
        </Dialog>

        <Dialog
          open={imageOpen}
          onClose={() => setImageOpen(false)}
          maxWidth="xs"
          fullWidth
          aria-labelledby={`${control.id}-image-title`}
        >
          <DialogTitle
            id={`${control.id}-image-title`}
            sx={{ fontSize: "var(--cn-font-size-lg, 16px)" }}
          >
            Insertar imagen
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <CnTextField
              label="URL de la imagen"
              placeholder="https://…"
              value={imageUrl}
              onChange={setImageUrl}
              error={Boolean(toolError)}
              helperText={toolError ?? undefined}
              sx={{ mt: "8px" }}
            />
            <Divider>o</Divider>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                void uploadImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <CnButton
              variant="outlined"
              color="neutral"
              startIcon="upload"
              onClick={() => fileInputRef.current?.click()}
            >
              {onUploadImage ? "Subir imagen" : `Elegir del equipo (máx. ${maxImageSize} MB)`}
            </CnButton>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <CnButton variant="outlined" color="neutral" onClick={() => setImageOpen(false)}>
              Cancelar
            </CnButton>
            <CnButton onClick={insertImageUrl} disabled={!imageUrl.trim()}>
              Insertar
            </CnButton>
          </DialogActions>
        </Dialog>
      </FormControl>
    );
  },
);
