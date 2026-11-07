import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkBlock, SkText } from "../CnSkeleton";
import type { CnPageContainerProps } from "./CnPageContainer";

type PageMaxWidth = NonNullable<CnPageContainerProps["maxWidth"]>;

export type CnPageContainerSkeletonContent = "blocks" | "cards" | "table" | false;

export type CnPageContainerSkeletonProps = CnSkeletonCommonProps & {
  /** Número de breadcrumbs (o `true` = 3). */
  breadcrumbs?: boolean | number;
  /** Botón "atrás" junto al título. */
  back?: boolean;
  icon?: boolean | string;
  title?: boolean | string;
  subtitle?: boolean | string;
  /** Número de acciones del encabezado (o `true` = 2). */
  actions?: boolean | number;
  /** Pestañas bajo el título (o `true` = 3). */
  tabs?: boolean | number;
  /** Forma del contenido: bloques, rejilla de tarjetas, tabla o nada. */
  content?: CnPageContainerSkeletonContent;
  /** Tarjetas (con `content="cards"`) o filas (con `content="table"`). */
  items?: number;
  paper?: boolean;
  maxWidth?: PageMaxWidth;
};

const MAX_WIDTHS = { sm: 640, md: 960, lg: 1200, xl: 1536 };

const count = (value: boolean | number | undefined, fallback: number) =>
  typeof value === "number" ? value : value ? fallback : 0;

/** Skeleton de `CnPageContainer`: breadcrumbs, título, acciones, pestañas y contenido. */
export const CnPageContainerSkeleton = ({
  breadcrumbs = 3,
  back = false,
  icon = false,
  title = true,
  subtitle = true,
  actions = 2,
  tabs = false,
  content = "blocks",
  items,
  paper = false,
  maxWidth = false,
  animation,
  ariaLabel = "Cargando página",
  sx,
  className,
}: CnPageContainerSkeletonProps) => {
  const crumbs = count(breadcrumbs, 3);
  const actionCount = count(actions, 2);
  const tabCount = count(tabs, 3);
  const width =
    maxWidth === false ? undefined : typeof maxWidth === "number" ? maxWidth : MAX_WIDTHS[maxWidth];
  const hasHeader = Boolean(title || subtitle || back || icon || actionCount);

  const body = (() => {
    switch (content) {
      case "cards": {
        const n = items ?? 4;
        return (
          <Box
            data-cn-page-skeleton-content="cards"
            sx={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            }}
          >
            {Array.from({ length: n }, (_, i) => (
              <Box
                key={i}
                sx={{
                  p: "16px",
                  borderRadius: "var(--cn-radius-lg, 12px)",
                  border: "1px solid var(--cn-color-border, #dde0e4)",
                  backgroundColor: "var(--cn-color-surface, #ffffff)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <SkText width="50%" size={12} />
                <SkBlock width="60%" height={24} radius="var(--cn-radius-sm, 6px)" />
                <SkText width="70%" size={11} />
              </Box>
            ))}
          </Box>
        );
      }
      case "table": {
        const n = items ?? 5;
        return (
          <Box
            data-cn-page-skeleton-content="table"
            sx={{
              borderRadius: "var(--cn-radius-lg, 12px)",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: n + 1 }, (_, r) => (
              <Box
                key={r}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  gap: "16px",
                  alignItems: "center",
                  px: "16px",
                  height: r === 0 ? 40 : 48,
                  borderTop: r === 0 ? "none" : "1px solid var(--cn-color-border-subtle, #e9ecef)",
                  ...(r === 0 && { backgroundColor: "var(--cn-color-neutral-50, #f8f9fa)" }),
                }}
              >
                {[0, 1, 2, 3].map((c) => (
                  <SkText
                    key={c}
                    width={`${50 + ((r * 7 + c * 13) % 40)}%`}
                    size={r === 0 ? 11 : 13}
                  />
                ))}
              </Box>
            ))}
          </Box>
        );
      }
      case "blocks":
        return (
          <Box
            data-cn-page-skeleton-content="blocks"
            sx={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <SkBlock height={44} />
            <SkBlock height={180} />
          </Box>
        );
      default:
        return null;
    }
  })();

  return (
    <CnSkeletonGroup
      name="page-container"
      animation={animation}
      ariaLabel={ariaLabel}
      className={className}
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: width,
          mx: width ? "auto" : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {(crumbs > 0 || hasHeader || tabCount > 0) && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {crumbs > 0 && (
            <Box
              data-cn-page-skeleton-breadcrumbs
              sx={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              {Array.from({ length: crumbs }, (_, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <SkText width={i === crumbs - 1 ? 72 : 48 + ((i * 17) % 20)} size={12} />
                  {i < crumbs - 1 && <SkBlock width={6} height={8} radius={2} />}
                </Box>
              ))}
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
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                {back && <SkBlock width={34} radius="var(--cn-radius-md, 8px)" />}
                {icon && <SkBlock width={40} radius="var(--cn-radius-md, 8px)" />}
                <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {title && <SkBlock width={220} height={24} radius="var(--cn-radius-sm, 6px)" />}
                  {subtitle && <SkText width={180} size={12} />}
                </Box>
              </Box>
              {actionCount > 0 && (
                <Box
                  data-cn-page-skeleton-actions
                  sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                >
                  {Array.from({ length: actionCount }, (_, i) => (
                    <SkBlock
                      key={i}
                      width={i === actionCount - 1 ? 96 : 84 + ((i * 11) % 16)}
                      height={36}
                      radius="var(--cn-radius-md, 8px)"
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
          {tabCount > 0 && (
            <Box
              data-cn-page-skeleton-tabs
              sx={{ display: "flex", borderBottom: "1px solid var(--cn-color-border, #dde0e4)" }}
            >
              {Array.from({ length: tabCount }, (_, i) => (
                <Box key={i} sx={{ position: "relative", px: "12px", py: "12px" }}>
                  <SkText width={52 + ((i * 19) % 24)} size={13} />
                  {i === 0 && (
                    <SkBlock
                      width="100%"
                      height={2}
                      radius={2}
                      sx={{ position: "absolute", left: 0, bottom: -1 }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      {body && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            ...(paper && {
              padding: { xs: "16px", sm: "24px" },
              borderRadius: "var(--cn-radius-lg, 12px)",
              border: "1px solid var(--cn-color-border, #dde0e4)",
              backgroundColor: "var(--cn-color-surface, #ffffff)",
            }),
          }}
        >
          {body}
        </Box>
      )}
    </CnSkeletonGroup>
  );
};
