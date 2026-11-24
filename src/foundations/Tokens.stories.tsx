import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties, ReactNode } from "react";
import { sys, sysVar, typeAlias } from "@/tokens/sys";
import type { CnSysColor } from "@/tokens/sys";

const meta: Meta = {
  title: "Fundamentos/Tokens",
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj;

const pairs: Partial<Record<CnSysColor, CnSysColor>> = {
  primary: "on-primary",
  brand: "on-brand",
  "success-fill": "on-success",
  "warning-fill": "on-warning",
  "error-fill": "on-error",
  "info-fill": "on-info",
  surface: "on-surface",
  background: "on-surface",
  navbar: "on-navbar",
};

const groups: { title: string; roles: CnSysColor[] }[] = [
  {
    title: "Acción y marca",
    roles: [
      "primary",
      "primary-hover",
      "primary-container",
      "brand",
      "brand-dark",
      "brand-light",
      "brand-container",
      "navbar",
    ],
  },
  {
    title: "Superficies y texto",
    roles: [
      "background",
      "surface",
      "surface-container",
      "surface-container-high",
      "outline",
      "outline-strong",
    ],
  },
  {
    title: "Estados",
    roles: [
      "success",
      "success-fill",
      "success-container",
      "warning",
      "warning-fill",
      "warning-container",
      "error",
      "error-fill",
      "error-container",
      "info",
      "info-fill",
      "info-container",
    ],
  },
];

const textRoles: CnSysColor[] = [
  "text-title",
  "on-surface",
  "on-surface-variant",
  "text-muted",
  "success-text",
  "warning-text",
  "error-text",
  "info-text",
  "link",
  "disabled",
];

const luminance = (hex: string) => {
  const channels = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (a: string, b: string) => {
  if (!a.startsWith("#") || !b.startsWith("#")) return null;
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const label: CSSProperties = {
  fontFamily: sysVar("type-label-medium-font"),
  fontSize: sysVar("type-label-medium-size"),
  fontWeight: sysVar("type-label-medium-weight"),
  color: sysVar("color-on-surface"),
};

const caption: CSSProperties = {
  fontFamily: sysVar("type-body-small-font"),
  fontSize: sysVar("type-body-small-size"),
  color: sysVar("color-on-surface-variant"),
};

const Panel = ({ mode, children }: { mode: "light" | "dark"; children: ReactNode }) => (
  <div
    data-cn-theme={mode}
    style={{
      background: sysVar("color-background"),
      padding: 24,
      flex: "1 1 520px",
      minWidth: 0,
    }}
  >
    <div
      style={{
        ...label,
        fontSize: sysVar("type-title-medium-size"),
        fontWeight: sysVar("type-title-medium-weight"),
        marginBottom: 16,
      }}
    >
      {mode === "light" ? "Claro (marca)" : "Oscuro (derivado)"}
    </div>
    {children}
  </div>
);

const Swatch = ({ mode, role }: { mode: "light" | "dark"; role: CnSysColor }) => {
  const value = sys.color[mode][role];
  const on = pairs[role];
  const ratio = on ? contrast(sys.color[mode][on], value) : null;
  return (
    <div
      style={{
        border: `1px solid ${sysVar("color-outline")}`,
        borderRadius: sysVar("shape-corner-sm"),
        overflow: "hidden",
        background: sysVar("color-surface"),
      }}
    >
      <div
        style={{
          background: sysVar(`color-${role}`),
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: on ? sysVar(`color-${on}`) : undefined,
          fontFamily: sysVar("type-label-large-font"),
          fontSize: sysVar("type-label-large-size"),
          fontWeight: sysVar("type-label-large-weight"),
          textTransform: "uppercase",
        }}
      >
        {on ? "Texto" : null}
      </div>
      <div style={{ padding: 8 }}>
        <div style={label}>{role}</div>
        <div style={caption}>{value}</div>
        {ratio ? (
          <div
            style={{
              ...caption,
              color: sysVar(ratio >= 4.5 ? "color-success-text" : "color-error-text"),
            }}
          >
            {`${on} ${ratio.toFixed(2)}:1`}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ColorPanel = ({ mode }: { mode: "light" | "dark" }) => (
  <Panel mode={mode}>
    {groups.map(({ title, roles }) => (
      <section key={title} style={{ marginBottom: 24 }}>
        <div style={{ ...caption, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          {title}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 12,
          }}
        >
          {roles.map((role) => (
            <Swatch key={role} mode={mode} role={role} />
          ))}
        </div>
      </section>
    ))}
    <section>
      <div style={{ ...caption, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Texto sobre surface
      </div>
      <div
        style={{
          background: sysVar("color-surface"),
          borderRadius: sysVar("shape-corner-md"),
          padding: 16,
          display: "grid",
          gap: 6,
        }}
      >
        {textRoles.map((role) => {
          const ratio = contrast(sys.color[mode][role], sys.color[mode].surface);
          return (
            <div key={role} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span
                style={{
                  color: sysVar(`color-${role}`),
                  fontFamily: sysVar("type-body-large-font"),
                  fontSize: sysVar("type-body-large-size"),
                }}
              >
                {role}
              </span>
              <span style={caption}>{ratio ? `${ratio.toFixed(2)}:1` : sys.color[mode][role]}</span>
            </div>
          );
        })}
      </div>
    </section>
  </Panel>
);

export const Color: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <ColorPanel mode="light" />
      <ColorPanel mode="dark" />
    </div>
  ),
};

const roleAliases = (role: string) =>
  Object.entries(typeAlias)
    .filter(([, value]) => value === role)
    .map(([name]) => name)
    .join(", ");

export const Tipografia: Story = {
  name: "Tipografía",
  render: () => (
    <Panel mode="light">
      <div style={{ display: "grid", gap: 4 }}>
        {Object.entries(sys.type).map(([role, style]) => (
          <div
            key={role}
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              gap: 16,
              alignItems: "baseline",
              padding: "12px 0",
              borderBottom: `1px solid ${sysVar("color-outline")}`,
            }}
          >
            <div>
              <div style={label}>{role}</div>
              <div style={caption}>
                {`${style.fontSize} / ${style.fontWeight} / ${style.lineHeight}`}
              </div>
              <div style={caption}>{`Alias: ${roleAliases(role)}`}</div>
            </div>
            <div
              style={{
                fontFamily: sysVar(`type-${role}-font`),
                fontSize: sysVar(`type-${role}-size`),
                fontWeight: sysVar(`type-${role}-weight`),
                lineHeight: sysVar(`type-${role}-line-height`),
                textTransform: sysVar(`type-${role}-transform`) as CSSProperties["textTransform"],
                color: sysVar("color-text-title"),
              }}
            >
              Gestión de talento
            </div>
          </div>
        ))}
      </div>
    </Panel>
  ),
};

export const FormaYElevacion: Story = {
  name: "Forma y elevación",
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {(["light", "dark"] as const).map((mode) => (
        <Panel key={mode} mode={mode}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            {Object.entries(sys.shape).map(([name, value]) => (
              <div
                key={name}
                style={{
                  width: 110,
                  height: 72,
                  background: sysVar("color-primary-container"),
                  border: `1px solid ${sysVar("color-primary")}`,
                  borderRadius: sysVar(`shape-${name}`),
                  padding: 8,
                }}
              >
                <div style={label}>{name}</div>
                <div style={caption}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {Object.keys(sys.elevation).map((name) => (
              <div
                key={name}
                style={{
                  width: 110,
                  height: 72,
                  background: sysVar("color-surface"),
                  borderRadius: sysVar("shape-corner-md"),
                  boxShadow: sysVar(`elevation-${name}`),
                  padding: 8,
                }}
              >
                <div style={label}>{name}</div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  ),
};
