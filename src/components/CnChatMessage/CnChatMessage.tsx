import Box from "@mui/material/Box";
import { visuallyHiddenSx } from "../../utils/tones";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useId, useState } from "react";
import { CnAvatar } from "../CnAvatar";
import { CnIcon } from "../CnIcon";
import { CnChatMessageSkeleton } from "./CnChatMessageSkeleton";

export type CnChatMessageStatus = "sending" | "sent" | "delivered" | "read" | "error";

export type CnChatAttachment = {
  id: string;
  name: string;
  url?: string;
  /** Tamaño en bytes. */
  size?: number;
};

export type CnChatMessageAction = {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  onClick?: () => void;
};

export type CnChatAuthor = { name: string; avatarSrc?: string };

export type CnChatMessageProps = {
  /** Contenido. Un texto conserva sus saltos de línea. */
  children?: ReactNode;
  author?: CnChatAuthor;
  /** Mensaje propio: va a la derecha, con otro color y sin nombre. */
  own?: boolean;
  /** `system` es un aviso centrado del sistema («Lucía se unió»). */
  variant?: "bubble" | "system";
  time?: Date | string;
  /** Estado de envío de un mensaje propio. */
  status?: CnChatMessageStatus;
  /** Con `status="error"`, muestra «Reintentar». */
  onRetry?: () => void;
  attachments?: CnChatAttachment[];
  /** Acciones del mensaje (responder, copiar, borrar…) en un menú. */
  actions?: CnChatMessageAction[];
  /** Continúa al mensaje anterior del mismo autor: sin avatar ni nombre y más pegado. */
  grouped?: boolean;
  edited?: boolean;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const STATUS: Record<CnChatMessageStatus, { icon: string; label: string }> = {
  sending: { icon: "schedule", label: "Enviando" },
  sent: { icon: "check", label: "Enviado" },
  delivered: { icon: "done_all", label: "Entregado" },
  read: { icon: "done_all", label: "Leído" },
  error: { icon: "error_outline", label: "No se envió" },
};

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

/** Hora corta (`10:42`) y fecha completa para el tooltip. */
export const formatChatTime = (value: Date | string) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return { short: String(value), full: String(value) };
  return {
    short: new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(date),
    full: new Intl.DateTimeFormat("es-MX", { dateStyle: "full", timeStyle: "short" }).format(date),
  };
};

const formatSize = (bytes?: number) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AVATAR = 32;

/** Mensaje de chat: burbuja con autor, hora, estado de envío, adjuntos y acciones; o aviso del sistema. */
export const CnChatMessage = forwardRef<HTMLDivElement, CnChatMessageProps>(function CnChatMessage(
  {
    children,
    author,
    own = false,
    variant = "bubble",
    time,
    status,
    onRetry,
    attachments,
    actions,
    grouped = false,
    edited = false,
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const uid = useId();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  if (skeleton) return <CnChatMessageSkeleton own={own} sx={sx} className={className} />;

  const t = time ? formatChatTime(time) : null;
  const sx_ = Array.isArray(sx) ? sx : [sx];

  if (variant === "system")
    return (
      <Box
        ref={ref}
        role="note"
        data-cn-chat-message="system"
        className={className}
        sx={[
          {
            display: "flex",
            justifyContent: "center",
            my: "8px",
            minWidth: 0,
          },
          ...sx_,
        ]}
      >
        <Box
          sx={{
            maxWidth: "min(100%, 520px)",
            px: "12px",
            py: "4px",
            borderRadius: "999px",
            fontSize: "var(--cn-font-size-sm, 12px)",
            textAlign: "center",
            overflowWrap: "anywhere",
            color: "var(--cn-color-text-muted, #6e7682)",
            backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)",
          }}
        >
          {children}
          {t && <Box component="span"> · {t.short}</Box>}
        </Box>
      </Box>
    );

  const isError = status === "error";
  const label = [own ? "Tú" : author?.name, t?.short, status ? STATUS[status].label : null]
    .filter(Boolean)
    .join(", ");

  return (
    <Box
      ref={ref}
      component="article"
      aria-label={label || undefined}
      data-cn-chat-message={own ? "own" : "other"}
      className={className}
      sx={[
        {
          display: "flex",
          flexDirection: own ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: "8px",
          mt: grouped ? "2px" : "12px",
          minWidth: 0,
          "&:hover [data-cn-chat-actions], &:focus-within [data-cn-chat-actions]": { opacity: 1 },
        },
        ...sx_,
      ]}
    >
      {!own && (
        <Box sx={{ width: AVATAR, flex: "none" }}>
          {!grouped && author && (
            <CnAvatar name={author.name} src={author.avatarSrc} size={AVATAR} />
          )}
        </Box>
      )}

      <Box
        sx={{
          minWidth: 0,
          maxWidth: "min(78%, 640px)",
          display: "flex",
          flexDirection: "column",
          alignItems: own ? "flex-end" : "flex-start",
        }}
      >
        {!own && !grouped && author && (
          <Box
            sx={{
              mb: "2px",
              px: "4px",
              fontSize: "var(--cn-font-size-sm, 12px)",
              fontWeight: 600,
              color: "var(--cn-color-text-muted, #6e7682)",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {author.name}
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: own ? "row-reverse" : "row",
            alignItems: "center",
            gap: "4px",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              px: "12px",
              py: "8px",
              borderRadius: "16px",
              borderBottomRightRadius: own ? "4px" : "16px",
              borderBottomLeftRadius: own ? "16px" : "4px",
              fontSize: "var(--cn-font-size-md, 14px)",
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              color: "var(--cn-color-text, #222831)",
              backgroundColor: own
                ? "var(--cn-color-tone-primary-soft, var(--cn-color-surface-sunken, #f4f5f7))"
                : "var(--cn-color-surface, #ffffff)",
              border: own ? "1px solid transparent" : "1px solid var(--cn-color-border, #dde0e4)",
              opacity: status === "sending" ? 0.7 : 1,
              ...(isError && {
                borderColor: "var(--cn-color-field-error, var(--cn-color-error-500, #d63c3c))",
              }),
            }}
          >
            {children}
            {attachments && attachments.length > 0 && (
              <Box
                component="ul"
                aria-label="Adjuntos"
                sx={{
                  listStyle: "none",
                  m: 0,
                  p: 0,
                  mt: children ? "8px" : 0,
                  display: "grid",
                  gap: "4px",
                }}
              >
                {attachments.map((file) => (
                  <Box component="li" key={file.id} sx={{ minWidth: 0 }}>
                    <Box
                      component={file.url ? "a" : "span"}
                      {...(file.url
                        ? {
                            href: file.url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            download: file.name,
                          }
                        : {})}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: 0,
                        px: "8px",
                        py: "6px",
                        borderRadius: "var(--cn-radius-md, 8px)",
                        textDecoration: "none",
                        color: "inherit",
                        backgroundColor: "var(--cn-color-hover, rgba(0, 0, 0, 0.04))",
                        "&:focus-visible": {
                          outline:
                            "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
                        },
                      }}
                    >
                      <CnIcon
                        name="attach_file"
                        size={18}
                        sx={{ flex: "none", color: "var(--cn-color-text-muted, #6e7682)" }}
                      />
                      <Box
                        component="span"
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}
                      >
                        {file.name}
                      </Box>
                      {file.size != null && (
                        <Box
                          component="span"
                          sx={{
                            flex: "none",
                            fontSize: "var(--cn-font-size-xs, 11px)",
                            color: "var(--cn-color-text-muted, #6e7682)",
                          }}
                        >
                          {formatSize(file.size)}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {actions && actions.length > 0 && (
            <>
              <IconButton
                data-cn-chat-actions
                size="small"
                aria-label="Acciones del mensaje"
                aria-haspopup="menu"
                aria-expanded={Boolean(menuAnchor)}
                aria-controls={menuAnchor ? `${uid}-menu` : undefined}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                sx={{
                  flex: "none",
                  opacity: menuAnchor ? 1 : 0,
                  color: "var(--cn-color-text-muted, #6e7682)",
                  transition: "opacity 120ms ease",
                  "@media (hover: none)": { opacity: 1 },
                  "&.Mui-focusVisible": { opacity: 1 },
                }}
              >
                <CnIcon name="more_vert" size={18} />
              </IconButton>
              <Menu
                id={`${uid}-menu`}
                open={Boolean(menuAnchor)}
                anchorEl={menuAnchor}
                onClose={() => setMenuAnchor(null)}
                MenuListProps={{ "aria-label": "Acciones del mensaje" }}
              >
                {actions.map((action) => (
                  <MenuItem
                    key={action.id}
                    onClick={() => {
                      setMenuAnchor(null);
                      action.onClick?.();
                    }}
                    sx={{
                      gap: "10px",
                      fontSize: "14px",
                      ...(action.danger && {
                        color:
                          "var(--cn-color-control-error-fg, var(--cn-color-error-600, #b52f2f))",
                      }),
                    }}
                  >
                    {action.icon && <CnIcon name={action.icon} size={18} />}
                    {action.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>

        {(t || status || edited) && (
          <Box
            sx={{
              mt: "2px",
              px: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "var(--cn-font-size-xs, 11px)",
              color: isError
                ? "var(--cn-color-field-error, var(--cn-color-error-500, #d63c3c))"
                : "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            {edited && <span>Editado ·</span>}
            {t && (
              <Box
                component="time"
                dateTime={time ? toDate(time).toISOString?.() : undefined}
                title={t.full}
              >
                {t.short}
              </Box>
            )}
            {status && status !== "error" && (
              <Box component="span" sx={visuallyHiddenSx}>
                {STATUS[status].label}
              </Box>
            )}
            {status && (
              <CnIcon
                name={STATUS[status].icon}
                size={14}
                sx={{
                  color:
                    status === "read"
                      ? "var(--cn-color-control-info-fg, var(--cn-color-text-muted, #6e7682))"
                      : "inherit",
                }}
              />
            )}
            {isError && (
              <>
                <span>{STATUS.error.label}</span>
                {onRetry && (
                  <ButtonBase
                    type="button"
                    onClick={onRetry}
                    sx={{
                      ml: "4px",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      fontWeight: 600,
                      textDecoration: "underline",
                      color: "inherit",
                      borderRadius: "4px",
                      "&.Mui-focusVisible": {
                        outline:
                          "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
                      },
                    }}
                  >
                    Reintentar
                  </ButtonBase>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
});
