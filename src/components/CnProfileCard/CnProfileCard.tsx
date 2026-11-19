import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, ReactNode, Ref } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CnTone } from "../../utils/tones";
import { CN_TONES } from "../../utils/tones";
import type { CnAvatarSize, CnAvatarStatus } from "../CnAvatar";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import { CnCard } from "../CnCard";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import { CnProfileCardSkeleton } from "./CnProfileCardSkeleton";
import type { CnPersonEvent } from "./person-event";
import { resolvePersonEvent } from "./person-event";

export type CnProfileCardLayout = "horizontal" | "vertical" | "compact";
export type CnProfileCardVariant = "outlined" | "elevated" | "tinted" | "solid";

export type CnProfileCardQuickAction = {
  key?: string;
  label: string;
  icon?: string;
  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self";
  /** `contained` para la acción principal ("Felicitar"). */
  variant?: "contained" | "outlined" | "text";
  /** Solo ícono (con la etiqueta como tooltip y `aria-label`). */
  iconOnly?: boolean;
};

export type CnProfileCardDetail = { label: ReactNode; value: ReactNode };

export type CnProfileCardProps = {
  name: string;
  avatarUrl?: string;
  initials?: string;
  avatarStatus?: CnAvatarStatus;
  /** Puesto. */
  role?: ReactNode;
  department?: ReactNode;
  location?: ReactNode;

  email?: string;
  phone?: string;
  /** Número de WhatsApp o `true` para usar `phone`. */
  whatsapp?: string | boolean;

  /** Evento (cumpleaños, aniversario, ingreso, ausencia…). */
  event?: CnPersonEvent;
  /** Texto superior (por defecto, la etiqueta del evento). */
  eyebrow?: ReactNode;
  /** Pares etiqueta / valor (como `detailLabel` / `detailValue` de TbPersonEventCard). */
  details?: CnProfileCardDetail[];
  tags?: string[];
  /** Máximo de etiquetas visibles; el resto se resume en un chip "+N". */
  maxTags?: number;

  /** Portada superior (layout vertical). `true` = franja con el tono. */
  coverUrl?: string;
  cover?: boolean;
  /** Tono (por defecto, el del evento). */
  tone?: CnTone;
  variant?: CnProfileCardVariant;
  layout?: CnProfileCardLayout;

  /**
   * Acciones rápidas. Si no caben en el ancho de la tarjeta, las secundarias y
   * los botones de contacto se agrupan en un menú "Más acciones".
   */
  quickActions?: CnProfileCardQuickAction[];
  /** Nodos propios en la zona de acciones (hacen wrap; no se agrupan en el menú). */
  actions?: ReactNode;
  /** Oculta los botones de contacto (correo, teléfono, WhatsApp). */
  hideContact?: boolean;
  /** Etiqueta del botón del menú de acciones agrupadas. */
  moreActionsLabel?: string;

  onClick?: () => void;
  href?: string;
  selected?: boolean;
  /** Resalta la tarjeta cuando el evento es hoy. Por defecto `true`. */
  highlightToday?: boolean;
  /** Fecha de referencia para la cuenta regresiva (pruebas, zonas horarias). */
  today?: Date;
  /** Muestra el skeleton de la tarjeta (mismo layout). */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

const digits = (value: string) => value.replace(/[^\d]/g, "");
const GAP = 6;
const ICON_BUTTON = 32;
const MORE_BUTTON = 32;

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Ancho real del elemento (0 = aún sin medir, p. ej. SSR o pruebas). */
const useElementWidth = (deps: unknown[]) => {
  const ref = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.round(el.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, deps);
  return [ref, width] as const;
};

type ActionEntry = {
  key: string;
  kind: "contact" | "quick";
  /** Ancho estimado (px) para decidir si cabe en una fila. */
  width: number;
  primary: boolean;
  node: ReactNode;
  label: string;
  icon?: ReactNode;
  href?: string;
  target?: "_blank" | "_self";
  onClick?: () => void;
};

/**
 * Reparte las acciones entre la fila visible y el menú "Más acciones" según el
 * ancho disponible (`Infinity` cuando aún no se ha medido).
 */
export const planActions = <E extends { width: number; primary?: boolean }>(
  entries: E[],
  available: number,
  keepPrimary = true,
): { inline: E[]; overflow: E[] } => {
  const total = entries.reduce((sum, e) => sum + e.width, 0) + GAP * (entries.length - 1);
  if (entries.length === 0 || total <= available) return { inline: entries, overflow: [] };
  const budget = available - MORE_BUTTON - GAP;
  const inline: E[] = [];
  const overflow: E[] = [];
  let used = 0;
  for (const entry of entries) {
    if (overflow.length === 0 && used + entry.width <= budget) {
      inline.push(entry);
      used += entry.width + GAP;
    } else overflow.push(entry);
  }
  // La acción principal siempre queda a la vista (su etiqueta se trunca si hace falta).
  if (keepPrimary && inline.length === 0 && overflow[0]?.primary) inline.push(overflow.shift()!);
  return { inline, overflow };
};

const estimateLabel = (label: string, withIcon: boolean) =>
  Math.min(220, Math.round(label.length * 6.6) + 24 + (withIcon ? 22 : 0));

const assignRef = <T,>(ref: Ref<T> | undefined, value: T) => {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T }).current = value;
};

/**
 * Tarjeta de perfil: avatar con estado, nombre, puesto, contacto (correo,
 * teléfono, WhatsApp), contexto de un evento (cumpleaños, aniversario,
 * ingreso, ausencias) con cuenta regresiva y acciones rápidas. Se adapta al
 * ancho de su contenedor (no de la ventana): trunca textos, reduce el avatar y
 * agrupa acciones en un menú cuando no caben.
 */
export const CnProfileCard = forwardRef<HTMLDivElement, CnProfileCardProps>(function CnProfileCard(
  {
    name,
    avatarUrl,
    initials,
    avatarStatus,
    role,
    department,
    location,
    email,
    phone,
    whatsapp,
    event,
    eyebrow,
    details,
    tags,
    maxTags,
    coverUrl,
    cover,
    tone: toneProp,
    variant = "outlined",
    layout = "horizontal",
    quickActions = [],
    actions,
    hideContact = false,
    moreActionsLabel,
    onClick,
    href,
    selected = false,
    highlightToday = true,
    today,
    skeleton = false,
    sx,
    className,
  },
  ref,
) {
  const nameId = useId();
  const [rootRef, width] = useElementWidth([skeleton, layout]);
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref, rootRef],
  );
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const resolved = event ? resolvePersonEvent(event, today) : null;
  const tone = toneProp ?? resolved?.tone ?? "primary";
  const palette = CN_TONES[tone];
  const isSolid = variant === "solid";
  const isCompact = layout === "compact";
  const isVertical = layout === "vertical";
  const measured = width > 0;
  const celebrate =
    highlightToday &&
    Boolean(resolved?.isToday) &&
    (event?.type === "birthday" || event?.type === "anniversary" || event?.type === "new-hire");

  const whatsappNumber =
    whatsapp === true ? phone : typeof whatsapp === "string" ? whatsapp : undefined;
  const contacts = hideContact
    ? []
    : [
        email && {
          key: "email",
          icon: "email" as ReactNode,
          label: `Enviar correo a ${name}`,
          display: email,
          href: `mailto:${email}`,
        },
        phone && {
          key: "phone",
          icon: "phone" as ReactNode,
          label: `Llamar a ${name}`,
          display: phone,
          href: `tel:${phone.replace(/[^\d+]/g, "")}`,
        },
        whatsappNumber && {
          key: "whatsapp",
          icon: (<WhatsAppIcon sx={{ fontSize: 18 }} />) as ReactNode,
          label: `WhatsApp a ${name}`,
          display: `WhatsApp ${whatsappNumber}`,
          href: `https://wa.me/${digits(whatsappNumber)}`,
          target: "_blank" as const,
        },
      ].filter(Boolean as unknown as <T>(value: T | "" | undefined | false) => value is T);

  if (skeleton) {
    return (
      <CnProfileCardSkeleton
        layout={layout}
        variant={variant}
        cover={isVertical && Boolean(cover || coverUrl)}
        status={Boolean(avatarStatus)}
        eyebrow={Boolean(eyebrow || resolved)}
        event={Boolean(resolved)}
        details={details?.length ?? 0}
        tags={Math.min(tags?.length ?? 0, maxTags ?? Infinity)}
        contacts={isCompact ? 0 : contacts.length}
        quickActions={isCompact ? 0 : quickActions.length}
        sx={sx}
        className={className}
      />
    );
  }

  // ─── Medidas según el ancho del contenedor ─────────────────────────
  const avatarSize: CnAvatarSize = isCompact
    ? measured && width < 300
      ? "sm"
      : "md"
    : isVertical
      ? measured && width < 220
        ? "lg"
        : "xl"
      : measured && width < 320
        ? "md"
        : "lg";
  const avatarPx = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 }[avatarSize];
  const pad = measured && width < 260 ? 12 : 16;
  /** Horizontal angosto: los contactos pasan de la columna derecha a la fila de acciones. */
  const contactsInRow = isVertical || (measured && width < 380);
  /** Compacto angosto: el evento baja bajo el nombre y las acciones van al menú. */
  const compactNarrow = isCompact && measured && width < 420;

  const textColor = isSolid ? palette.onSolid : "var(--cn-color-text, #222831)";
  const mutedColor = isSolid ? "rgba(255,255,255,0.85)" : "var(--cn-color-text-muted, #6e7682)";
  const eyebrowText = eyebrow ?? resolved?.label;
  const subtitle = [role, department].filter(Boolean);
  const center = isVertical ? "center" : "flex-start";
  const stackDetails = measured && (isVertical ? width < 260 : width < 340);

  const avatar = (
    <CnAvatar
      src={avatarUrl}
      name={name}
      initials={initials}
      status={avatarStatus}
      size={avatarSize}
      bordered={isVertical || celebrate}
      borderColor={celebrate ? palette.main : isSolid ? "#fff" : undefined}
      alt={name}
      sx={{ flexShrink: 0 }}
    />
  );

  const eyebrowNode = eyebrowText && !isCompact && (
    <Typography
      component="div"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: center,
        gap: "4px",
        minWidth: 0,
        maxWidth: "100%",
        fontSize: "10.5px",
        fontWeight: "var(--cn-font-weight-semibold, 600)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isSolid ? palette.onSolid : palette.main,
        mb: "2px",
        "& > svg, & > span[aria-hidden]": { flexShrink: 0 },
      }}
    >
      {resolved &&
        (typeof resolved.icon === "string" ? (
          <CnIcon name={resolved.icon} size={14} color="inherit" aria-hidden />
        ) : (
          resolved.icon
        ))}
      <Box
        component="span"
        sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {eyebrowText}
      </Box>
      {celebrate && <CnIcon name="celebration" size={14} color="inherit" aria-hidden />}
    </Typography>
  );

  const nameNode = (
    <Typography
      id={nameId}
      component="div"
      title={name}
      data-cn-profile-name
      sx={{
        fontSize: isCompact ? "var(--cn-font-size-sm, 13px)" : "var(--cn-font-size-base, 14px)",
        fontWeight: "var(--cn-font-weight-bold, 700)",
        color: textColor,
        lineHeight: 1.3,
        maxWidth: "100%",
        overflow: "hidden",
        overflowWrap: "anywhere",
        ...(isCompact
          ? { textOverflow: "ellipsis", whiteSpace: "nowrap" }
          : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }),
      }}
    >
      {name}
    </Typography>
  );

  const subtitleNode = (subtitle.length > 0 || location) && (
    <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
      {subtitle.length > 0 && (
        <Typography
          component="div"
          sx={{
            fontSize: "var(--cn-font-size-xs, 12px)",
            color: mutedColor,
            lineHeight: 1.4,
            overflow: "hidden",
            overflowWrap: "anywhere",
            ...(isCompact
              ? { textOverflow: "ellipsis", whiteSpace: "nowrap" }
              : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }),
          }}
        >
          {subtitle.map((part, i) => (
            <Box component="span" key={i}>
              {i > 0 && " · "}
              {part}
            </Box>
          ))}
        </Typography>
      )}
      {location && !isCompact && (
        <Typography
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: center,
            gap: "2px",
            mt: "2px",
            minWidth: 0,
            fontSize: "var(--cn-font-size-xs, 12px)",
            color: mutedColor,
            lineHeight: 1.4,
          }}
        >
          <CnIcon name="location_on" size={13} color="inherit" aria-hidden />
          <Box
            component="span"
            sx={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {location}
          </Box>
        </Typography>
      )}
    </Box>
  );

  const countdownChip = resolved?.countdown ? (
    <CnChip
      label={resolved.countdown}
      size="small"
      color={tone}
      variant={resolved.isToday ? "filled" : "soft"}
      pulse={celebrate}
      compact
      sx={[
        { maxWidth: "100%" },
        isSolid ? { backgroundColor: "rgba(255,255,255,0.22)", color: "#fff" } : {},
      ]}
    />
  ) : null;

  const badgeChip = resolved?.badge ? (
    <CnChip
      label={resolved.badge}
      size="small"
      color={tone}
      variant="outlined"
      compact
      sx={[
        { maxWidth: "100%" },
        isSolid ? { borderColor: "rgba(255,255,255,0.7)", color: "#fff" } : {},
      ]}
    />
  ) : null;

  const eventNode = resolved && (resolved.detail || countdownChip || badgeChip) && (
    <Box
      data-cn-profile-event
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isCompact && !compactNarrow ? "flex-end" : center,
        flexWrap: "wrap",
        gap: "4px 6px",
        minWidth: 0,
        maxWidth: "100%",
        mt: isCompact ? (compactNarrow ? "4px" : 0) : "8px",
      }}
    >
      {resolved.detail && (
        <Typography
          component="span"
          sx={{
            fontSize: "var(--cn-font-size-xs, 12px)",
            fontWeight: 600,
            color: textColor,
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {resolved.detail}
        </Typography>
      )}
      {badgeChip}
      {countdownChip}
    </Box>
  );

  const detailsNode = details && details.length > 0 && !isCompact && (
    <Box
      component="dl"
      data-cn-profile-details
      sx={{
        m: 0,
        mt: "8px",
        display: "grid",
        // Angosto: etiqueta arriba y valor abajo.
        gridTemplateColumns: stackDetails ? "minmax(0, 1fr)" : "fit-content(45%) minmax(0, 1fr)",
        columnGap: "8px",
        rowGap: "2px",
        width: "100%",
        fontSize: "var(--cn-font-size-xs, 12px)",
        textAlign: stackDetails && isVertical ? "center" : "left",
      }}
    >
      {details.map((detail, i) => (
        <Box key={i} sx={{ display: "contents" }}>
          <Box component="dt" sx={{ color: mutedColor, minWidth: 0, overflowWrap: "anywhere" }}>
            {detail.label}
          </Box>
          <Box
            component="dd"
            sx={{
              m: 0,
              fontWeight: 600,
              color: textColor,
              minWidth: 0,
              overflowWrap: "anywhere",
              ...(stackDetails && { mb: "4px" }),
            }}
          >
            {detail.value}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const visibleTags = tags && maxTags !== undefined ? tags.slice(0, maxTags) : (tags ?? []);
  const hiddenTags = tags ? tags.slice(visibleTags.length) : [];
  const tagSx = isSolid ? { backgroundColor: "#fff", color: palette.solid } : {};
  const tagsNode = tags && tags.length > 0 && !isCompact && (
    <Box
      data-cn-profile-tags
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        mt: "8px",
        minWidth: 0,
        maxWidth: "100%",
        justifyContent: center,
      }}
    >
      {visibleTags.map((tag) => (
        <CnChip
          key={tag}
          label={tag}
          size="small"
          variant="soft"
          color={isSolid ? "neutral" : tone}
          compact
          title={tag}
          sx={[{ maxWidth: "100%" }, tagSx]}
        />
      ))}
      {hiddenTags.length > 0 && (
        <CnChip
          label={`+${hiddenTags.length}`}
          size="small"
          variant="outlined"
          color={isSolid ? "neutral" : tone}
          compact
          title={hiddenTags.join(", ")}
          aria-label={`${hiddenTags.length} etiquetas más: ${hiddenTags.join(", ")}`}
          sx={tagSx}
        />
      )}
    </Box>
  );

  // ─── Acciones (contacto + rápidas), con menú de desborde ───────────
  const contactEntries: ActionEntry[] = contacts.map((contact) => ({
    key: `contact-${contact.key}`,
    kind: "contact",
    width: ICON_BUTTON,
    primary: false,
    label: contact.display,
    icon: contact.icon,
    href: contact.href,
    target: contact.target,
    node: (
      <CnButton
        key={contact.key}
        iconOnly
        icon={contact.icon}
        size="small"
        variant="text"
        color="neutral"
        href={contact.href}
        target={contact.target}
        rel={contact.target === "_blank" ? "noopener noreferrer" : undefined}
        aria-label={contact.label}
        tooltip
        tooltipProps={{ title: contact.label }}
        onClick={(e) => e.stopPropagation()}
        sx={isSolid ? { color: palette.onSolid } : undefined}
      />
    ),
  }));

  const quickEntries: ActionEntry[] = quickActions.map((action, i) => {
    const key = action.key ?? String(i);
    const buttonVariant = action.variant ?? (i === 0 ? "contained" : "outlined");
    const handle = (e: MouseEvent) => {
      e.stopPropagation();
      action.onClick?.();
    };
    return {
      key: `quick-${key}`,
      kind: "quick",
      width: action.iconOnly ? ICON_BUTTON : estimateLabel(action.label, Boolean(action.icon)),
      primary: i === 0 && !action.iconOnly,
      label: action.label,
      icon: action.icon,
      href: action.href,
      target: action.target,
      onClick: action.onClick,
      node: action.iconOnly ? (
        <CnButton
          key={key}
          iconOnly
          icon={action.icon}
          size="small"
          variant="text"
          color={tone}
          href={action.href}
          target={action.target}
          aria-label={action.label}
          tooltip
          tooltipProps={{ title: action.label }}
          onClick={handle}
        />
      ) : (
        <CnButton
          key={key}
          size="small"
          variant={buttonVariant}
          color={tone}
          startIcon={action.icon}
          href={action.href}
          target={action.target}
          onClick={handle}
          title={action.label}
          sx={[
            {
              minWidth: 0,
              maxWidth: "100%",
              "& .MuiButton-startIcon": { flexShrink: 0 },
            },
            isSolid
              ? buttonVariant === "contained"
                ? {
                    backgroundColor: "#fff",
                    color: palette.solid,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                  }
                : { color: "#fff", borderColor: "rgba(255,255,255,0.7)" }
              : {},
          ]}
        >
          <Box
            component="span"
            sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {action.label}
          </Box>
        </CnButton>
      ),
    };
  });

  // Ancho disponible para la fila de acciones (Infinity = sin medir).
  const rowEntries = contactsInRow
    ? isVertical
      ? [...contactEntries, ...quickEntries]
      : [...quickEntries, ...contactEntries]
    : quickEntries;
  let available = Infinity;
  if (measured) {
    if (isVertical) available = width - pad * 2;
    else if (isCompact) available = compactNarrow ? 0 : Math.max(0, width * 0.4);
    else available = width - pad * 2 - avatarPx - 14 - (contactsInRow ? 0 : ICON_BUTTON + 4);
  }
  // Prioridad para quedarse visible: acción principal, contacto, el resto.
  const rank = (entry: ActionEntry) => (entry.primary ? 0 : entry.kind === "contact" ? 1 : 2);
  const plan = planActions(
    [...rowEntries].sort((a, b) => rank(a) - rank(b)),
    available,
    !isCompact,
  );
  const inlineSet = new Set(plan.inline);
  const overflowEntries = rowEntries.filter((entry) => !inlineSet.has(entry));
  const moreLabel = moreActionsLabel ?? `Más acciones para ${name}`;
  const moreButton = overflowEntries.length > 0 && (
    <CnButton
      iconOnly
      icon="more_vert"
      size="small"
      variant="text"
      color="neutral"
      aria-label={moreLabel}
      aria-haspopup="menu"
      aria-expanded={menuAnchor ? true : undefined}
      tooltip
      tooltipProps={{ title: moreLabel }}
      data-cn-profile-more
      onClick={(e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget as HTMLElement);
      }}
      sx={[{ flexShrink: 0 }, isSolid ? { color: palette.onSolid } : {}]}
    />
  );
  const inlineNodes = rowEntries.filter((entry) => inlineSet.has(entry)).map((entry) => entry.node);
  const sideContacts = contactsInRow ? [] : contactEntries.map((entry) => entry.node);
  const hasRow = inlineNodes.length > 0 || Boolean(actions) || Boolean(moreButton);

  const actionsRow = hasRow && (
    <Box
      data-cn-profile-actions
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: "flex",
        // Con menú de desborde la fila no hace wrap: la acción principal trunca su etiqueta.
        flexWrap: isCompact || (overflowEntries.length > 0 && !actions) ? "nowrap" : "wrap",
        alignItems: "center",
        justifyContent: center,
        gap: `${GAP}px`,
        minWidth: 0,
        maxWidth: "100%",
        ...(isCompact ? { flexShrink: 0 } : { mt: isVertical ? "auto" : "12px" }),
        ...(isVertical && { pt: "12px", width: "100%" }),
      }}
    >
      {actions}
      {inlineNodes}
      {moreButton}
    </Box>
  );

  let content: ReactNode;
  if (isCompact) {
    content = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: measured && width < 300 ? "10px" : "12px",
          px: measured && width < 300 ? "10px" : "12px",
          py: "8px",
          minWidth: 0,
        }}
      >
        {avatar}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {nameNode}
          {subtitleNode}
          {compactNarrow && eventNode}
        </Box>
        {!compactNarrow && eventNode && (
          <Box sx={{ flexShrink: 1, minWidth: 0, maxWidth: "45%", textAlign: "right" }}>
            {eventNode}
          </Box>
        )}
        {actionsRow}
      </Box>
    );
  } else if (isVertical) {
    const showCover = Boolean(cover || coverUrl);
    const avatarOffset = Math.round(avatarPx / 2);
    content = (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
        {showCover && (
          <Box
            data-cn-profile-cover
            aria-hidden
            sx={{
              height: measured && width < 220 ? 48 : 64,
              flexShrink: 0,
              backgroundColor: palette.soft,
              backgroundImage: coverUrl
                ? `url("${coverUrl.replace(/"/g, "%22")}")`
                : `linear-gradient(135deg, ${palette.softHover} 0%, ${palette.border} 100%)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <Box
          sx={{
            px: `${pad}px`,
            pb: `${pad}px`,
            pt: showCover ? 0 : `${pad}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              mt: showCover ? `-${avatarOffset}px` : 0,
              mb: "8px",
              position: "relative",
              display: "flex",
            }}
          >
            {avatar}
          </Box>
          {eyebrowNode}
          {nameNode}
          {subtitleNode}
          {eventNode}
          {detailsNode}
          {tagsNode}
          {actionsRow}
        </Box>
      </Box>
    );
  } else {
    content = (
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: measured && width < 320 ? "10px" : "14px",
          p: `${pad}px`,
          minWidth: 0,
        }}
      >
        {avatar}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {eyebrowNode}
          {nameNode}
          {subtitleNode}
          {eventNode}
          {detailsNode}
          {tagsNode}
          {actionsRow}
        </Box>
        {sideContacts.length > 0 && (
          <Box
            data-cn-profile-contacts
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              flexShrink: 0,
              mt: "-4px",
              mr: "-6px",
            }}
          >
            {sideContacts}
          </Box>
        )}
      </Box>
    );
  }

  const surfaceSx: Record<string, unknown> = {
    outlined: {},
    elevated: {},
    tinted: { backgroundColor: palette.soft, border: `1px solid ${palette.border}` },
    solid: { backgroundColor: palette.solid, color: palette.onSolid },
  }[variant];

  return (
    <>
      <CnCard
        ref={setRootRef}
        component="article"
        variant={
          variant === "outlined" ? "outlined" : variant === "elevated" ? "elevated" : "ghost"
        }
        padding="none"
        interactive={Boolean(onClick || href)}
        onClick={onClick}
        href={href}
        ariaLabelledBy={onClick || href ? undefined : nameId}
        ariaLabel={onClick || href ? name : undefined}
        className={className}
        cardProps={
          { "data-cn-profile-card": layout, "data-today": celebrate || undefined } as Record<
            string,
            unknown
          >
        }
        sx={[
          {
            height: isVertical ? "100%" : "auto",
            minWidth: 0,
            maxWidth: "100%",
            ...surfaceSx,
            ...(celebrate && {
              boxShadow: `0 0 0 2px ${palette.border}, var(--cn-shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.06))`,
            }),
            ...(selected && {
              borderColor: "var(--cn-color-brand-500, #3562a6)",
              boxShadow: "0 0 0 1px var(--cn-color-brand-500, #3562a6)",
            }),
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {content}
      </CnCard>
      {overflowEntries.length > 0 && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          onClick={(e) => e.stopPropagation()}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 180, maxWidth: "min(320px, 90vw)" } } }}
        >
          {overflowEntries.map((entry) => (
            <MenuItem
              key={entry.key}
              {...(entry.href
                ? {
                    component: "a",
                    href: entry.href,
                    target: entry.target,
                    rel: entry.target === "_blank" ? "noopener noreferrer" : undefined,
                  }
                : {})}
              onClick={() => {
                setMenuAnchor(null);
                entry.onClick?.();
              }}
              sx={{ fontSize: "var(--cn-font-size-sm, 13px)", whiteSpace: "normal" }}
            >
              {entry.icon && (
                <ListItemIcon sx={{ color: "inherit", minWidth: "30px !important" }}>
                  {typeof entry.icon === "string" ? (
                    <CnIcon name={entry.icon} size={18} color="inherit" />
                  ) : (
                    entry.icon
                  )}
                </ListItemIcon>
              )}
              <ListItemText
                primaryTypographyProps={{ fontSize: "inherit", sx: { overflowWrap: "anywhere" } }}
              >
                {entry.label}
              </ListItemText>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
});
