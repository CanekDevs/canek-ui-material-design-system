import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "tokens/base.tokens.json");
const cssPath = resolve(root, "src/styles/tokens.ref.css");
const tsPath = resolve(root, "src/tokens/ref.ts");

const source = JSON.parse(await readFile(sourcePath, "utf8"));

const PREFIX = "--cn-ref-";
const HEADER =
  "Archivo generado por scripts/build-tokens.mjs desde tokens/base.tokens.json. No editar a mano.";

const toVar = (name) => `${PREFIX}${name}`;
const aliasPattern = /\{([a-z0-9-]+)\}/g;

const colorNames = new Set(source.color.tokens.map((token) => token.name));

const resolveCss = (value) =>
  String(value).replace(aliasPattern, (_, name) => {
    if (!colorNames.has(name)) throw new Error(`Alias desconocido: {${name}}`);
    return `var(${toVar(name)})`;
  });

const resolveLiteral = (name, seen = new Set()) => {
  if (seen.has(name)) throw new Error(`Alias circular: ${[...seen, name].join(" -> ")}`);
  const token = source.color.tokens.find((item) => item.name === name);
  return String(token.value).replace(aliasPattern, (_, inner) =>
    resolveLiteral(inner, new Set([...seen, name])),
  );
};

const groups = [
  { key: "color", tokens: source.color.tokens },
  { key: "space", tokens: source.spacing.tokens },
  { key: "radius", tokens: source.radius.tokens },
  { key: "shadow", tokens: source.shadow.tokens },
  { key: "size", tokens: source.size.tokens },
  { key: "opacity", tokens: source.opacity.tokens },
];

const typeStyles = source.type.groups.flatMap((group) =>
  group.styles.map((style) => ({ ...style, group: group.name })),
);

const cssLines = [`/* ${HEADER} */`, ":root {"];
for (const { key, tokens } of groups) {
  cssLines.push(`  /* ${key} */`);
  for (const token of tokens) cssLines.push(`  ${toVar(token.name)}: ${resolveCss(token.value)};`);
}
cssLines.push("  /* font */");
for (const [name, value] of Object.entries(source.type.families))
  cssLines.push(`  ${toVar(`font-${name}`)}: ${value};`);
cssLines.push("  /* type */");
for (const style of typeStyles) {
  cssLines.push(`  ${toVar(`type-${style.name}-size`)}: ${style.fontSize};`);
  cssLines.push(`  ${toVar(`type-${style.name}-weight`)}: ${style.fontWeight};`);
  cssLines.push(`  ${toVar(`type-${style.name}-line-height`)}: ${style.lineHeight};`);
}
cssLines.push("}", "");

const literalMap = (tokens, resolver) =>
  Object.fromEntries(tokens.map((token) => [token.name, resolver(token)]));

const ref = {
  color: literalMap(source.color.tokens, (token) => resolveLiteral(token.name)),
  space: literalMap(source.spacing.tokens, (token) => token.value),
  radius: literalMap(source.radius.tokens, (token) => token.value),
  shadow: literalMap(source.shadow.tokens, (token) => token.value),
  size: literalMap(source.size.tokens, (token) => token.value),
  opacity: literalMap(source.opacity.tokens, (token) => Number(token.value)),
  font: source.type.families,
  type: Object.fromEntries(
    typeStyles.map((style) => [
      style.name,
      { fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight },
    ]),
  ),
};

const ts = [
  `// ${HEADER}`,
  `export const refSource = ${JSON.stringify({ source: source.meta.source, ref: source.meta.ref, synced: source.meta.synced })} as const;`,
  "",
  `export const ref = ${JSON.stringify(ref, null, 2)} as const;`,
  "",
  "export type CnRefColor = keyof typeof ref.color;",
  "export type CnRefTypeStyle = keyof typeof ref.type;",
  "",
  `export const refVar = (name: string): string => \`var(${PREFIX}\${name})\`;`,
  "",
].join("\n");

await writeFile(cssPath, cssLines.join("\n"));
await writeFile(tsPath, ts);

const count =
  groups.reduce((total, group) => total + group.tokens.length, 0) + typeStyles.length * 3;
console.log(`Capa ref: ${count} variables -> src/styles/tokens.ref.css, src/tokens/ref.ts`);

const sys = JSON.parse(await readFile(resolve(root, "tokens/sys.tokens.json"), "utf8"));
const SYS = "--cn-sys-";
const SYS_HEADER =
  "Archivo generado por scripts/build-tokens.mjs desde tokens/sys.tokens.json. No editar a mano.";

const refLookup = new Map(
  [...groups.flatMap(({ tokens }) => tokens)].map((token) => [token.name, token.value]),
);
const sysCss = (value) =>
  String(value).replace(aliasPattern, (_, name) => {
    if (!refLookup.has(name)) throw new Error(`sys apunta a un ref inexistente: {${name}}`);
    return `var(${toVar(name)})`;
  });
const sysLiteral = (value) =>
  String(value).replace(aliasPattern, (_, name) =>
    colorNames.has(name) ? resolveLiteral(name) : sysLiteral(refLookup.get(name)),
  );

const scalarGroups = ["state", "shape", "elevation", "motion"];
const typeRoles = Object.entries(sys.type.roles).map(([role, def]) => {
  const style = typeStyles.find((item) => item.name === def.from);
  if (!style) throw new Error(`Rol ${role}: estilo base inexistente ${def.from}`);
  return { role, def, style };
});

const lightLines = [`/* ${SYS_HEADER} */`, ":root {"];
const darkLines = ['[data-cn-theme="dark"] {'];
for (const [name, def] of Object.entries(sys.color)) {
  lightLines.push(`  ${SYS}color-${name}: ${sysCss(def.light)};`);
  darkLines.push(`  ${SYS}color-${name}: ${sysCss(def.dark)};`);
}
for (const group of scalarGroups) {
  for (const [name, value] of Object.entries(sys[group])) {
    if (name === "note") continue;
    lightLines.push(`  ${SYS}${group}-${name}: ${sysCss(value)};`);
  }
}
for (const { role, def, style } of typeRoles) {
  lightLines.push(`  ${SYS}type-${role}-font: var(${toVar("font-sans")});`);
  lightLines.push(`  ${SYS}type-${role}-size: var(${toVar(`type-${style.name}-size`)});`);
  lightLines.push(`  ${SYS}type-${role}-weight: var(${toVar(`type-${style.name}-weight`)});`);
  lightLines.push(
    `  ${SYS}type-${role}-line-height: var(${toVar(`type-${style.name}-line-height`)});`,
  );
  lightLines.push(`  ${SYS}type-${role}-transform: ${def.textTransform ?? "none"};`);
}
lightLines.push("}", "");
darkLines.push("}", "");

const scalars = Object.fromEntries(
  scalarGroups.map((group) => [
    group,
    Object.fromEntries(
      Object.entries(sys[group])
        .filter(([name]) => name !== "note")
        .map(([name, value]) => [name, sysLiteral(value)]),
    ),
  ]),
);
const sysTs = {
  color: {
    light: Object.fromEntries(
      Object.entries(sys.color).map(([name, def]) => [name, sysLiteral(def.light)]),
    ),
    dark: Object.fromEntries(
      Object.entries(sys.color).map(([name, def]) => [name, sysLiteral(def.dark)]),
    ),
  },
  ...scalars,
  type: Object.fromEntries(
    typeRoles.map(({ role, def, style }) => [
      role,
      {
        fontFamily: source.type.families.sans,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        textTransform: def.textTransform ?? "none",
        source: def.from,
        alias: def.alias,
      },
    ]),
  ),
};

const sysTsFile = [
  `// ${SYS_HEADER}`,
  `export const sys = ${JSON.stringify(sysTs, null, 2)} as const;`,
  "",
  "export type CnSysColor = keyof typeof sys.color.light;",
  "export type CnSysTypeRole = keyof typeof sys.type;",
  "export type CnThemeMode = keyof typeof sys.color;",
  "",
  `export const sysVar = (name: string): string => \`var(${SYS}\${name})\`;`,
  "",
  "export const typeAlias: Record<string, CnSysTypeRole> = Object.fromEntries(",
  "  Object.entries(sys.type).flatMap(([role, def]) =>",
  "    def.alias.map((name) => [name, role as CnSysTypeRole]),",
  "  ),",
  ");",
  "",
].join("\n");

await writeFile(
  resolve(root, "src/styles/tokens.sys.css"),
  [...lightLines, ...darkLines].join("\n"),
);
await writeFile(resolve(root, "src/tokens/sys.ts"), sysTsFile);
console.log(
  `Capa sys: ${Object.keys(sys.color).length} roles de color (claro + oscuro), ${typeRoles.length} roles de texto -> src/styles/tokens.sys.css, src/tokens/sys.ts`,
);
