import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";
import { forwardRef, useId, useMemo, useRef, useState } from "react";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import { CnDateField } from "../CnDateField";
import { CnSelectField } from "../CnSelectField";
import { CnTabs } from "../CnTabs";
import { CnTextField } from "../CnTextField";
import { CnActivityComposerSkeleton } from "./CnActivityComposerSkeleton";
import type { CnMentionable } from "./mentions";
import { extractMentions, filterMentionables, findMentionQuery } from "./mentions";

export type CnActivityType = "note" | "call" | "email" | "meeting" | "task";

export type CnActivityTemplate = {
  id: string;
  label: string;
  body: string;
  /** Solo aparece en este tipo (por defecto, en todos). */
  type?: CnActivityType;
};

/** Lo que entrega el compositor al guardar. */
export type CnActivityDraft = {
  type: CnActivityType;
  body: string;
  /** Ids de las personas mencionadas con `@`. */
  mentions: string[];
  /** Asunto (correo). */
  subject?: string;
  /** Resultado de la llamada. */
  outcome?: string;
  /** Duración en minutos (llamada, reunión). */
  durationMinutes?: number;
  /** Fecha y hora (`YYYY-MM-DDTHH:mm`): reunión o vencimiento de tarea. */
  dueAt?: string;
  /** Prioridad (tarea). */
  priority?: "low" | "normal" | "high";
};

export type CnActivityComposerProps = {
  /** Tipos disponibles, en orden. */
  types?: readonly CnActivityType[];
  defaultType?: CnActivityType;
  /** Personas que se pueden mencionar con `@`. */
  mentionables?: readonly CnMentionable[];
  templates?: readonly CnActivityTemplate[];
  /** Guarda la actividad. Si devuelve una promesa, muestra carga y limpia al resolver. */
  onSubmit: (draft: CnActivityDraft) => void | Promise<void>;
  /** Muestra "Cancelar". */
  onCancel?: () => void;
  /** Texto del registro (por ejemplo, "Mariana López"): aparece en el texto de ayuda. */
  recordName?: string;
  /** Resultados posibles de una llamada. */
  callOutcomes?: readonly string[];
  disabled?: boolean;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const TYPE_META: Record<
  CnActivityType,
  { label: string; icon: string; placeholder: string; submit: string }
> = {
  note: {
    label: "Nota",
    icon: "edit_note",
    placeholder: "Escribe una nota. Usa @ para mencionar.",
    submit: "Guardar nota",
  },
  call: {
    label: "Llamada",
    icon: "call",
    placeholder: "¿De qué hablaron?",
    submit: "Registrar llamada",
  },
  email: {
    label: "Correo",
    icon: "mail",
    placeholder: "Resumen o cuerpo del correo",
    submit: "Registrar correo",
  },
  meeting: {
    label: "Reunión",
    icon: "groups",
    placeholder: "Agenda o acuerdos de la reunión",
    submit: "Registrar reunión",
  },
  task: {
    label: "Tarea",
    icon: "task_alt",
    placeholder: "¿Qué hay que hacer?",
    submit: "Crear tarea",
  },
};

const DEFAULT_OUTCOMES = ["Contestó", "No contestó", "Buzón de voz", "Número equivocado"];

/** Registrar nota, llamada, correo, reunión o tarea con plantillas y menciones. */
export const CnActivityComposer = forwardRef<HTMLFormElement, CnActivityComposerProps>(
  function CnActivityComposer(
    {
      types = ["note", "call", "email", "meeting", "task"],
      defaultType,
      mentionables = [],
      templates = [],
      onSubmit,
      onCancel,
      recordName,
      callOutcomes = DEFAULT_OUTCOMES,
      disabled = false,
      skeleton = false,
      sx,
      className,
    },
    ref,
  ) {
    const [type, setType] = useState<CnActivityType>(defaultType ?? types[0] ?? "note");
    const [body, setBody] = useState("");
    const [subject, setSubject] = useState("");
    const [outcome, setOutcome] = useState<string>("");
    const [duration, setDuration] = useState("");
    const [dueAt, setDueAt] = useState("");
    const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
    const [highlight, setHighlight] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const listId = useId();
    const bodyId = useId();

    const suggestions = useMemo(
      () => (mention ? filterMentionables(mentionables, mention.query) : []),
      [mention, mentionables],
    );
    const typeTemplates = templates.filter((template) => !template.type || template.type === type);

    if (skeleton) {
      return <CnActivityComposerSkeleton tabs={types.length} sx={sx} className={className} />;
    }

    const meta = TYPE_META[type];
    const busy = disabled || saving;
    const canSubmit =
      !busy && (body.trim().length > 0 || (type === "email" && subject.trim().length > 0));

    const reset = () => {
      setBody("");
      setSubject("");
      setOutcome("");
      setDuration("");
      setDueAt("");
      setPriority("normal");
      setMention(null);
    };

    const submit = async () => {
      if (!canSubmit) return;
      const draft: CnActivityDraft = {
        type,
        body: body.trim(),
        mentions: extractMentions(body, mentionables),
      };
      if (type === "email") draft.subject = subject.trim();
      if (type === "call") {
        if (outcome) draft.outcome = outcome;
      }
      if ((type === "call" || type === "meeting") && duration) {
        const minutes = Number(duration);
        if (Number.isFinite(minutes) && minutes > 0) draft.durationMinutes = minutes;
      }
      if ((type === "meeting" || type === "task") && dueAt) draft.dueAt = dueAt;
      if (type === "task") draft.priority = priority;

      setError(null);
      setSaving(true);
      try {
        await onSubmit(draft);
        reset();
      } catch (cause) {
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "No se pudo guardar. Intenta de nuevo.",
        );
      } finally {
        setSaving(false);
      }
    };

    const updateMention = (text: string, caret: number) => {
      if (mentionables.length === 0) return;
      const found = findMentionQuery(text, caret);
      setMention(found);
      setHighlight(0);
    };

    const pickMention = (person: CnMentionable) => {
      if (!mention) return;
      const caret = textareaRef.current?.selectionStart ?? body.length;
      const next = `${body.slice(0, mention.start)}@${person.name} ${body.slice(caret)}`;
      const position = mention.start + person.name.length + 2;
      setBody(next);
      setMention(null);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(position, position);
      });
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (mention && suggestions.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setHighlight((i) => (i + 1) % suggestions.length);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          event.preventDefault();
          pickMention(suggestions[highlight]);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setMention(null);
          return;
        }
      }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void submit();
      }
    };

    const open = Boolean(mention) && suggestions.length > 0;

    return (
      <Box
        ref={ref}
        component="form"
        data-cn-activity-composer
        aria-label="Registrar actividad"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className={className}
        sx={[
          {
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-md, 8px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            color: "var(--cn-color-text, #222831)",
            overflow: "hidden",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {types.length > 1 && (
          <Box sx={{ borderBottom: "1px solid var(--cn-color-border, #dde0e4)", minWidth: 0 }}>
            <CnTabs
              value={type}
              onChange={(value) => setType(value as CnActivityType)}
              options={types.map((id) => ({
                id,
                label: TYPE_META[id].label,
                icon: TYPE_META[id].icon,
              }))}
              size="sm"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Tipo de actividad"
            />
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", p: "16px", minWidth: 0 }}>
          {type === "email" && (
            <CnTextField
              label="Asunto"
              value={subject}
              onChange={setSubject}
              disabled={busy}
              size="sm"
            />
          )}

          <Box sx={{ position: "relative", minWidth: 0 }}>
            <Box
              component="textarea"
              ref={textareaRef}
              id={bodyId}
              aria-label={meta.label}
              aria-describedby={`${bodyId}-help`}
              aria-autocomplete={mentionables.length > 0 ? "list" : undefined}
              aria-controls={open ? listId : undefined}
              aria-expanded={mentionables.length > 0 ? open : undefined}
              aria-activedescendant={open ? `${listId}-${highlight}` : undefined}
              role={mentionables.length > 0 ? "combobox" : undefined}
              placeholder={meta.placeholder}
              value={body}
              disabled={busy}
              rows={4}
              onChange={(event) => {
                const el = event.target as HTMLTextAreaElement;
                setBody(el.value);
                updateMention(el.value, el.selectionStart ?? el.value.length);
              }}
              onKeyDown={onKeyDown}
              onClick={(event) => {
                const el = event.target as HTMLTextAreaElement;
                updateMention(el.value, el.selectionStart ?? 0);
              }}
              sx={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                minHeight: "96px",
                resize: "vertical",
                p: "12px",
                font: "inherit",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "inherit",
                backgroundColor: "var(--cn-color-surface, #ffffff)",
                border: "1px solid var(--cn-color-border-strong, var(--cn-color-border, #dde0e4))",
                borderRadius: "var(--cn-radius-sm, 6px)",
                outline: "none",
                "&::placeholder": { color: "var(--cn-color-text-subtle, #8a919b)", opacity: 1 },
                "&:focus": {
                  borderColor: "var(--cn-color-brand-600, #254d87)",
                  boxShadow: "var(--cn-shadow-focus, 0 0 0 3px rgba(61, 90, 254, 0.35))",
                },
                "&:disabled": {
                  backgroundColor: "var(--cn-color-disabled-bg, #f4f5f7)",
                  color: "var(--cn-color-disabled-text, #8a919b)",
                },
              }}
            />
            <Popper
              open={open}
              anchorEl={textareaRef.current}
              placement="bottom-start"
              sx={{ zIndex: 1300 }}
            >
              <ClickAwayListener onClickAway={() => setMention(null)}>
                <Paper
                  elevation={0}
                  sx={{
                    mt: "4px",
                    minWidth: "240px",
                    maxWidth: "min(320px, 90vw)",
                    border: "1px solid var(--cn-color-border, #dde0e4)",
                    borderRadius: "var(--cn-radius-md, 8px)",
                    boxShadow: "var(--cn-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12))",
                    backgroundColor: "var(--cn-color-surface-elevated, #ffffff)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="ul"
                    role="listbox"
                    id={listId}
                    aria-label="Personas"
                    sx={{ m: 0, p: "4px", listStyle: "none" }}
                  >
                    {suggestions.map((person, index) => (
                      <Box
                        component="li"
                        key={person.id}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={index === highlight}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          pickMention(person);
                        }}
                        onMouseEnter={() => setHighlight(index)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          p: "8px",
                          borderRadius: "var(--cn-radius-sm, 4px)",
                          cursor: "pointer",
                          backgroundColor:
                            index === highlight ? "var(--cn-color-hover, #f4f5f7)" : undefined,
                          minWidth: 0,
                        }}
                      >
                        <CnAvatar name={person.name} src={person.avatarSrc} size="xs" />
                        <Box sx={{ minWidth: 0 }}>
                          <Box
                            sx={{
                              fontSize: "14px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {person.name}
                          </Box>
                          {person.description && (
                            <Box
                              sx={{
                                fontSize: "12px",
                                color: "var(--cn-color-text-muted, #6e7682)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {person.description}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </ClickAwayListener>
            </Popper>
          </Box>

          {(type === "call" || type === "meeting" || type === "task") && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))",
                gap: "12px",
                minWidth: 0,
              }}
            >
              {type === "call" && (
                <CnSelectField
                  label="Resultado"
                  value={outcome}
                  onChange={(value) => setOutcome(String(value ?? ""))}
                  options={callOutcomes.map((label) => ({ value: label, label }))}
                  disabled={busy}
                  size="sm"
                />
              )}
              {(type === "meeting" || type === "task") && (
                <CnDateField
                  type="datetime"
                  label={type === "task" ? "Vence" : "Fecha y hora"}
                  value={dueAt}
                  onChange={setDueAt}
                  disabled={busy}
                  size="sm"
                />
              )}
              {(type === "call" || type === "meeting") && (
                <CnTextField
                  label="Duración (min)"
                  type="number"
                  value={duration}
                  onChange={setDuration}
                  disabled={busy}
                  size="sm"
                />
              )}
              {type === "task" && (
                <CnSelectField
                  label="Prioridad"
                  value={priority}
                  onChange={(value) =>
                    setPriority((value as "low" | "normal" | "high") || "normal")
                  }
                  options={[
                    { value: "low", label: "Baja" },
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "Alta" },
                  ]}
                  disabled={busy}
                  size="sm"
                />
              )}
            </Box>
          )}

          {error && (
            <Box
              role="alert"
              sx={{
                fontSize: "13px",
                color: "var(--cn-color-error-700, #8f2525)",
                overflowWrap: "anywhere",
              }}
            >
              {error}
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
              minWidth: 0,
            }}
          >
            {typeTemplates.length > 0 && (
              <CnSelectField
                label="Plantilla"
                value=""
                onChange={(value) => {
                  const template = typeTemplates.find((t) => t.id === value);
                  if (template)
                    setBody((current) =>
                      current.trim() ? `${current}\n${template.body}` : template.body,
                    );
                }}
                options={typeTemplates.map((t) => ({ value: t.id, label: t.label }))}
                disabled={busy}
                size="sm"
                sx={{ width: "min(200px, 100%)" }}
              />
            )}
            <Box
              id={`${bodyId}-help`}
              sx={{
                flex: "1 1 160px",
                minWidth: 0,
                fontSize: "12px",
                color: "var(--cn-color-text-muted, #6e7682)",
                overflowWrap: "anywhere",
              }}
            >
              {recordName ? `Se guardará en ${recordName}. ` : ""}Ctrl + Enter para guardar.
            </Box>
            <Box sx={{ display: "flex", gap: "8px", ml: "auto" }}>
              {onCancel && (
                <CnButton variant="text" color="neutral" onClick={onCancel} disabled={saving}>
                  Cancelar
                </CnButton>
              )}
              <CnButton type="submit" variant="contained" disabled={!canSubmit} loading={saving}>
                {meta.submit}
              </CnButton>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);
