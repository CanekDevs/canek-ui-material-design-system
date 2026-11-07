import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ElementType, MouseEvent, ReactNode } from "react";
import { forwardRef } from "react";
import { mergeSx } from "../../utils/field-styles";
import { CnIcon } from "../CnIcon";
import type { CnPageContainerSkeletonContent } from "./CnPageContainerSkeleton";
import { CnPageContainerSkeleton } from "./CnPageContainerSkeleton";

export type CnBreadcrumb = {
  label: ReactNode;
  /** Ruta del enlace. El último elemento se muestra como página actual. */
  href?: string;
  onClick?: (event: MouseEvent) => void;
  icon?: string;
};

export type CnLinkComponentProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent) => void;
};

export type CnPageContainerProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Ícono junto al título (registro de `CnIcon`). */
  icon?: string;
  breadcrumbs?: CnBreadcrumb[];
  /**
   * Botón "atrás": ruta (`"/clientes"`) o función. Con `true` usa el penúltimo
   * breadcrumb que tenga `href`.
   */
  back?: string | (() => void) | true;
  backLabel?: string;
  /** Acciones a la derecha del encabezado (botones, menús…). */
  actions?: ReactNode;
  /** Contenido extra bajo el título (filtros, pestañas, insignias de estado). */
  headerExtra?: ReactNode;
  /** Reemplaza el bloque de título completo. */
  headerLeft?: ReactNode;
  children?: ReactNode;
  /** Envuelve el contenido en una superficie con borde. Por defecto `false`. */
  paper?: boolean;
  /** Encabezado fijo al hacer scroll. */
  stickyHeader?: boolean;
  /** Ancho máximo del contenido (`"lg"` = 1200px, número en px o `false`). */
  maxWidth?: "sm" | "md" | "lg" | "xl" | number | false;
  /** Muestra el skeleton de la página (breadcrumbs, título, acciones y contenido). */
  loading?: boolean;
  /** Alias de `loading`. */
  skeleton?: boolean;
  /** Forma del contenido en el skeleton (bloques, tarjetas, tabla o nada). */
  skeletonContent?: CnPageContainerSkeletonContent;
  /**
   * Componente de enlace del router (p. ej. `Link` de react-router con `to`
   * mapeado a `href`, o `next/link`). Por defecto `<a>`.
   */
  linkComponent?: ElementType<CnLinkComponentProps>;
  /** Navegación programática para `back` con ruta (p. ej. `navigate` del router). */
  onNavigate?: (href: string) => void;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  className?: string;
};

const MAX_WIDTHS = { sm: 640, md: 960, lg: 1200, xl: 1536 };

const DefaultLink = ({ href, children, className, onClick }: CnLinkComponentProps) => (
  <a href={href} className={className} onClick={onClick}>
    {children}
  </a>
);

const linkSx = {
  "& a, & .cn-breadcrumb-link": {
    color: "var(--cn-color-brand-600, #254d87)",
    textDecoration: "none",
    fontWeight: 500,
    borderRadius: "var(--cn-radius-xs, 4px)",
    "&:hover": { textDecoration: "underline" },
    "&:focus-visible": { outline: "2px solid var(--cn-color-brand-400, #5081c4)" },
  },
};

/**
 * Contenedor de página: breadcrumbs, botón atrás, título con ícono, acciones,
 * contenido extra del encabezado y estados de carga. Funciona con cualquier
 * router mediante `linkComponent` / `onNavigate`.
 */
export const CnPageContainer = forwardRef<HTMLDivElement, CnPageContainerProps>(
  function CnPageContainer(
    {
      title,
      subtitle,
      icon,
      breadcrumbs,
      back,
      backLabel = "Volver",
      actions,
      headerExtra,
      headerLeft,
      children,
      paper = false,
      stickyHeader = false,
      maxWidth = false,
      loading = false,
      skeleton = false,
      skeletonContent = "blocks",
      linkComponent: LinkComponent = DefaultLink,
      onNavigate,
      sx,
      contentSx,
      className,
    },
    ref,
  ) {
    const backTarget =
      back === true
        ? [...(breadcrumbs ?? [])]
            .slice(0, -1)
            .reverse()
            .find((item) => item.href)?.href
        : back;

    const goBack = () => {
      if (typeof backTarget === "function") backTarget();
      else if (typeof backTarget === "string") {
        if (onNavigate) onNavigate(backTarget);
        else if (typeof window !== "undefined") window.location.assign(backTarget);
      }
    };

    const width =
      maxWidth === false
        ? undefined
        : typeof maxWidth === "number"
          ? maxWidth
          : MAX_WIDTHS[maxWidth];

    const titleBlock = headerLeft ?? (
      <Box sx={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {backTarget && (
          <Tooltip title={backLabel}>
            <IconButton
              aria-label={backLabel}
              onClick={goBack}
              size="small"
              sx={{
                border: "1px solid var(--cn-color-border, #dde0e4)",
                borderRadius: "var(--cn-radius-md, 8px)",
                color: "var(--cn-color-neutral-600, #4e5660)",
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {icon && (
          <Box
            aria-hidden
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--cn-radius-md, 8px)",
              backgroundColor: "var(--cn-color-brand-50, #eef3fb)",
              color: "var(--cn-color-brand-600, #254d87)",
            }}
          >
            <CnIcon name={icon} size="md" />
          </Box>
        )}
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
          {title && (
            <Typography
              component="h1"
              sx={{
                m: 0,
                fontSize: "var(--cn-font-size-2xl, 22px)",
                fontWeight: 800,
                lineHeight: 1.25,
                color: "var(--cn-color-text, #222831)",
                overflowWrap: "anywhere",
              }}
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              component="div"
              sx={{
                fontSize: "var(--cn-font-size-sm, 12px)",
                color: "var(--cn-color-text-muted, #6e7682)",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    );

    const hasHeader = Boolean(title || subtitle || headerLeft || actions || backTarget || icon);

    if (loading || skeleton) {
      return (
        <CnPageContainerSkeleton
          breadcrumbs={breadcrumbs?.length ?? 0}
          back={Boolean(backTarget)}
          icon={Boolean(icon)}
          title={Boolean(title || headerLeft)}
          subtitle={Boolean(subtitle)}
          actions={actions ? 2 : 0}
          tabs={headerExtra ? 3 : 0}
          content={skeletonContent}
          paper={paper}
          maxWidth={maxWidth}
          sx={sx}
          className={className}
        />
      );
    }

    return (
      <Box
        ref={ref}
        className={className}
        data-cn-page-container
        sx={mergeSx(
          {
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "100%",
            maxWidth: width,
            mx: width ? "auto" : undefined,
            minWidth: 0,
            fontFamily: "var(--cn-font-sans, system-ui, sans-serif)",
          },
          sx,
        )}
      >
        {(breadcrumbs?.length || hasHeader || headerExtra) && (
          <Box
            component="header"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              ...(stickyHeader && {
                position: "sticky",
                top: 0,
                zIndex: 3,
                py: "10px",
                backgroundColor: "var(--cn-color-background, #f8f9fa)",
              }),
            }}
          >
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Box component="nav" aria-label="Ruta de navegación" sx={linkSx}>
                <Box
                  component="ol"
                  sx={{
                    listStyle: "none",
                    m: 0,
                    p: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "2px",
                    fontSize: "var(--cn-font-size-sm, 12px)",
                    color: "var(--cn-color-text-muted, #6e7682)",
                  }}
                >
                  {breadcrumbs.map((crumb, index) => {
                    const last = index === breadcrumbs.length - 1;
                    const content = (
                      <Box
                        component="span"
                        sx={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {crumb.icon && <CnIcon name={crumb.icon} size="xs" />}
                        {crumb.label}
                      </Box>
                    );
                    return (
                      <Box
                        component="li"
                        key={index}
                        sx={{ display: "inline-flex", alignItems: "center", gap: "2px" }}
                      >
                        {last ? (
                          <Box
                            component="span"
                            aria-current="page"
                            sx={{ color: "var(--cn-color-text, #222831)", fontWeight: 600 }}
                          >
                            {content}
                          </Box>
                        ) : crumb.href ? (
                          <LinkComponent href={crumb.href} onClick={crumb.onClick}>
                            {content}
                          </LinkComponent>
                        ) : crumb.onClick ? (
                          <Box
                            component="button"
                            type="button"
                            className="cn-breadcrumb-link"
                            onClick={crumb.onClick}
                            sx={{ all: "unset", cursor: "pointer" }}
                          >
                            {content}
                          </Box>
                        ) : (
                          content
                        )}
                        {!last && (
                          <NavigateNextIcon
                            aria-hidden
                            sx={{ fontSize: 14, color: "var(--cn-color-neutral-400, #9aa1aa)" }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
            {hasHeader && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", sm: "center" },
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                {titleBlock}
                {actions && (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: { xs: "flex-start", sm: "flex-end" },
                    }}
                  >
                    {actions}
                  </Box>
                )}
              </Box>
            )}
            {headerExtra}
          </Box>
        )}
        <Box
          component="main"
          sx={mergeSx(
            {
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              ...(paper && {
                padding: { xs: "16px", sm: "24px" },
                borderRadius: "var(--cn-radius-lg, 12px)",
                border: "1px solid var(--cn-color-border, #dde0e4)",
                backgroundColor: "var(--cn-color-surface, #ffffff)",
              }),
            },
            contentSx,
          )}
        >
          {children}
        </Box>
      </Box>
    );
  },
);
