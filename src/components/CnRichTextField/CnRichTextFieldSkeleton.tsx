import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText, varyWidth } from "../CnSkeleton";
import type { CnRichTextToolbar } from "./rich-text-toolbars";
import { RICH_TEXT_TOOLBARS } from "./rich-text-toolbars";

/*
 * Importante: este archivo no carga tiptap ni `CnRichTextField.tsx` en tiempo de
 * ejecución, para poder exportarse desde la entrada principal.
 */

export type CnRichTextFieldSkeletonProps = CnSkeletonCommonProps & {
  label?: boolean | string;
  helperText?: boolean | string;
  /** Herramientas visibles: un preset o una lista propia (como el campo). */
  toolbar?: CnRichTextToolbar;
  /** Sin barra de herramientas (como `readOnly` en el campo). */
  readOnly?: boolean;
  /** Alto mínimo del área de edición (como el campo). */
  minHeight?: number | string;
  /** Líneas de texto simuladas; por defecto según `minHeight`. */
  lines?: number;
  /** Contador de caracteres/palabras bajo el editor. */
  showCount?: boolean;
  maxLength?: number;
};

type ToolbarPiece = "button" | "separator" | "select";

/** Reproduce el orden y agrupación de la barra real. */
const toolbarPieces = (toolbar: CnRichTextToolbar): ToolbarPiece[] => {
  const tools = new Set(Array.isArray(toolbar) ? toolbar : RICH_TEXT_TOOLBARS[toolbar]);
  const pieces: ToolbarPiece[] = [];
  const add = (...items: ToolbarPiece[]) => pieces.push(...items);
  if (tools.has("undo")) add("button", "button", "separator");
  if (tools.has("heading")) add("select", "separator");
  (["bold", "italic", "underline", "strike", "code", "highlight"] as const).forEach(
    (tool) => tools.has(tool) && add("button"),
  );
  if (tools.has("bulletList") || tools.has("orderedList") || tools.has("blockquote")) {
    add("separator");
  }
  (["bulletList", "orderedList", "blockquote", "horizontalRule"] as const).forEach(
    (tool) => tools.has(tool) && add("button"),
  );
  if (tools.has("align")) add("separator", "button", "button", "button", "button");
  if (tools.has("link") || tools.has("image") || tools.has("table")) add("separator");
  (["link", "image", "table", "clear"] as const).forEach(
    (tool) => tools.has(tool) && add("button"),
  );
  // Sin separadores al inicio/fin ni repetidos.
  return pieces.filter(
    (piece, i) =>
      piece !== "separator" || (i > 0 && i < pieces.length - 1 && pieces[i - 1] !== "separator"),
  );
};

const LINE_HEIGHT = 22; // 14px · 1.6

/** Skeleton de `CnRichTextField`: barra de herramientas, área de edición con líneas y contador. */
export const CnRichTextFieldSkeleton = ({
  label = true,
  helperText = false,
  toolbar = "standard",
  readOnly = false,
  minHeight = 180,
  lines,
  showCount = false,
  maxLength,
  animation,
  ariaLabel = "Cargando editor",
  sx,
  className,
}: CnRichTextFieldSkeletonProps) => {
  const pieces = readOnly ? [] : toolbarPieces(toolbar);
  const numericMin = typeof minHeight === "number" ? minHeight : 180;
  const lineCount = lines ?? Math.max(1, Math.min(6, Math.floor((numericMin - 24) / LINE_HEIGHT)));
  const counter = showCount || maxLength != null;

  return (
    <CnSkeletonGroup
      name="rich-text-field"
      animation={animation}
      ariaLabel={ariaLabel}
      sx={sx}
      className={className}
    >
      {label && <SkText width={120} size={13} sx={{ mb: "8px" }} />}
      <Box
        sx={{
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-md, 8px)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          overflow: "hidden",
        }}
      >
        {pieces.length > 0 && (
          <Box
            data-sk-part="toolbar"
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
            {pieces.map((piece, i) =>
              piece === "separator" ? (
                <Box
                  key={i}
                  sx={{
                    alignSelf: "stretch",
                    width: "1px",
                    mx: "4px",
                    my: "4px",
                    backgroundColor: "var(--cn-color-border, #dde0e4)",
                  }}
                />
              ) : piece === "select" ? (
                <Box
                  key={i}
                  data-sk-part="select"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: 96,
                    px: "6px",
                    height: 30,
                  }}
                >
                  <SkText width={58} size={12} />
                  <SkBlock width={10} height={6} radius={2} />
                </Box>
              ) : (
                <Box
                  key={i}
                  data-sk-part="tool"
                  sx={{
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SkBlock width={18} height={18} radius={4} />
                </Box>
              ),
            )}
          </Box>
        )}
        <Box
          data-sk-part="editor"
          sx={{
            minHeight,
            boxSizing: "border-box",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: `${LINE_HEIGHT - 11}px`,
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <SkText
              key={i}
              size={14}
              width={i === lineCount - 1 && lineCount > 1 ? "48%" : varyWidth(i, 78, 22)}
            />
          ))}
        </Box>
      </Box>
      {(helperText || counter) && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: "8px", mt: "6px" }}>
          {helperText ? <SkText width="42%" size={11} /> : <span />}
          {counter && <SkText width={showCount ? 110 : 48} size={11} />}
        </Box>
      )}
    </CnSkeletonGroup>
  );
};
