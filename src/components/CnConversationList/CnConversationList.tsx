import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";
import { forwardRef, useId, useMemo, useRef, useState } from "react";
import { normalizeSearchText } from "../../utils/option-filter";
import { visuallyHiddenSx } from "../../utils/tones";
import { CnAvatar } from "../CnAvatar";
import { CnIcon } from "../CnIcon";
import { CnConversationListSkeleton } from "./CnConversationListSkeleton";

export type CnConversation = {
  id: string;
  title: string;
  /** Último mensaje o resumen. */
  preview?: string;
  /** Persona o equipo (se usa para el avatar). Sin él, el avatar sale del título. */
  avatar?: { name: string; src?: string };
  /** Fecha del último movimiento: ordena y agrupa. */
  time?: Date | string;
  unread?: number;
  pinned?: boolean;
  muted?: boolean;
};

export type CnConversationListProps = {
  conversations: CnConversation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Activa «Fijar / Quitar de fijadas». */
  onPinChange?: (id: string, pinned: boolean) => void;
  /** Activa «Renombrar» (edición en la misma fila: Intro guarda, Escape cancela). */
  onRename?: (id: string, title: string) => void;
  /** Activa «Borrar». Pide la confirmación en tu app si hace falta. */
  onDelete?: (id: string) => void;
  /** Muestra la búsqueda arriba. */
  searchable?: boolean;
  /** Búsqueda controlada (p. ej. para buscar en el servidor). */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Agrupa por fecha (Fijadas, Hoy, Ayer, Últimos 7 días, Anteriores). */
  groupByDate?: boolean;
  /** Fecha de referencia para los grupos. */
  now?: Date;
  emptyText?: string;
  ariaLabel?: string;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

type Bucket = "Fijadas" | "Hoy" | "Ayer" | "Últimos 7 días" | "Anteriores" | "Sin fecha";
const BUCKETS: Bucket[] = ["Fijadas", "Hoy", "Ayer", "Últimos 7 días", "Anteriores", "Sin fecha"];

export const conversationBucket = (c: CnConversation, now: Date): Bucket => {
  if (c.pinned) return "Fijadas";
  if (!c.time) return "Sin fecha";
  const d = toDate(c.time);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return "Últimos 7 días";
  return "Anteriores";
};

/** Hora si es de hoy, «Ayer», o fecha corta. */
const shortTime = (value: Date | string | undefined, now: Date) => {
  if (!value) return "";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days <= 0)
    return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(d);
  if (days === 1) return "Ayer";
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(d);
};

const byTimeDesc = (a: CnConversation, b: CnConversation) =>
  (b.time ? toDate(b.time).getTime() : 0) - (a.time ? toDate(a.time).getTime() : 0);

/** Lista de conversaciones agrupada por fecha, con búsqueda, no leídos, fijar, renombrar y borrar. */
export const CnConversationList = forwardRef<HTMLDivElement, CnConversationListProps>(
  function CnConversationList(
    {
      conversations,
      selectedId,
      onSelect,
      onPinChange,
      onRename,
      onDelete,
      searchable = true,
      query: queryProp,
      onQueryChange,
      groupByDate = true,
      now: nowProp,
      emptyText = "No hay conversaciones.",
      ariaLabel = "Conversaciones",
      skeleton = false,
      sx,
      className,
    },
    ref,
  ) {
    const uid = useId();
    const now = useMemo(() => nowProp ?? new Date(), [nowProp]);
    const [innerQuery, setInnerQuery] = useState("");
    const query = queryProp ?? innerQuery;
    const [menu, setMenu] = useState<{ anchor: HTMLElement; id: string } | null>(null);
    const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
    // «Renombrar» desde el menú: la edición se abre cuando el menú terminó de cerrarse
    // (si no, el menú devuelve el foco a su botón y el campo se cierra al perderlo)
    const pendingRename = useRef<{ id: string; value: string } | null>(null);

    const setQuery = (next: string) => {
      if (queryProp === undefined) setInnerQuery(next);
      onQueryChange?.(next);
    };

    const groups = useMemo(() => {
      const q = normalizeSearchText(query);
      const tokens = q.split(/\s+/).filter(Boolean);
      const filtered = conversations.filter((c) => {
        if (!tokens.length) return true;
        const hay = normalizeSearchText(`${c.title} ${c.preview ?? ""} ${c.avatar?.name ?? ""}`);
        return tokens.every((t) => hay.includes(t));
      });
      const sorted = [...filtered].sort(byTimeDesc);
      if (!groupByDate) return [{ name: "", items: sorted }];
      const map = new Map<Bucket, CnConversation[]>();
      for (const c of sorted) {
        const b = conversationBucket(c, now);
        if (!map.has(b)) map.set(b, []);
        map.get(b)?.push(c);
      }
      return BUCKETS.filter((b) => map.has(b)).map((b) => ({ name: b, items: map.get(b) ?? [] }));
    }, [conversations, query, groupByDate, now]);

    const total = groups.reduce((n, g) => n + g.items.length, 0);

    if (skeleton)
      return <CnConversationListSkeleton searchable={searchable} sx={sx} className={className} />;

    const hasMenu = Boolean(onPinChange || onRename || onDelete);
    const menuItem = conversations.find((c) => c.id === menu?.id);

    const onListKey = (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (!target.hasAttribute("data-cn-conversation")) return;
      const items = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>("[data-cn-conversation]"),
      );
      const i = items.indexOf(target);
      const go = (n: number) => items[(n + items.length) % items.length]?.focus();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        go(i + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        go(i - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0);
      } else if (event.key === "End") {
        event.preventDefault();
        go(items.length - 1);
      } else if (event.key === "F2" && onRename) {
        const id = target.getAttribute("data-cn-conversation") ?? "";
        const c = conversations.find((x) => x.id === id);
        if (c) {
          event.preventDefault();
          setRenaming({ id, value: c.title });
        }
      }
    };

    const commitRename = () => {
      if (!renaming) return;
      const title = renaming.value.trim();
      const current = conversations.find((c) => c.id === renaming.id);
      if (title && current && title !== current.title) onRename?.(renaming.id, title);
      setRenaming(null);
    };

    return (
      <Box
        ref={ref}
        data-cn-conversation-list
        className={className}
        sx={[
          {
            minWidth: 0,
            maxWidth: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--cn-color-surface, #ffffff)",
            color: "var(--cn-color-text, #222831)",
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {searchable && (
          <Box
            sx={{
              flex: "none",
              p: "8px",
              borderBottom: "1px solid var(--cn-color-border, #dde0e4)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: 36,
                px: "10px",
                borderRadius: "var(--cn-radius-md, 8px)",
                backgroundColor: "var(--cn-color-surface-sunken, #f4f5f7)",
                "&:focus-within": {
                  outline:
                    "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
                },
              }}
            >
              <CnIcon
                name="search"
                size={18}
                sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}
              />
              <InputBase
                fullWidth
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar conversaciones"
                inputProps={{ "aria-label": "Buscar conversaciones", type: "search" }}
                sx={{ minWidth: 0, fontSize: "var(--cn-font-size-md, 14px)", color: "inherit" }}
              />
            </Box>
          </Box>
        )}

        <Box
          component="nav"
          aria-label={ariaLabel}
          onKeyDown={onListKey}
          sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: "4px 8px 8px" }}
        >
          {total === 0 && (
            <Box
              sx={{
                py: "32px",
                px: "16px",
                textAlign: "center",
                fontSize: "14px",
                color: "var(--cn-color-text-muted, #6e7682)",
                overflowWrap: "anywhere",
              }}
            >
              {query.trim() ? `Sin conversaciones para «${query.trim()}».` : emptyText}
            </Box>
          )}
          {groups.map((group) => {
            const headingId = `${uid}-${group.name || "todas"}`;
            return (
              <Box key={group.name || "todas"} sx={{ mt: "8px" }}>
                {group.name && (
                  <Box
                    id={headingId}
                    sx={{
                      px: "8px",
                      py: "4px",
                      fontSize: "var(--cn-font-size-xs, 11px)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--cn-color-text-muted, #6e7682)",
                    }}
                  >
                    {group.name}
                  </Box>
                )}
                <Box
                  component="ul"
                  aria-labelledby={group.name ? headingId : undefined}
                  sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: "2px" }}
                >
                  {group.items.map((c) => {
                    const selected = c.id === selectedId;
                    const unread = (c.unread ?? 0) > 0;
                    const isRenaming = renaming?.id === c.id;
                    return (
                      <Box
                        component="li"
                        key={c.id}
                        sx={{
                          position: "relative",
                          minWidth: 0,
                          "& [data-cn-conversation-menu]": { opacity: menu?.id === c.id ? 1 : 0 },
                          "&:hover [data-cn-conversation-menu], &:focus-within [data-cn-conversation-menu]":
                            { opacity: 1 },
                        }}
                      >
                        {isRenaming ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              minHeight: 60,
                              px: "8px",
                            }}
                          >
                            <InputBase
                              autoFocus
                              fullWidth
                              value={renaming.value}
                              onChange={(event) =>
                                setRenaming({ id: c.id, value: event.target.value })
                              }
                              onBlur={commitRename}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  commitRename();
                                } else if (event.key === "Escape") {
                                  event.preventDefault();
                                  setRenaming(null);
                                }
                              }}
                              inputProps={{ "aria-label": `Nuevo nombre para ${c.title}` }}
                              sx={{
                                minWidth: 0,
                                px: "8px",
                                height: 36,
                                fontSize: "var(--cn-font-size-md, 14px)",
                                borderRadius: "var(--cn-radius-md, 8px)",
                                border:
                                  "1px solid var(--cn-color-field-accent, var(--cn-color-brand-500, #3562a6))",
                                color: "inherit",
                              }}
                            />
                          </Box>
                        ) : (
                          <ButtonBase
                            data-cn-conversation={c.id}
                            aria-current={selected ? "true" : undefined}
                            onClick={() => onSelect?.(c.id)}
                            sx={{
                              width: "100%",
                              minWidth: 0,
                              minHeight: 60,
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              px: "8px",
                              pr: hasMenu ? "40px" : "8px",
                              py: "8px",
                              textAlign: "left",
                              fontFamily: "inherit",
                              borderRadius: "var(--cn-radius-md, 8px)",
                              color: "inherit",
                              backgroundColor: selected
                                ? "var(--cn-color-tone-primary-soft, var(--cn-color-active, rgba(0, 0, 0, 0.08)))"
                                : "transparent",
                              "&:hover": {
                                backgroundColor: selected
                                  ? "var(--cn-color-tone-primary-soft, var(--cn-color-active, rgba(0, 0, 0, 0.08)))"
                                  : "var(--cn-color-hover, rgba(0, 0, 0, 0.04))",
                              },
                              "&.Mui-focusVisible": {
                                outline:
                                  "2px solid var(--cn-color-focus-outline, var(--cn-color-brand-400, #5081c4))",
                                outlineOffset: "-2px",
                              },
                            }}
                          >
                            <Box aria-hidden sx={{ display: "flex", flex: "none" }}>
                              <CnAvatar
                                name={c.avatar?.name ?? c.title}
                                src={c.avatar?.src}
                                size={36}
                              />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "baseline",
                                  gap: "8px",
                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: "var(--cn-font-size-md, 14px)",
                                    fontWeight: unread ? 700 : 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {c.title}
                                </Box>
                                {c.time && (
                                  <Box
                                    component="span"
                                    sx={{
                                      flex: "none",
                                      fontSize: "var(--cn-font-size-xs, 11px)",
                                      color: "var(--cn-color-text-muted, #6e7682)",
                                    }}
                                  >
                                    {shortTime(c.time, now)}
                                  </Box>
                                )}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  minWidth: 0,
                                  mt: "2px",
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: "var(--cn-font-size-sm, 12px)",
                                    color: unread
                                      ? "var(--cn-color-text, #222831)"
                                      : "var(--cn-color-text-muted, #6e7682)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {c.preview}
                                </Box>
                                {c.muted && (
                                  <CnIcon
                                    name="notifications_off"
                                    size={14}
                                    sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}
                                  />
                                )}
                                {c.pinned && (
                                  <CnIcon
                                    name="push_pin"
                                    size={14}
                                    sx={{ color: "var(--cn-color-text-muted, #6e7682)" }}
                                  />
                                )}
                                {unread && (
                                  <Box
                                    component="span"
                                    sx={{
                                      flex: "none",
                                      minWidth: 18,
                                      height: 18,
                                      px: "9px",
                                      borderRadius: "999px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "var(--cn-font-size-xs, 11px)",
                                      fontWeight: 700,
                                      color: "var(--cn-color-tone-on-solid, #ffffff)",
                                      backgroundColor: "var(--cn-color-brand-600, #254d87)",
                                    }}
                                  >
                                    {(c.unread ?? 0) > 99 ? "99+" : c.unread}
                                    <Box component="span" sx={visuallyHiddenSx}>
                                      {" "}
                                      sin leer
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </ButtonBase>
                        )}

                        {hasMenu && !isRenaming && (
                          <IconButton
                            data-cn-conversation-menu
                            size="small"
                            aria-label={`Acciones de ${c.title}`}
                            aria-haspopup="menu"
                            aria-expanded={menu?.id === c.id}
                            onClick={(event) => setMenu({ anchor: event.currentTarget, id: c.id })}
                            sx={{
                              position: "absolute",
                              right: "6px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--cn-color-text-muted, #6e7682)",
                              transition: "opacity 120ms ease",
                              "@media (hover: none)": { opacity: 1 },
                              "&.Mui-focusVisible": { opacity: 1 },
                            }}
                          >
                            <CnIcon name="more_vert" size={18} />
                          </IconButton>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Menu
          open={Boolean(menu)}
          anchorEl={menu?.anchor}
          onClose={() => setMenu(null)}
          disableRestoreFocus={Boolean(pendingRename.current)}
          TransitionProps={{
            onExited: () => {
              if (pendingRename.current) setRenaming(pendingRename.current);
              pendingRename.current = null;
            },
          }}
          MenuListProps={{ "aria-label": menuItem ? `Acciones de ${menuItem.title}` : undefined }}
        >
          {onPinChange && menuItem && (
            <MenuItem
              onClick={() => {
                onPinChange(menuItem.id, !menuItem.pinned);
                setMenu(null);
              }}
              sx={{ gap: "10px", fontSize: "14px" }}
            >
              <CnIcon name="push_pin" size={18} />
              {menuItem.pinned ? "Quitar de fijadas" : "Fijar"}
            </MenuItem>
          )}
          {onRename && menuItem && (
            <MenuItem
              onClick={() => {
                pendingRename.current = { id: menuItem.id, value: menuItem.title };
                setMenu(null);
              }}
              sx={{ gap: "10px", fontSize: "14px" }}
            >
              <CnIcon name="edit" size={18} />
              Renombrar
            </MenuItem>
          )}
          {onDelete && menuItem && (
            <MenuItem
              onClick={() => {
                onDelete(menuItem.id);
                setMenu(null);
              }}
              sx={{
                gap: "10px",
                fontSize: "14px",
                color: "var(--cn-color-control-error-fg, var(--cn-color-error-600, #b52f2f))",
              }}
            >
              <CnIcon name="delete_outline" size={18} />
              Borrar
            </MenuItem>
          )}
        </Menu>
      </Box>
    );
  },
);
