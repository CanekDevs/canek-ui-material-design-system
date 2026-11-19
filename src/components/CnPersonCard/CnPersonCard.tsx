import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef, useId } from "react";
import type { CnAvatarStatus } from "../CnAvatar";
import { CnAvatar } from "../CnAvatar";
import { CnButton } from "../CnButton";
import { CnCard } from "../CnCard";
import { CnChip } from "../CnChip";
import { CnIcon } from "../CnIcon";
import type { CnTone } from "../CnInfoCard/tones";
import { CN_TONES } from "../CnInfoCard/tones";
import { CnPersonCardSkeleton } from "./CnPersonCardSkeleton";
import type { CnPersonEvent } from "./person-event";
import { resolvePersonEvent } from "./person-event";

export type CnPersonCardLayout = "horizontal" | "vertical" | "compact";
export type CnPersonCardVariant = "outlined" | "elevated" | "tinted" | "solid";

export type CnPersonCardQuickAction = {
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

export type CnPersonCardDetail = { label: ReactNode; value: ReactNode };

export type CnPersonCardProps = {
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
  details?: CnPersonCardDetail[];
  tags?: string[];

  /** Portada superior (layout vertical). `true` = franja con el tono. */
  coverUrl?: string;
  cover?: boolean;
  /** Tono (por defecto, el del evento). */
  tone?: CnTone;
  variant?: CnPersonCardVariant;
  layout?: CnPersonCardLayout;

  quickActions?: CnPersonCardQuickAction[];
  /** Nodos propios en la zona de acciones. */
  actions?: ReactNode;
  /** Oculta los botones de contacto (correo, teléfono, WhatsApp). */
  hideContact?: boolean;

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

/**
 * Tarjeta de persona / evento: avatar con estado, nombre, puesto, contacto
 * (correo, teléfono, WhatsApp), contexto del evento (cumpleaños, aniversario,
 * ingreso, ausencias) con cuenta regresiva y acciones rápidas.
 */
export const CnPersonCard = forwardRef<HTMLDivElement, CnPersonCardProps>(function CnPersonCard(
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
    coverUrl,
    cover,
    tone: toneProp,
    variant = "outlined",
    layout = "horizontal",
    quickActions = [],
    actions,
    hideContact = false,
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
  const resolved = event ? resolvePersonEvent(event, today) : null;
  const tone = toneProp ?? resolved?.tone ?? "primary";
  const palette = CN_TONES[tone];
  const isSolid = variant === "solid";
  const isCompact = layout === "compact";
  const isVertical = layout === "vertical";
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
          href: `mailto:${email}`,
        },
        phone && {
          key: "phone",
          icon: "phone" as ReactNode,
          label: `Llamar a ${name}`,
          href: `tel:${phone.replace(/[^\d+]/g, "")}`,
        },
        whatsappNumber && {
          key: "whatsapp",
          icon: (<WhatsAppIcon sx={{ fontSize: 18 }} />) as ReactNode,
          label: `WhatsApp a ${name}`,
          href: `https://wa.me/${digits(whatsappNumber)}`,
          target: "_blank" as const,
        },
      ].filter(Boolean as unknown as <T>(value: T | "" | undefined | false) => value is T);

  if (skeleton) {
    return (
      <CnPersonCardSkeleton
        layout={layout}
        variant={variant}
        cover={isVertical && Boolean(cover || coverUrl)}
        status={Boolean(avatarStatus)}
        eyebrow={Boolean(eyebrow || resolved)}
        event={Boolean(resolved)}
        details={details?.length ?? 0}
        tags={tags?.length ?? 0}
        contacts={isCompact ? 0 : contacts.length}
        quickActions={isCompact ? 0 : quickActions.length}
        sx={sx}
        className={className}
      />
    );
  }

  const textColor = isSolid ? palette.onSolid : "var(--cn-color-text, #222831)";
  const mutedColor = isSolid ? "rgba(255,255,255,0.85)" : "var(--cn-color-text-muted, #6e7682)";
  const eyebrowText = eyebrow ?? resolved?.label;
  const subtitle = [role, department].filter(Boolean);

  const avatar = (
    <CnAvatar
      src={avatarUrl}
      name={name}
      initials={initials}
      status={avatarStatus}
      size={isCompact ? "md" : isVertical ? "xl" : "lg"}
      bordered={isVertical || celebrate}
      borderColor={celebrate ? palette.main : isSolid ? "#fff" : undefined}
      alt={name}
    />
  );

  const eyebrowNode = eyebrowText && !isCompact && (
    <Typography
      component="div"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isVertical ? "center" : "flex-start",
        gap: "4px",
        fontSize: "10.5px",
        fontWeight: "var(--cn-font-weight-semibold, 600)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isSolid ? palette.onSolid : palette.main,
        mb: "2px",
      }}
    >
      {resolved &&
        (typeof resolved.icon === "string" ? (
          <CnIcon name={resolved.icon} size={14} color="inherit" aria-hidden />
        ) : (
          resolved.icon
        ))}
      {eyebrowText}
      {celebrate && <CnIcon name="celebration" size={14} color="inherit" aria-hidden />}
    </Typography>
  );

  const nameNode = (
    <Typography
      id={nameId}
      component="div"
      title={name}
      sx={{
        fontSize: isCompact ? "var(--cn-font-size-sm, 13px)" : "var(--cn-font-size-base, 14px)",
        fontWeight: "var(--cn-font-weight-bold, 700)",
        color: textColor,
        lineHeight: 1.3,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </Typography>
  );

  const subtitleNode = (subtitle.length > 0 || location) && (
    <Typography
      component="div"
      sx={{
        fontSize: "var(--cn-font-size-xs, 12px)",
        color: mutedColor,
        lineHeight: 1.4,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: isCompact ? "nowrap" : "normal",
      }}
    >
      {subtitle.map((part, i) => (
        <Box component="span" key={i}>
          {i > 0 && " · "}
          {part}
        </Box>
      ))}
      {location && !isCompact && (
        <Box
          component="span"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isVertical ? "center" : "flex-start",
            gap: "2px",
            mt: "2px",
          }}
        >
          <CnIcon name="location_on" size={13} color="inherit" aria-hidden />
          {location}
        </Box>
      )}
    </Typography>
  );

  const countdownChip = resolved?.countdown ? (
    <CnChip
      label={resolved.countdown}
      size="small"
      color={tone}
      variant={resolved.isToday ? "filled" : "soft"}
      pulse={celebrate}
      compact
      sx={isSolid ? { backgroundColor: "rgba(255,255,255,0.22)", color: "#fff" } : undefined}
    />
  ) : null;

  const badgeChip = resolved?.badge ? (
    <CnChip
      label={resolved.badge}
      size="small"
      color={tone}
      variant="outlined"
      compact
      sx={isSolid ? { borderColor: "rgba(255,255,255,0.7)", color: "#fff" } : undefined}
    />
  ) : null;

  const eventNode = resolved && (resolved.detail || countdownChip || badgeChip) && (
    <Box
      data-cn-person-event
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isVertical ? "center" : "flex-start",
        flexWrap: "wrap",
        gap: "6px",
        mt: isCompact ? 0 : "8px",
      }}
    >
      {resolved.detail && (
        <Typography
          component="span"
          sx={{ fontSize: "var(--cn-font-size-xs, 12px)", fontWeight: 600, color: textColor }}
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
      sx={{
        m: 0,
        mt: "8px",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: "8px",
        rowGap: "2px",
        fontSize: "var(--cn-font-size-xs, 12px)",
        textAlign: "left",
      }}
    >
      {details.map((detail, i) => (
        <Box key={i} sx={{ display: "contents" }}>
          <Box component="dt" sx={{ color: mutedColor }}>
            {detail.label}
          </Box>
          <Box component="dd" sx={{ m: 0, fontWeight: 600, color: textColor }}>
            {detail.value}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const tagsNode = tags && tags.length > 0 && !isCompact && (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        mt: "8px",
        justifyContent: isVertical ? "center" : "flex-start",
      }}
    >
      {tags.map((tag) => (
        <CnChip
          key={tag}
          label={tag}
          size="small"
          variant="soft"
          color={isSolid ? "neutral" : tone}
          compact
          sx={isSolid ? { backgroundColor: "#fff", color: palette.solid } : undefined}
        />
      ))}
    </Box>
  );

  const contactNodes = contacts.map((contact) => (
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
  ));

  const quickNodes = quickActions.map((action, i) =>
    action.iconOnly ? (
      <CnButton
        key={action.key ?? i}
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
        onClick={(e) => {
          e.stopPropagation();
          action.onClick?.();
        }}
      />
    ) : (
      <CnButton
        key={action.key ?? i}
        size="small"
        variant={action.variant ?? (i === 0 ? "contained" : "outlined")}
        color={tone}
        startIcon={action.icon}
        href={action.href}
        target={action.target}
        onClick={(e) => {
          e.stopPropagation();
          action.onClick?.();
        }}
        sx={
          isSolid
            ? (action.variant ?? (i === 0 ? "contained" : "outlined")) === "contained"
              ? {
                  backgroundColor: "#fff",
                  color: palette.solid,
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                }
              : { color: "#fff", borderColor: "rgba(255,255,255,0.7)" }
            : undefined
        }
      >
        {action.label}
      </CnButton>
    ),
  );

  const hasActions = contactNodes.length > 0 || quickNodes.length > 0 || Boolean(actions);

  let content: ReactNode;
  if (isCompact) {
    content = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          px: "12px",
          py: "8px",
          minWidth: 0,
        }}
      >
        {avatar}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {nameNode}
          {subtitleNode}
        </Box>
        {eventNode && <Box sx={{ flexShrink: 0, textAlign: "right" }}>{eventNode}</Box>}
        {(actions || quickNodes.length > 0) && (
          <Box
            sx={{ display: "flex", gap: "4px", flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
            {quickNodes}
          </Box>
        )}
      </Box>
    );
  } else if (isVertical) {
    const showCover = Boolean(cover || coverUrl);
    content = (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {showCover && (
          <Box
            data-cn-person-cover
            aria-hidden
            sx={{
              height: 64,
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
            px: "16px",
            pb: "16px",
            pt: showCover ? 0 : "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box sx={{ mt: showCover ? "-32px" : 0, mb: "8px", position: "relative" }}>{avatar}</Box>
          {eyebrowNode}
          <Box sx={{ maxWidth: "100%" }}>{nameNode}</Box>
          {subtitleNode}
          {eventNode}
          {detailsNode}
          {tagsNode}
          {hasActions && (
            <Box
              data-cn-person-actions
              onClick={(e) => e.stopPropagation()}
              sx={{
                mt: "auto",
                pt: "12px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {contactNodes}
              {actions}
              {quickNodes}
            </Box>
          )}
        </Box>
      </Box>
    );
  } else {
    content = (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: "14px", p: "16px", minWidth: 0 }}>
        {avatar}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {eyebrowNode}
          {nameNode}
          {subtitleNode}
          {eventNode}
          {detailsNode}
          {tagsNode}
          {(quickNodes.length > 0 || actions) && (
            <Box
              data-cn-person-actions
              onClick={(e) => e.stopPropagation()}
              sx={{ mt: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}
            >
              {actions}
              {quickNodes}
            </Box>
          )}
        </Box>
        {contactNodes.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              flexShrink: 0,
              mt: "-4px",
              mr: "-6px",
            }}
          >
            {contactNodes}
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
    <CnCard
      ref={ref}
      component="article"
      variant={variant === "outlined" ? "outlined" : variant === "elevated" ? "elevated" : "ghost"}
      padding="none"
      interactive={Boolean(onClick || href)}
      onClick={onClick}
      href={href}
      ariaLabelledBy={onClick || href ? undefined : nameId}
      ariaLabel={onClick || href ? name : undefined}
      className={className}
      cardProps={
        { "data-cn-person-card": layout, "data-today": celebrate || undefined } as Record<
          string,
          unknown
        >
      }
      sx={[
        {
          height: isVertical ? "100%" : "auto",
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
  );
});
