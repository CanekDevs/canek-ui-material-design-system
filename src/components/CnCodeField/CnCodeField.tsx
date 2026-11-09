import DataObjectIcon from "@mui/icons-material/DataObject";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { KeyboardEvent } from "react";
import { forwardRef, useLayoutEffect, useRef } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import type { CnFieldSize } from "../../utils/field-styles";
import { groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { CnCodeFieldSkeleton } from "./CnCodeFieldSkeleton";

export type CnCodeLanguage =
  | "json"
  | "text"
  | "sql"
  | "javascript"
  | "typescript"
  | "html"
  | "css"
  | "xml"
  | "yaml"
  | "markdown";

export type CnCodeFieldProps = CnFieldBaseProps<string> & {
  /** Lenguaje: activa la validación y el formateo de JSON. Por defecto `text`. */
  language?: CnCodeLanguage;
  /** Filas visibles mínimas y máximas (después hay scroll). */
  minRows?: number;
  maxRows?: number;
  /** Espacios por nivel de sangría (Tab). Por defecto 2. */
  tabSize?: number;
  /** Numeración de líneas. Por defecto `true`. */
  lineNumbers?: boolean;
  /** Ajusta las líneas largas en lugar de desplazar horizontalmente. */
  lineWrap?: boolean;
  /** Botón "Formatear" (solo JSON). Por defecto `true`. */
  formatButton?: boolean;
  /** Valida que el JSON sea correcto. Por defecto `true` con `language="json"`. */
  validateJson?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** Muestra el skeleton del campo (mismas variantes) en lugar del campo. */
  skeleton?: boolean;
};

const LANGUAGE_LABELS: Record<CnCodeLanguage, string> = {
  json: "JSON",
  text: "Texto",
  sql: "SQL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  html: "HTML",
  css: "CSS",
  xml: "XML",
  yaml: "YAML",
  markdown: "Markdown",
};

const FONT_SIZES: Record<CnFieldSize, number> = { sm: 12, md: 13, lg: 14 };
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/** Error de un texto JSON (o `null` si es válido o está vacío). */
export const getJsonError = (text: unknown): string | null => {
  if (typeof text !== "string" || !text.trim()) return null;
  try {
    JSON.parse(text);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lineColumn = /line (\d+) column (\d+)/.exec(message);
    if (lineColumn) {
      return `JSON no válido (línea ${lineColumn[1]}, columna ${lineColumn[2]})`;
    }
    const position = /position (\d+)/.exec(message);
    if (position) {
      const index = Number(position[1]);
      const before = text.slice(0, index);
      const line = before.split("\n").length;
      const column = index - before.lastIndexOf("\n");
      return `JSON no válido (línea ${line}, columna ${column})`;
    }
    if (/end of JSON/i.test(message)) return "JSON no válido: el texto está incompleto";
    const token = /Unexpected token '?(.)'?/.exec(message);
    if (token) return `JSON no válido: carácter inesperado «${token[1]}»`;
    return "JSON no válido";
  }
};

/** Formatea JSON con la sangría indicada (devuelve el texto original si no es válido). */
export const formatJson = (text: string, tabSize = 2): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, tabSize);
  } catch {
    return text;
  }
};

/** Reglas implícitas: requerido y JSON válido. */
export const buildCodeRules = ({
  required,
  language = "text",
  validateJson,
}: {
  required?: boolean;
  language?: CnCodeLanguage;
  validateJson?: boolean;
} = {}): CnValidationRule[] => {
  const rules: CnValidationRule[] = [];
  if (required) {
    rules.push({
      type: "custom",
      message: "Campo requerido",
      validate: (v) => typeof v === "string" && v.trim() !== "",
    });
  }
  if (language === "json" && validateJson !== false) {
    // `validate` se evalúa antes que `message`: el mensaje incluye la línea del error.
    let lastError: string | null = null;
    rules.push({
      type: "custom",
      message: () => lastError ?? "JSON no válido",
      validate: (v) => {
        lastError = getJsonError(v);
        return lastError === null;
      },
    });
  }
  return rules;
};

/** Editor de código ligero: numeración de líneas, sangría con Tab y JSON validado. */
export const CnCodeField = forwardRef<HTMLFieldSetElement, CnCodeFieldProps>(function CnCodeField(
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
    size = "md",
    reserveHelperSpace,
    sx,
    className,
    language = "text",
    minRows = 6,
    maxRows = 20,
    tabSize = 2,
    lineNumbers = true,
    lineWrap = false,
    formatButton = true,
    validateJson,
    placeholder,
    autoFocus,
    skeleton = false,
  },
  ref,
) {
  const [current, setCurrent] = useControllableValue<string>(value, defaultValue, "", onChange);
  const text = typeof current === "string" ? current : String(current ?? "");
  const control = useFieldControl(text, {
    id,
    rules: [...(rules ?? []), ...buildCodeRules({ required, language, validateJson })],
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs: debounceMs ?? 0,
    internalValidation,
    error,
    helperText,
    reserveHelperSpace,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingSelection = useRef<[number, number] | null>(null);
  const tabReleased = useRef(false);

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection || !textareaRef.current) return;
    pendingSelection.current = null;
    textareaRef.current.setSelectionRange(selection[0], selection[1]);
  });

  const lineCount = Math.max(1, text.split("\n").length);
  const isJson = language === "json";
  const jsonError = isJson && validateJson !== false ? getJsonError(text) : null;

  if (skeleton) {
    return (
      <CnCodeFieldSkeleton
        size={size}
        rows={Math.min(Math.max(minRows, lineCount), maxRows)}
        lineNumbers={lineNumbers}
        toolbar={isJson && formatButton && !readOnly}
        label={Boolean(label)}
        helperText={Boolean(control.helperText?.trim())}
        sx={sx}
        className={className}
      />
    );
  }

  const fontSize = FONT_SIZES[size];
  const lineHeight = Math.round(fontSize * 1.6);
  const visibleRows = Math.min(Math.max(minRows, lineCount), Math.max(minRows, maxRows));
  const padY = 8;
  const locked = Boolean(disabled || readOnly);
  const indent = " ".repeat(Math.max(1, tabSize));

  const emit = (next: string, selection?: [number, number]) => {
    if (selection) pendingSelection.current = selection;
    control.markChanged();
    setCurrent(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (locked) return;
    const target = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = target;
    if (event.key === "Escape") {
      // Esc + Tab sale del editor (accesibilidad: evita la trampa de foco).
      tabReleased.current = true;
      return;
    }
    if (event.key === "Tab") {
      if (tabReleased.current || event.ctrlKey || event.metaKey || event.altKey) {
        tabReleased.current = false;
        return;
      }
      event.preventDefault();
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      if (event.shiftKey || start !== end) {
        // Sangra / quita sangría a todas las líneas seleccionadas.
        const block = text.slice(lineStart, end);
        const lines = block.split("\n");
        let firstDelta = 0;
        let totalDelta = 0;
        const updated = lines.map((line, i) => {
          if (event.shiftKey) {
            const removable = /^ +/.exec(line)?.[0].length ?? 0;
            const removed = Math.min(removable, indent.length);
            if (i === 0) firstDelta = -removed;
            totalDelta -= removed;
            return line.slice(removed);
          }
          if (i === 0) firstDelta = indent.length;
          totalDelta += indent.length;
          return indent + line;
        });
        const next = text.slice(0, lineStart) + updated.join("\n") + text.slice(end);
        emit(next, [Math.max(lineStart, start + firstDelta), end + totalDelta]);
        return;
      }
      emit(text.slice(0, start) + indent + text.slice(end), [
        start + indent.length,
        start + indent.length,
      ]);
      return;
    }
    tabReleased.current = false;
    if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      // Conserva la sangría de la línea actual (y la aumenta tras `{` o `[`).
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const currentIndent = /^[ \t]*/.exec(text.slice(lineStart, start))?.[0] ?? "";
      const previous = text.slice(0, start).trimEnd().slice(-1);
      const extra = previous === "{" || previous === "[" || previous === "(" ? indent : "";
      if (!currentIndent && !extra) return;
      event.preventDefault();
      const insert = `\n${currentIndent}${extra}`;
      emit(text.slice(0, start) + insert + text.slice(end), [
        start + insert.length,
        start + insert.length,
      ]);
    }
  };

  const describedBy = control.helperText?.trim() ? control.helperId : undefined;
  const borderColor = control.error
    ? "var(--cn-color-error-500, #d63c3c)"
    : "var(--cn-color-border, #dde0e4)";

  return (
    <FormControl
      ref={ref}
      component="fieldset"
      fullWidth
      error={control.error}
      disabled={disabled}
      required={required}
      className={className}
      data-cn-code-field
      sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0 }, sx)}
    >
      {label && (
        <FormLabel component="legend" id={`${control.id}-label`} sx={groupLegendSx}>
          {label}
        </FormLabel>
      )}
      <Box
        sx={{
          border: "1px solid",
          borderColor,
          borderRadius: "var(--cn-radius-md, 8px)",
          backgroundColor: disabled
            ? "var(--cn-color-neutral-100, #f4f5f7)"
            : "var(--cn-color-surface, #ffffff)",
          overflow: "hidden",
          transition: "border-color 140ms ease",
          "&:focus-within": {
            borderColor: control.error
              ? "var(--cn-color-error-500, #d63c3c)"
              : "var(--cn-color-brand-500, #3562a6)",
            boxShadow: `0 0 0 1px ${
              control.error
                ? "var(--cn-color-error-500, #d63c3c)"
                : "var(--cn-color-brand-500, #3562a6)"
            }`,
          },
        }}
      >
        <Box
          data-cn-code-toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            px: "10px",
            minHeight: 30,
            borderBottom: "1px solid var(--cn-color-border-subtle, #e9ecef)",
            backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
            fontSize: 11,
            color: "var(--cn-color-text-muted, #6e7682)",
          }}
        >
          <Box component="span" sx={{ fontWeight: 600, letterSpacing: "0.03em" }}>
            {LANGUAGE_LABELS[language]}
          </Box>
          {isJson && text.trim() && (
            <Box
              component="span"
              role="status"
              sx={{
                color: jsonError
                  ? "var(--cn-color-error-600, #b52f2f)"
                  : "var(--cn-color-success-600, #2e7d4f)",
              }}
            >
              {jsonError ? "JSON no válido" : "JSON válido"}
            </Box>
          )}
          <Box sx={{ flex: 1 }} />
          <Box component="span" aria-hidden>
            {lineCount} {lineCount === 1 ? "línea" : "líneas"}
          </Box>
          {isJson && formatButton && !locked && (
            <Button
              size="small"
              startIcon={<DataObjectIcon sx={{ fontSize: "14px !important" }} />}
              disabled={Boolean(jsonError) || !text.trim()}
              onClick={() => emit(formatJson(text, tabSize))}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: 11, py: 0, minHeight: 24 }}
            >
              Formatear
            </Button>
          )}
        </Box>
        <Box
          data-cn-code-scroller
          sx={{
            display: "flex",
            alignItems: "stretch",
            maxHeight: Math.max(minRows, maxRows) * lineHeight + padY * 2,
            overflowY: "auto",
          }}
        >
          {lineNumbers && (
            <Box
              aria-hidden
              data-cn-code-gutter
              sx={{
                flexShrink: 0,
                py: `${padY}px`,
                px: "8px",
                minWidth: 36,
                textAlign: "right",
                userSelect: "none",
                fontFamily: MONO,
                fontSize,
                lineHeight: `${lineHeight}px`,
                color: "var(--cn-color-text-subtle, #9aa1aa)",
                backgroundColor: "var(--cn-color-neutral-50, #fafbfc)",
                borderRight: "1px solid var(--cn-color-border-subtle, #e9ecef)",
                whiteSpace: "pre",
              }}
            >
              {Array.from({ length: Math.max(lineCount, visibleRows) }, (_, i) =>
                i < lineCount ? String(i + 1) : " ",
              ).join("\n")}
            </Box>
          )}
          <Box
            component="textarea"
            ref={textareaRef}
            id={control.id}
            name={name}
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            autoFocus={autoFocus}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            wrap={lineWrap ? "soft" : "off"}
            rows={visibleRows}
            aria-invalid={control.error || undefined}
            aria-describedby={describedBy}
            aria-labelledby={label ? `${control.id}-label` : undefined}
            aria-label={label ? undefined : `Editor ${LANGUAGE_LABELS[language]}`}
            aria-multiline
            data-language={language}
            onChange={(event) => emit((event.target as HTMLTextAreaElement).value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              tabReleased.current = false;
              control.markBlurred();
              onBlur?.();
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              m: 0,
              border: 0,
              outline: 0,
              resize: "none",
              overflowY: "hidden",
              overflowX: lineWrap ? "hidden" : "auto",
              whiteSpace: lineWrap ? "pre-wrap" : "pre",
              height: Math.max(lineCount, visibleRows) * lineHeight + padY * 2,
              boxSizing: "border-box",
              py: `${padY}px`,
              px: "10px",
              fontFamily: MONO,
              fontSize,
              lineHeight: `${lineHeight}px`,
              tabSize,
              color: "var(--cn-color-text, #222831)",
              backgroundColor: "transparent",
              "&::placeholder": { color: "var(--cn-color-text-subtle, #9aa1aa)" },
            }}
          />
        </Box>
      </Box>
      {control.helperText && (
        <FormHelperText id={control.helperId} sx={helperTextSx}>
          {control.helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});
