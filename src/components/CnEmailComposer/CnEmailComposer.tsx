import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";
import { forwardRef, useState } from "react";
import type { CnFileValue } from "../../utils/file-utils";
import { CnAlert } from "../CnAlert";
import { CnButton } from "../CnButton";
import { CnFileField } from "../CnFileField";
import { CnRichTextField } from "../CnRichTextField";
import { CnSelectField } from "../CnSelectField";
import { CnTagsField } from "../CnTagsField";
import { CnTextField } from "../CnTextField";
import { CnEmailComposerSkeleton } from "./CnEmailComposerSkeleton";
import type { CnEmailVariable } from "./email-utils";
import { fillVariables, isEmail, missingVariables } from "./email-utils";

export type CnEmailDraft = {
  from?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  /** Cuerpo en HTML (lo que produce el editor). */
  body: string;
  attachments: CnFileValue[];
};

export type CnEmailTemplate = {
  id: string;
  name: string;
  subject?: string;
  /** HTML con variables `{{clave}}`. */
  body: string;
};

export type CnEmailComposerProps = {
  /** Borrador controlado. */
  value?: CnEmailDraft;
  defaultValue?: Partial<CnEmailDraft>;
  onChange?: (draft: CnEmailDraft) => void;
  /** Cuentas desde las que se puede enviar. Con una sola, no se muestra el selector. */
  fromOptions?: string[];
  /** Correos sugeridos al escribir destinatarios (contactos). */
  suggestions?: string[];
  templates?: CnEmailTemplate[];
  /** Variables para «Insertar variable», la vista previa y el envío. */
  variables?: CnEmailVariable[];
  /** Envía el correo ya con las variables reemplazadas. Si la promesa falla, se muestra su mensaje. */
  onSend?: (draft: CnEmailDraft) => void | Promise<void>;
  onSaveDraft?: (draft: CnEmailDraft) => void | Promise<void>;
  onDiscard?: () => void;
  /** Adjuntos: tamaño máximo por archivo en MB. */
  maxAttachmentMb?: number;
  disabled?: boolean;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const EMPTY: CnEmailDraft = { to: [], cc: [], bcc: [], subject: "", body: "", attachments: [] };

const validateEmail = (tag: string) => (isEmail(tag) ? null : `«${tag}» no es un correo válido.`);

/** Redactor de correo: destinatarios como chips, CC/CCO, plantillas, variables, vista previa, adjuntos y envío. */
export const CnEmailComposer = forwardRef<HTMLDivElement, CnEmailComposerProps>(
  function CnEmailComposer(
    {
      value: valueProp,
      defaultValue,
      onChange,
      fromOptions,
      suggestions,
      templates,
      variables,
      onSend,
      onSaveDraft,
      onDiscard,
      maxAttachmentMb = 20,
      disabled = false,
      skeleton = false,
      sx,
      className,
    },
    ref,
  ) {
    const [inner, setInner] = useState<CnEmailDraft>(() => ({
      ...EMPTY,
      from: fromOptions?.[0],
      ...defaultValue,
    }));
    const draft = valueProp ?? inner;
    const [showCc, setShowCc] = useState(draft.cc.length > 0);
    const [showBcc, setShowBcc] = useState(draft.bcc.length > 0);
    const [preview, setPreview] = useState(false);
    const [busy, setBusy] = useState<"send" | "draft" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [triedSend, setTriedSend] = useState(false);
    const [menu, setMenu] = useState<{
      anchor: HTMLElement;
      kind: "templates" | "variables";
    } | null>(null);
    // el editor se vuelve a montar al aplicar una plantilla o insertar una variable
    const [bodyKey, setBodyKey] = useState(0);

    if (skeleton) return <CnEmailComposerSkeleton sx={sx} className={className} />;

    const update = (patch: Partial<CnEmailDraft>) => {
      // el editor avisa cambios al montarse aunque el contenido sea el mismo: solo cuentan los reales
      const changed = (Object.keys(patch) as (keyof CnEmailDraft)[]).some(
        (k) => JSON.stringify(patch[k]) !== JSON.stringify(draft[k]),
      );
      if (!changed) return;
      const next = { ...draft, ...patch };
      if (valueProp === undefined) setInner(next);
      onChange?.(next);
      setError(null);
    };

    const resolved = (): CnEmailDraft => ({
      ...draft,
      subject: fillVariables(draft.subject, variables),
      body: fillVariables(draft.body, variables),
    });

    const missing = missingVariables(`${draft.subject} ${draft.body}`, variables);
    const noRecipients = draft.to.length === 0;
    const busyNow = busy !== null;

    const run = async (kind: "send" | "draft") => {
      if (kind === "send") {
        setTriedSend(true);
        if (noRecipients || missing.length) return;
      }
      const handler = kind === "send" ? onSend : onSaveDraft;
      if (!handler) return;
      setBusy(kind);
      setError(null);
      try {
        await handler(kind === "send" ? resolved() : draft);
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : kind === "send"
              ? "No se pudo enviar el correo. Inténtalo de nuevo."
              : "No se pudo guardar el borrador.",
        );
      } finally {
        setBusy(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && onSend && !busyNow) {
        event.preventDefault();
        void run("send");
      }
    };

    const applyTemplate = (t: CnEmailTemplate) => {
      update({ subject: t.subject ?? draft.subject, body: t.body });
      setBodyKey((k) => k + 1);
      setMenu(null);
    };

    const insertVariable = (v: CnEmailVariable) => {
      const token = `{{${v.key}}}`;
      const body = draft.body.trim()
        ? draft.body.replace(/(<\/p>)?\s*$/, (end) =>
            end.startsWith("</p>") ? ` ${token}</p>` : ` ${token}`,
          )
        : `<p>${token}</p>`;
      update({ body });
      setBodyKey((k) => k + 1);
      setMenu(null);
    };

    const toggleSx = {
      px: "8px",
      py: "4px",
      borderRadius: "var(--cn-radius-sm, 6px)",
      fontFamily: "inherit",
      fontSize: "var(--cn-font-size-sm, 12px)",
      fontWeight: 600,
      color: "var(--cn-color-text-muted, #6e7682)",
      "&:hover": { backgroundColor: "var(--cn-color-hover, rgba(0, 0, 0, 0.04))" },
      "&.Mui-focusVisible": {
        outline: "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
      },
    };

    return (
      <Box
        ref={ref}
        component="form"
        aria-label="Redactar correo"
        data-cn-email-composer
        className={className}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void run("send");
        }}
        onKeyDown={onKeyDown}
        sx={[
          {
            minWidth: 0,
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            p: "16px",
            boxSizing: "border-box",
            border: "1px solid var(--cn-color-border, #dde0e4)",
            borderRadius: "var(--cn-radius-lg, 12px)",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            color: "var(--cn-color-text, #222831)",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {fromOptions && fromOptions.length > 1 && (
          <CnSelectField
            label="De"
            size="sm"
            value={draft.from}
            options={fromOptions.map((f) => ({ value: f, label: f }))}
            onChange={(v) => update({ from: v as string })}
            disabled={disabled || busyNow}
          />
        )}

        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px", minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CnTagsField
              label="Para"
              size="sm"
              required
              value={draft.to}
              onChange={(to) => update({ to })}
              validateTag={validateEmail}
              separators={[",", ";", " "]}
              transform="lowercase"
              suggestions={suggestions}
              placeholder="nombre@empresa.mx"
              disabled={disabled || busyNow}
              error={triedSend && noRecipients}
              helperText={
                triedSend && noRecipients ? "Agrega al menos un destinatario." : undefined
              }
            />
          </Box>
          <Box sx={{ display: "flex", gap: "2px", pt: "22px", flex: "none" }}>
            {!showCc && (
              <ButtonBase
                type="button"
                onClick={() => setShowCc(true)}
                sx={toggleSx}
                aria-label="Agregar CC"
              >
                CC
              </ButtonBase>
            )}
            {!showBcc && (
              <ButtonBase
                type="button"
                onClick={() => setShowBcc(true)}
                sx={toggleSx}
                aria-label="Agregar CCO"
              >
                CCO
              </ButtonBase>
            )}
          </Box>
        </Box>

        {showCc && (
          <CnTagsField
            label="CC"
            size="sm"
            autoFocus={draft.cc.length === 0}
            value={draft.cc}
            onChange={(cc) => update({ cc })}
            validateTag={validateEmail}
            separators={[",", ";", " "]}
            transform="lowercase"
            suggestions={suggestions}
            disabled={disabled || busyNow}
          />
        )}
        {showBcc && (
          <CnTagsField
            label="CCO (copia oculta)"
            size="sm"
            autoFocus={draft.bcc.length === 0}
            value={draft.bcc}
            onChange={(bcc) => update({ bcc })}
            validateTag={validateEmail}
            separators={[",", ";", " "]}
            transform="lowercase"
            suggestions={suggestions}
            disabled={disabled || busyNow}
          />
        )}

        <CnTextField
          label="Asunto"
          size="sm"
          value={draft.subject}
          onChange={(subject) => update({ subject: subject ?? "" })}
          disabled={disabled || busyNow}
          helperText={!draft.subject.trim() && triedSend ? "El correo no tiene asunto." : undefined}
        />

        {(templates?.length || variables?.length) && !preview ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {templates && templates.length > 0 && (
              <CnButton
                variant="outlined"
                size="small"
                startIcon="description"
                aria-haspopup="menu"
                disabled={disabled || busyNow}
                onClick={(event) => setMenu({ anchor: event.currentTarget, kind: "templates" })}
              >
                Plantillas
              </CnButton>
            )}
            {variables && variables.length > 0 && (
              <CnButton
                variant="outlined"
                size="small"
                startIcon="data_object"
                aria-haspopup="menu"
                disabled={disabled || busyNow}
                onClick={(event) => setMenu({ anchor: event.currentTarget, kind: "variables" })}
              >
                Insertar variable
              </CnButton>
            )}
          </Box>
        ) : null}

        <Menu
          open={Boolean(menu)}
          anchorEl={menu?.anchor}
          onClose={() => setMenu(null)}
          MenuListProps={{ "aria-label": menu?.kind === "templates" ? "Plantillas" : "Variables" }}
        >
          {menu?.kind === "templates" &&
            templates?.map((t) => (
              <MenuItem
                key={t.id}
                onClick={() => applyTemplate(t)}
                sx={{ fontSize: "14px", maxWidth: 360, whiteSpace: "normal" }}
              >
                {t.name}
              </MenuItem>
            ))}
          {menu?.kind === "variables" &&
            variables?.map((v) => (
              <MenuItem
                key={v.key}
                onClick={() => insertVariable(v)}
                sx={{ fontSize: "14px", gap: "12px", justifyContent: "space-between" }}
              >
                {v.label}
                <Box
                  component="code"
                  sx={{ fontSize: "12px", color: "var(--cn-color-text-muted, #6e7682)" }}
                >
                  {`{{${v.key}}}`}
                </Box>
              </MenuItem>
            ))}
        </Menu>

        {preview ? (
          <Box
            aria-label="Vista previa del correo"
            role="region"
            sx={{
              border: "1px solid var(--cn-color-border, #dde0e4)",
              borderRadius: "var(--cn-radius-md, 8px)",
              p: "12px",
              minWidth: 0,
              display: "grid",
              gap: "8px",
            }}
          >
            <Box
              sx={{
                fontSize: "var(--cn-font-size-sm, 12px)",
                color: "var(--cn-color-text-muted, #6e7682)",
                overflowWrap: "anywhere",
              }}
            >
              Para: {draft.to.join(", ") || "—"}
            </Box>
            <Box sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
              {fillVariables(draft.subject, variables) || "(Sin asunto)"}
            </Box>
            <CnRichTextField
              key={`p-${bodyKey}`}
              readOnly
              toolbar={[]}
              value={fillVariables(draft.body, variables)}
            />
          </Box>
        ) : (
          <CnRichTextField
            key={bodyKey}
            label="Mensaje"
            value={draft.body}
            onChange={(body) => update({ body: body ?? "" })}
            minHeight={160}
            maxHeight={420}
            disabled={disabled || busyNow}
          />
        )}

        {missing.length > 0 && (triedSend || preview) && (
          <CnAlert
            severity="warning"
            message={`Faltan valores para: ${missing.map((k) => `{{${k}}}`).join(", ")}. Complétalos o quita esas variables antes de enviar.`}
          />
        )}

        <CnFileField
          label="Adjuntos"
          variant="compact"
          multiple
          maxSize={maxAttachmentMb}
          sizeUnit="MB"
          value={draft.attachments}
          onChange={(files) => update({ attachments: (files as CnFileValue[] | undefined) ?? [] })}
          disabled={disabled || busyNow}
        />

        {error && <CnAlert severity="error" message={error} />}

        <Box
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", pt: "4px" }}
        >
          {onSend && (
            <CnButton
              type="submit"
              loading={busy === "send"}
              disabled={disabled || (busyNow && busy !== "send")}
              startIcon="send"
            >
              Enviar
            </CnButton>
          )}
          {onSaveDraft && (
            <CnButton
              variant="outlined"
              loading={busy === "draft"}
              disabled={disabled || (busyNow && busy !== "draft")}
              onClick={() => void run("draft")}
            >
              Guardar borrador
            </CnButton>
          )}
          <CnButton
            variant="text"
            startIcon="visibility"
            aria-pressed={preview}
            onClick={() => setPreview((p) => !p)}
            disabled={busyNow}
          >
            {preview ? "Editar" : "Vista previa"}
          </CnButton>
          <Box sx={{ flex: 1 }} />
          {onSend && (
            <Box
              component="span"
              sx={{
                fontSize: "var(--cn-font-size-xs, 11px)",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              Ctrl + Intro para enviar
            </Box>
          )}
          {onDiscard && (
            <CnButton
              variant="text"
              color="error"
              iconOnly
              icon="delete_outline"
              label="Descartar correo"
              onClick={onDiscard}
              disabled={busyNow}
            />
          )}
        </Box>
      </Box>
    );
  },
);
