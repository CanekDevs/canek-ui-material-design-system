import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import type { ClipboardEvent, KeyboardEvent, Ref } from "react";
import { forwardRef, useRef, useState } from "react";
import type { CnFieldBaseProps } from "../../utils/field-control";
import { useControllableValue, useFieldControl } from "../../utils/field-control";
import { FIELD_SIZE_TOKENS, groupLegendSx, helperTextSx, mergeSx } from "../../utils/field-styles";
import type { CnValidationRule } from "../CnForm/CnForm.types";
import { validateFieldValue } from "../CnForm/CnForm.validation";

export type CnTagsFieldProps = CnFieldBaseProps<string[]> & {
  placeholder?: string;
  /** Reglas que debe cumplir cada etiqueta (p. ej. `[{ type: "email" }]`). */
  tagRules?: CnValidationRule[];
  /** Validación propia por etiqueta: devuelve un mensaje si no es válida. */
  validateTag?: (tag: string, tags: string[]) => string | null | undefined;
  maxTags?: number;
  allowDuplicates?: boolean;
  /** Teclas o caracteres que confirman una etiqueta. Enter siempre confirma. */
  separators?: string[];
  transform?: "lowercase" | "uppercase" | "none";
  /** Sugerencias que se muestran mientras se escribe. */
  suggestions?: string[];
  autoFocus?: boolean;
};

/**
 * Lista libre de valores como chips: correos, palabras clave, folios… Valida
 * cada etiqueta antes de agregarla, separa al pegar listas y borra con
 * Retroceso.
 */
export const CnTagsField = forwardRef<HTMLDivElement, CnTagsFieldProps>(function CnTagsField(
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
    placeholder = "Escribe y presiona Enter",
    tagRules,
    validateTag,
    maxTags,
    allowDuplicates = false,
    separators = [",", ";"],
    transform = "none",
    suggestions,
    autoFocus,
  },
  ref,
) {
  const [tags, setTags] = useControllableValue<string[]>(value, defaultValue, [], onChange);
  const list = Array.isArray(tags) ? tags : [];
  const [draft, setDraft] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const control = useFieldControl(list, {
    id,
    rules,
    formValues,
    sectionContext,
    validateOnChange,
    validateOnBlur,
    debounceMs: debounceMs ?? 0,
    internalValidation,
    error,
    helperText: tagError ?? helperText,
    reserveHelperSpace,
  });
  const blocked = Boolean(disabled || readOnly);
  const full = maxTags !== undefined && list.length >= maxTags;

  const normalize = (text: string) => {
    const trimmed = text.trim();
    return transform === "lowercase"
      ? trimmed.toLocaleLowerCase()
      : transform === "uppercase"
        ? trimmed.toLocaleUpperCase()
        : trimmed;
  };

  /** Agrega varias etiquetas; devuelve el texto que no se pudo agregar. */
  const addTags = (raw: string[]): string => {
    const next = [...list];
    const rejected: string[] = [];
    let message: string | null = null;
    for (const item of raw.map(normalize).filter(Boolean)) {
      if (maxTags !== undefined && next.length >= maxTags) {
        message = `Máximo ${maxTags} elementos`;
        rejected.push(item);
        continue;
      }
      if (
        !allowDuplicates &&
        next.some((tag) => tag.toLocaleLowerCase() === item.toLocaleLowerCase())
      ) {
        message = `"${item}" ya está en la lista`;
        continue;
      }
      const problem = validateTag?.(item, next) || validateFieldValue(item, tagRules);
      if (problem) {
        message = `"${item}": ${problem}`;
        rejected.push(item);
        continue;
      }
      next.push(item);
    }
    setTagError(message);
    if (next.length !== list.length) {
      control.markChanged();
      setTags(next);
    }
    return rejected.join(", ");
  };

  const removeAt = (index: number) => {
    if (blocked) return;
    control.markChanged();
    setTagError(null);
    setTags(list.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  const commitDraft = () => {
    if (!draft.trim()) return;
    setDraft(addTags([draft]));
  };

  const splitter = new RegExp(
    `[${separators.map((s) => s.replace(/[\\\]^-]/g, "\\$&")).join("")}\\n\\t]+`,
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || separators.includes(event.key)) {
      if (draft.trim()) {
        event.preventDefault();
        commitDraft();
      } else if (event.key !== "Enter") {
        event.preventDefault();
      }
    } else if (event.key === "Backspace" && !draft && list.length > 0) {
      event.preventDefault();
      removeAt(list.length - 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    if (!splitter.test(text)) return;
    event.preventDefault();
    setDraft(addTags(text.split(splitter)));
  };

  const matches =
    focused && draft.trim() && suggestions
      ? suggestions
          .filter(
            (s) =>
              s.toLocaleLowerCase().includes(draft.trim().toLocaleLowerCase()) && !list.includes(s),
          )
          .slice(0, 6)
      : [];
  const tokens = FIELD_SIZE_TOKENS[size];

  return (
    <FormControl
      ref={ref as Ref<HTMLFieldSetElement>}
      component="fieldset"
      fullWidth
      error={control.error}
      disabled={disabled}
      required={required}
      className={className}
      data-cn-tags-field
      sx={mergeSx({ minWidth: 0, border: 0, p: 0, m: 0, position: "relative" }, sx)}
    >
      {label && (
        <FormLabel component="legend" htmlFor={control.id} sx={groupLegendSx}>
          {label}
        </FormLabel>
      )}
      {list.map((tag, index) => (
        <input
          key={`${tag}-${index}`}
          type="hidden"
          name={name ? `${name}[${index}]` : undefined}
          value={tag}
        />
      ))}
      <Box
        onClick={() => inputRef.current?.focus()}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px",
          minHeight: tokens.height,
          padding: "4px 8px",
          cursor: "text",
          borderRadius: "var(--cn-radius-md, 8px)",
          border: "1px solid",
          borderColor: control.error
            ? "var(--cn-color-error-500, #d63c3c)"
            : focused
              ? "var(--cn-color-brand-500, #3562a6)"
              : "var(--cn-color-border, #dde0e4)",
          boxShadow:
            focused && !control.error ? "0 0 0 1px var(--cn-color-brand-500, #3562a6)" : "none",
          backgroundColor: disabled
            ? "var(--cn-color-neutral-100, #f4f5f7)"
            : "var(--cn-color-surface, #ffffff)",
          transition: "border-color 140ms ease, box-shadow 140ms ease",
        }}
      >
        {list.map((tag, index) => (
          <Chip
            key={`${tag}-${index}`}
            label={tag}
            size="small"
            onDelete={blocked ? undefined : () => removeAt(index)}
            slotProps={{ root: { "aria-label": tag } as Record<string, unknown> }}
            sx={{ height: 24, fontSize: "var(--cn-font-size-sm, 12px)", maxWidth: "100%" }}
          />
        ))}
        {!readOnly && (
          <Box
            component="input"
            ref={inputRef}
            id={control.id}
            value={draft}
            disabled={disabled || full}
            placeholder={full ? `Máximo ${maxTags}` : list.length ? "" : placeholder}
            autoFocus={autoFocus}
            aria-describedby={control.helperText ? control.helperId : undefined}
            aria-invalid={control.error || undefined}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              if (tagError) setTagError(null);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              commitDraft();
              control.markBlurred();
              onBlur?.();
            }}
            sx={{
              flex: 1,
              minWidth: 120,
              border: 0,
              outline: "none",
              background: "transparent",
              fontSize: tokens.fontSize,
              fontFamily: "inherit",
              color: "var(--cn-color-text, #222831)",
              py: "4px",
            }}
          />
        )}
      </Box>
      {matches.length > 0 && (
        <Box
          role="listbox"
          aria-label="Sugerencias"
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            mt: "4px",
            py: "4px",
            borderRadius: "var(--cn-radius-md, 8px)",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            boxShadow: "0 8px 24px rgba(17, 20, 24, 0.12)",
          }}
        >
          {matches.map((suggestion) => (
            <Box
              key={suggestion}
              role="option"
              aria-selected={false}
              onMouseDown={(event) => {
                event.preventDefault();
                addTags([suggestion]);
                setDraft("");
              }}
              sx={{
                px: "12px",
                py: "6px",
                cursor: "pointer",
                fontSize: "var(--cn-font-size-base, 13px)",
                "&:hover": { backgroundColor: "var(--cn-color-brand-50, #eef3fb)" },
              }}
            >
              {suggestion}
            </Box>
          ))}
        </Box>
      )}
      {(control.helperText || maxTags) && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
          <FormHelperText
            id={control.helperId}
            error={Boolean(tagError) || control.error}
            sx={helperTextSx}
          >
            {control.helperText}
          </FormHelperText>
          {maxTags !== undefined && (
            <FormHelperText
              component="span"
              sx={{ ...helperTextSx, color: "var(--cn-color-text-muted, #6e7682)" }}
            >
              {list.length}/{maxTags}
            </FormHelperText>
          )}
        </Box>
      )}
    </FormControl>
  );
});
