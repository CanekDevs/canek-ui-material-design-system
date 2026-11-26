import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent, ReactNode } from "react";
import { Fragment, forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CnChatMessage } from "../CnChatMessage";
import type {
  CnChatAttachment,
  CnChatAuthor,
  CnChatMessageAction,
  CnChatMessageStatus,
} from "../CnChatMessage";
import { CnIcon } from "../CnIcon";
import { CnChatThreadSkeleton } from "./CnChatThreadSkeleton";
import { continuesPrevious, dayLabel, sameDay } from "./thread-utils";

export type CnChatThreadMessage = {
  id: string;
  /** Id del autor en `participants`. Sin autor (o `variant: "system"`) es un aviso del sistema. */
  authorId?: string;
  content: ReactNode;
  time: Date | string;
  status?: CnChatMessageStatus;
  attachments?: CnChatAttachment[];
  variant?: "bubble" | "system";
  edited?: boolean;
};

export type CnChatThreadProps = {
  messages: CnChatThreadMessage[];
  /** Autores por id. */
  participants: Record<string, CnChatAuthor>;
  /** Id del usuario actual: sus mensajes van a la derecha. */
  currentUserId?: string;
  /** Acciones por mensaje (responder, copiar, borrar…). */
  messageActions?: (message: CnChatThreadMessage) => CnChatMessageAction[] | undefined;
  onRetry?: (message: CnChatThreadMessage) => void;
  /** Nombres de quienes están escribiendo. */
  typing?: string[];
  /** Hay mensajes anteriores que se pueden cargar. */
  hasOlder?: boolean;
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
  /** Redactor integrado: Intro envía, Mayús + Intro hace un salto de línea. */
  onSend?: (text: string) => void | Promise<void>;
  /** Redactor propio en lugar del integrado. */
  composer?: ReactNode;
  composerPlaceholder?: string;
  /** Texto con la conversación vacía. */
  emptyText?: ReactNode;
  /** Mensajes del mismo autor dentro de esta ventana (ms) se agrupan. */
  groupWindowMs?: number;
  /** Alto del hilo (la lista tiene su propio scroll). */
  height?: string | number;
  /** Fecha de referencia para «Hoy» y «Ayer». */
  now?: Date;
  ariaLabel?: string;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const NEAR_BOTTOM = 80;

const typingText = (names: string[]) =>
  names.length === 1
    ? `${names[0]} está escribiendo…`
    : names.length === 2
      ? `${names[0]} y ${names[1]} están escribiendo…`
      : `${names.length} personas están escribiendo…`;

/** Hilo de conversación: mensajes por día, agrupados por autor, anclado al final, con mensajes anteriores, «escribiendo» y redactor. */
export const CnChatThread = forwardRef<HTMLDivElement, CnChatThreadProps>(function CnChatThread(
  {
    messages,
    participants,
    currentUserId,
    messageActions,
    onRetry,
    typing,
    hasOlder = false,
    onLoadOlder,
    loadingOlder = false,
    onSend,
    composer,
    composerPlaceholder = "Escribe un mensaje…",
    emptyText = "Todavía no hay mensajes. Escribe el primero.",
    groupWindowMs = 5 * 60_000,
    height = 560,
    now,
    ariaLabel = "Conversación",
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const atBottom = useRef(true);
  const [unseen, setUnseen] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const lastId = messages[messages.length - 1]?.id;
  const firstId = messages[0]?.id;
  const prevFirst = useRef(firstId);
  const prevHeight = useRef(0);

  // al llegar mensajes nuevos: si estaba al final, se queda al final; si no, se cuentan
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (firstId !== prevFirst.current && prevHeight.current) {
      // se cargaron mensajes anteriores arriba: se conserva la posición
      el.scrollTop += el.scrollHeight - prevHeight.current;
    } else if (atBottom.current) {
      el.scrollTop = el.scrollHeight;
    } else {
      setUnseen((n) => n + 1);
    }
    prevFirst.current = firstId;
    prevHeight.current = el.scrollHeight;
  }, [lastId, firstId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  if (skeleton) return <CnChatThreadSkeleton height={height} sx={sx} className={className} />;

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    if (atBottom.current && unseen) setUnseen(0);
    prevHeight.current = el.scrollHeight;
  };

  const toBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTo?.({ top: el.scrollHeight, behavior: "smooth" });
    if (el && !el.scrollTo) el.scrollTop = el.scrollHeight;
    atBottom.current = true;
    setUnseen(0);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !onSend || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft("");
      atBottom.current = true;
    } finally {
      setSending(false);
    }
  };

  const onComposerKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <Box
      ref={ref}
      data-cn-chat-thread
      className={className}
      sx={[
        {
          position: "relative",
          height,
          minWidth: 0,
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--cn-color-bg, #fafbfc)",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-lg, 12px)",
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        ref={listRef}
        role="log"
        aria-label={ariaLabel}
        aria-live="polite"
        aria-busy={loadingOlder || undefined}
        tabIndex={0}
        onScroll={onScroll}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: "16px",
          pb: "12px",
          "&:focus-visible": {
            outline: "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
            outlineOffset: "-2px",
          },
        }}
      >
        {hasOlder && onLoadOlder && (
          <Box sx={{ display: "flex", justifyContent: "center", pt: "12px" }}>
            <ButtonBase
              type="button"
              onClick={onLoadOlder}
              disabled={loadingOlder}
              sx={{
                gap: "8px",
                px: "12px",
                py: "6px",
                borderRadius: "999px",
                fontFamily: "inherit",
                fontSize: "var(--cn-font-size-sm, 12px)",
                fontWeight: 600,
                color: "var(--cn-color-text-muted, #6e7682)",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                backgroundColor: "var(--cn-color-surface, #ffffff)",
                "&.Mui-focusVisible": {
                  outline:
                    "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
                },
              }}
            >
              {loadingOlder && <CircularProgress size={12} aria-hidden />}
              {loadingOlder ? "Cargando mensajes anteriores…" : "Ver mensajes anteriores"}
            </ButtonBase>
          </Box>
        )}

        {messages.length === 0 && !loadingOlder && (
          <Box
            sx={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              color: "var(--cn-color-text-muted, #6e7682)",
              fontSize: "14px",
              px: "16px",
              overflowWrap: "anywhere",
            }}
          >
            {emptyText}
          </Box>
        )}

        {messages.map((message, i) => {
          const previous = messages[i - 1];
          const newDay = !previous || !sameDay(previous.time, message.time);
          const system = message.variant === "system" || !message.authorId;
          const grouped =
            !newDay &&
            continuesPrevious(
              previous && { ...previous, variant: previous.authorId ? previous.variant : "system" },
              { ...message, variant: system ? "system" : message.variant },
              groupWindowMs,
            );
          return (
            <Fragment key={message.id}>
              {newDay && (
                <Box
                  role="separator"
                  aria-label={dayLabel(message.time, now)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    mt: "16px",
                    mb: "4px",
                    fontSize: "var(--cn-font-size-xs, 11px)",
                    fontWeight: 600,
                    color: "var(--cn-color-text-muted, #6e7682)",
                    "&::before, &::after": {
                      content: '""',
                      flex: 1,
                      height: "1px",
                      backgroundColor: "var(--cn-color-border, #dde0e4)",
                    },
                  }}
                >
                  {dayLabel(message.time, now)}
                </Box>
              )}
              <CnChatMessage
                variant={system ? "system" : "bubble"}
                author={message.authorId ? participants[message.authorId] : undefined}
                own={Boolean(currentUserId) && message.authorId === currentUserId}
                time={message.time}
                status={message.status}
                onRetry={onRetry ? () => onRetry(message) : undefined}
                attachments={message.attachments}
                actions={messageActions?.(message)}
                grouped={grouped}
                edited={message.edited}
              >
                {message.content}
              </CnChatMessage>
            </Fragment>
          );
        })}

        {typing && typing.length > 0 && (
          <Box
            sx={{
              mt: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "var(--cn-font-size-sm, 12px)",
              color: "var(--cn-color-text-muted, #6e7682)",
            }}
          >
            <Box
              aria-hidden
              sx={{
                display: "inline-flex",
                gap: "3px",
                "& span": {
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: "currentColor",
                  animation: "cn-typing 1.2s infinite ease-in-out",
                },
                "& span:nth-of-type(2)": { animationDelay: "0.15s" },
                "& span:nth-of-type(3)": { animationDelay: "0.3s" },
                "@keyframes cn-typing": {
                  "0%, 80%, 100%": { opacity: 0.3 },
                  "40%": { opacity: 1 },
                },
                "@media (prefers-reduced-motion: reduce)": { "& span": { animation: "none" } },
              }}
            >
              <span />
              <span />
              <span />
            </Box>
            {typingText(typing)}
          </Box>
        )}
      </Box>

      {unseen > 0 && (
        <ButtonBase
          type="button"
          onClick={toBottom}
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: onSend || composer ? 76 : 16,
            gap: "6px",
            px: "12px",
            py: "6px",
            borderRadius: "999px",
            fontFamily: "inherit",
            fontSize: "var(--cn-font-size-sm, 12px)",
            fontWeight: 600,
            color: "var(--cn-color-text, #222831)",
            backgroundColor: "var(--cn-color-surface-elevated, #ffffff)",
            boxShadow: "var(--cn-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12))",
            "&.Mui-focusVisible": {
              outline:
                "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
            },
          }}
        >
          <CnIcon name="arrow_downward" size={16} />
          {unseen === 1 ? "1 mensaje nuevo" : `${unseen} mensajes nuevos`}
        </ButtonBase>
      )}

      {composer ??
        (onSend && (
          <Box
            sx={{
              flex: "none",
              display: "flex",
              alignItems: "flex-end",
              gap: "8px",
              p: "8px 8px 8px 16px",
              borderTop: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
            }}
          >
            <InputBase
              multiline
              maxRows={6}
              fullWidth
              value={draft}
              placeholder={composerPlaceholder}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onComposerKey}
              inputProps={{ "aria-label": composerPlaceholder }}
              sx={{
                minWidth: 0,
                py: "8px",
                fontSize: "var(--cn-font-size-md, 14px)",
                color: "var(--cn-color-text, #222831)",
                "& textarea::placeholder": {
                  color: "var(--cn-color-text-muted, #6e7682)",
                  opacity: 1,
                },
              }}
            />
            <IconButton
              aria-label="Enviar mensaje"
              onClick={() => void send()}
              disabled={!draft.trim() || sending}
              sx={{
                flex: "none",
                width: 40,
                height: 40,
                color: "var(--cn-color-control-primary-fg, var(--cn-color-text, #222831))",
                "&.Mui-focusVisible": {
                  outline:
                    "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
                },
              }}
            >
              {sending ? (
                <CircularProgress size={18} aria-hidden />
              ) : (
                <CnIcon name="send" size={20} />
              )}
            </IconButton>
          </Box>
        ))}
    </Box>
  );
});
