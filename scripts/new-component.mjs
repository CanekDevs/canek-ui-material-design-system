/**
 * Genera el esqueleto de un componente nuevo con la definición de terminado de AGENTS.md:
 *
 *   npm run new:component -- CnNombre --category <categoria> [--entry index|charts|rich-text] [--dry-run]
 *
 * Crea src/components/CnNombre/ (componente, skeleton, historias con catalogDocs + Responsive,
 * pruebas e index.ts), agrega una entrada PENDIENTE al catálogo, el export en la entrada pública y
 * una línea en CHANGELOG "Sin publicar". Después imprime la lista de lo que falta.
 *
 * Sin dependencias: solo Node. Trabaja sobre el directorio actual (la raíz del repo).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CATEGORIES = {
  fundamentos: { file: "actions-feedback.ts", story: "Components", label: "Fundamentos" },
  acciones: { file: "actions-feedback.ts", story: "Components", label: "Acciones" },
  retroalimentacion: { file: "actions-feedback.ts", story: "Feedback", label: "Retroalimentación" },
  formularios: { file: null, story: "Forms", label: "Formularios" },
  datos: { file: "data.ts", story: "Data Display", label: "Datos" },
  graficas: { file: "data.ts", story: "Charts", label: "Gráficas" },
  superposiciones: { file: "layout-overlays.ts", story: "Overlays", label: "Superposiciones" },
  navegacion: { file: "layout-overlays.ts", story: "Layout", label: "Navegación" },
  layout: { file: "layout-overlays.ts", story: "Layout", label: "Layout" },
  contenido: { file: "content-media.ts", story: "Data Display", label: "Contenido" },
  medios: { file: "content-media.ts", story: "Data Display", label: "Medios" },
  ia: { file: "ai.ts", story: "AI", label: "IA" },
};
const ENTRIES = {
  index: "src/index.ts",
  charts: "src/charts.ts",
  "rich-text": "src/rich-text.tsx",
};

const fail = (message) => {
  console.error(`\n  ✗ ${message}\n`);
  console.error(
    "  Uso: npm run new:component -- CnNombre --category <categoria> [--entry index|charts|rich-text] [--dry-run]",
  );
  console.error(`  Categorías: ${Object.keys(CATEGORIES).join(", ")}\n`);
  process.exit(1);
};

// ─── Argumentos ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const name = args.find(
  (arg) =>
    !arg.startsWith("--") &&
    !Object.keys(CATEGORIES).includes(arg) &&
    !Object.keys(ENTRIES).includes(arg),
);
const category = flag("category");
const entry = flag("entry") ?? "index";
const dryRun = args.includes("--dry-run");

if (!name) fail("Falta el nombre del componente.");
if (!/^Cn[A-Z][A-Za-z0-9]+$/.test(name))
  fail(`"${name}" debe ser PascalCase con prefijo Cn (p. ej. CnPriceTag).`);
if (!category || !(category in CATEGORIES)) fail(`Categoría inválida: "${category ?? ""}".`);
if (!(entry in ENTRIES)) fail(`Entrada inválida: "${entry}".`);

const root = process.cwd();
const dir = join(root, "src", "components", name);
if (existsSync(dir))
  fail(`Ya existe src/components/${name}. Extiende ese componente en lugar de crear otro.`);

const kebab = name
  .slice(2)
  .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
  .toLowerCase();
const skeletonName = `${name}Skeleton`;
const meta = CATEGORIES[category];
const entriesFile =
  meta.file ?? (name.slice(2, 3).toUpperCase() <= "L" ? "forms-a.ts" : "forms-b.ts");

// ─── Plantillas ─────────────────────────────────────────────────────
const componentTsx = `import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { forwardRef } from "react";
import { ${skeletonName} } from "./${skeletonName}";

export type ${name}Props = {
  /** Título visible. */
  title: ReactNode;
  /** Texto secundario bajo el título. */
  description?: ReactNode;
  children?: ReactNode;
  /** Muestra el skeleton con las mismas medidas que el componente real. */
  skeleton?: boolean;
  sx?: SxProps<Theme>;
  className?: string;
};

/** PENDIENTE: una línea que diga qué es (la misma idea que \`summary\` en el catálogo). */
export const ${name} = forwardRef<HTMLDivElement, ${name}Props>(function ${name}(
  { title, description, children, skeleton = false, sx, className },
  ref,
) {
  if (skeleton) return <${skeletonName} description={Boolean(description)} sx={sx} className={className} />;

  return (
    <Box
      ref={ref}
      data-cn-${kebab}
      className={className}
      sx={[
        {
          // Nunca desbordar: minWidth 0 + maxWidth 100% y textos que parten palabras largas.
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          p: "16px",
          border: "1px solid var(--cn-color-border, #dde0e4)",
          borderRadius: "var(--cn-radius-md, 8px)",
          backgroundColor: "var(--cn-color-surface, #ffffff)",
          color: "var(--cn-color-text, #222831)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography
        component="h3"
        sx={{ m: 0, fontSize: "15px", fontWeight: 600, overflowWrap: "anywhere" }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            m: 0,
            fontSize: "13px",
            color: "var(--cn-color-text-muted, #6e7682)",
            overflowWrap: "anywhere",
          }}
        >
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
});
`;

const skeletonTsx = `import Box from "@mui/material/Box";
import type { CnSkeletonCommonProps } from "../CnSkeleton";
import { CnSkeletonGroup, SkText } from "../CnSkeleton";

export type ${skeletonName}Props = CnSkeletonCommonProps & {
  /** Línea de descripción bajo el título. */
  description?: boolean;
};

/** Skeleton de \`${name}\`: mismas medidas y disposición que el componente real. */
export const ${skeletonName} = ({
  description = true,
  animation,
  ariaLabel = "Cargando",
  sx,
  className,
}: ${skeletonName}Props) => (
  <CnSkeletonGroup
    name="${kebab}"
    animation={animation}
    ariaLabel={ariaLabel}
    className={className}
    sx={[
      {
        p: "16px",
        border: "1px solid var(--cn-color-border, #dde0e4)",
        borderRadius: "var(--cn-radius-md, 8px)",
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <SkText width="45%" size={15} />
      {description && <SkText width="70%" size={13} />}
    </Box>
  </CnSkeletonGroup>
);
`;

const storiesTsx = `import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/react";
import { catalogDocs } from "../../catalog";
import { ${name} } from "./${name}";
import { ${skeletonName} } from "./${skeletonName}";

const meta: Meta<typeof ${name}> = {
  title: "${meta.story}/${name}",
  component: ${name},
  tags: ["autodocs"],
  parameters: { docs: { description: { component: catalogDocs("${name}") } } },
  args: {
    title: "Resumen del pedido",
    description: "Tres artículos, entrega estimada el jueves.",
  },
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => (
    <Box sx={{ display: "grid", gap: "16px", maxWidth: 480 }}>
      <${skeletonName} />
      <${name} skeleton title="" />
    </Box>
  ),
};

const LONG =
  "Comercializadora Internacional de Productos Industriales y Servicios Logísticos del Bajío, S.A.P.I. de C.V.";

/** Datos extremos (textos de 100+ caracteres, palabras sin espacios, vacío) a 320, 480 y 1200 px. */
export const Responsive: Story = {
  parameters: { maxWidth: "none" },
  render: () => (
    <Box sx={{ display: "grid", gap: "24px" }}>
      {[320, 480, 1200].map((width) => (
        <Box key={width} data-stress-width={width} sx={{ width }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {width}px
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: "12px",
              border: "1px dashed var(--cn-color-border, #dde0e4)",
              p: "4px",
            }}
          >
            <${name} title={LONG} description={LONG} />
            <${name} title="SinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspaciosSinEspacios" />
            <${name} title="" />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};
`;

const testTsx = `import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ${name} } from "./${name}";
import { ${skeletonName} } from "./${skeletonName}";

describe("${name}", () => {
  it("muestra el título y la descripción", () => {
    render(<${name} title="Resumen" description="Tres artículos" />);
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByText("Tres artículos")).toBeInTheDocument();
  });

  it("con skeleton muestra un único estado de carga accesible", () => {
    render(<${name} skeleton title="Resumen" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Resumen")).not.toBeInTheDocument();
  });

  it("acepta textos extremos sin perderlos", () => {
    const long = "x".repeat(300);
    render(<${name} title={long} />);
    expect(screen.getByText(long)).toBeInTheDocument();
  });

  it.todo("teclado: foco visible, orden de tabulación y atajos");
  it.todo("casos límite: vacío, deshabilitado, error y datos remotos");
});

describe("${skeletonName}", () => {
  it("expone su nombre en data-cn-skeleton", () => {
    render(<${skeletonName} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-cn-skeleton", "${kebab}");
  });
});
`;

const indexTs = `export { ${name} } from "./${name}";
export type { ${name}Props } from "./${name}";
export { ${skeletonName} } from "./${skeletonName}";
export type { ${skeletonName}Props } from "./${skeletonName}";
`;

const catalogStub = `  {
    name: "${name}",
    category: "${category}",
    domains: ["general"],
    status: "beta",
    // PENDIENTE: completar las tres secciones. La prueba de gobierno del catálogo falla mientras
    // los textos sean cortos o no nombren componentes alternativos entre backticks.
    summary: "PENDIENTE",
    purpose: "PENDIENTE",
    whenNot: "PENDIENTE",
    neighbors: "PENDIENTE",
    related: ["${skeletonName}"],
  },
`;

// ─── Escritura ──────────────────────────────────────────────────────
const writes = [];
const plan = (path, content) => writes.push({ path, content });

plan(join(dir, `${name}.tsx`), componentTsx);
plan(join(dir, `${skeletonName}.tsx`), skeletonTsx);
plan(join(dir, `${name}.stories.tsx`), storiesTsx);
plan(join(dir, `${name}.test.tsx`), testTsx);
plan(join(dir, "index.ts"), indexTs);

// Catálogo: antes del cierre del arreglo del archivo de la categoría.
const catalogPath = join(root, "src", "catalog", "entries", entriesFile);
const catalogIndexPath = join(root, "src", "catalog", "index.ts");
let catalogText;
if (existsSync(catalogPath)) {
  catalogText = readFileSync(catalogPath, "utf8");
} else if (entriesFile === "ai.ts") {
  // Primer componente de IA: crea el archivo de entradas y lo registra en el catálogo.
  catalogText = `import type { CnCatalogEntry } from "../types";\n\n/** Interfaces de IA: chat, agentes y herramientas. */\nexport const CATALOG_AI: CnCatalogEntry[] = [];\n`;
  const indexText = readFileSync(catalogIndexPath, "utf8");
  plan(
    catalogIndexPath,
    indexText
      .replace(
        /(import type \{ CnCatalogEntry \})/,
        'import { CATALOG_AI } from "./entries/ai";\n$1',
      )
      .replace(/(export const CN_CATALOG[^=]*=\s*\[)/, "$1\n  ...CATALOG_AI,"),
  );
} else {
  fail(`No existe src/catalog/entries/${entriesFile}.`);
}
if (catalogText.includes(`name: "${name}"`)) fail(`${name} ya tiene entrada en ${entriesFile}.`);
const close = catalogText.lastIndexOf("];");
if (close < 0) fail(`No encontré el cierre "];" en ${entriesFile}.`);
const beforeClose = catalogText.slice(0, close);
const opened = /\[\s*$/.test(beforeClose);
plan(
  catalogPath,
  opened
    ? `${beforeClose.replace(/\[\s*$/, "[\n")}${catalogStub}${catalogText.slice(close)}`
    : `${beforeClose.replace(/\s*$/, "\n")}${catalogStub}${catalogText.slice(close)}`,
);

// Entrada pública.
const entryPath = join(root, ENTRIES[entry]);
const entryText = readFileSync(entryPath, "utf8");
const exportLine = `export * from "./components/${name}";`;
if (!entryText.includes(exportLine)) {
  plan(entryPath, `${entryText.replace(/\s*$/, "\n")}\n// ${meta.label}\n${exportLine}\n`);
}

// CHANGELOG: primera línea de "Agregado" dentro de "Sin publicar".
const changelogPath = join(root, "CHANGELOG.md");
const changelog = readFileSync(changelogPath, "utf8");
const unreleased = changelog.indexOf("## [Sin publicar]");
if (unreleased < 0) fail('CHANGELOG.md no tiene la sección "## [Sin publicar]".');
const nextRelease = changelog.indexOf("\n## [", unreleased + 1);
const sectionEnd = nextRelease < 0 ? changelog.length : nextRelease;
const added = changelog.indexOf("### Agregado", unreleased);
const line = `- \`${name}\`: PENDIENTE describir qué agrega. Con su skeleton y prop \`skeleton\`.\n`;
/** Índice justo después del encabezado y de las líneas en blanco que lo siguen. */
const afterHeading = (index, heading) => {
  const rest = changelog.slice(index + heading.length);
  const blank = /^(\s*\r?\n)*/.exec(rest);
  return index + heading.length + (blank ? blank[0].length : 0);
};
if (added >= 0 && added < sectionEnd) {
  const at = afterHeading(added, "### Agregado");
  plan(changelogPath, `${changelog.slice(0, at)}${line}${changelog.slice(at)}`);
} else {
  const at = afterHeading(unreleased, "## [Sin publicar]");
  plan(changelogPath, `${changelog.slice(0, at)}### Agregado\n\n${line}\n${changelog.slice(at)}`);
}

const inRoadmap = readFileSync(join(root, "src", "catalog", "roadmap.ts"), "utf8").includes(
  `name: "${name}"`,
);

// Los archivos nuevos salen con el formato del repo (Prettier ya es devDependency).
const created = new Set([...writes.map(({ path }) => path)].filter((path) => !existsSync(path)));
try {
  const prettier = await import("prettier");
  for (const item of writes) {
    if (!created.has(item.path)) continue;
    const options = (await prettier.resolveConfig(item.path)) ?? {};
    item.content = await prettier.format(item.content, { ...options, filepath: item.path });
  }
} catch {
  console.warn("  (Prettier no disponible: ejecuta npm run format sobre la carpeta nueva)");
}

if (!dryRun) {
  mkdirSync(dir, { recursive: true });
  for (const { path, content } of writes) writeFileSync(path, content);
}

const rel = (path) =>
  path
    .slice(root.length + 1)
    .split("\\")
    .join("/");
console.log(`\n  ${dryRun ? "[simulación] " : ""}${name} (${meta.label}, entrada "${entry}")\n`);
for (const { path } of writes)
  console.log(`  ${existsSync(path) && !dryRun ? "✓" : "·"} ${rel(path)}`);
console.log(`
  Pendiente para cumplir la definición de terminado (AGENTS.md):

  [ ] Probar el hueco: ¿ningún componente existente lo cubre con una prop nueva? (regla de utilidad)
  [ ] Catálogo: completar summary, purpose, whenNot y neighbors en src/catalog/entries/${entriesFile}
      (dominios reales y nombres \`CnX\` entre backticks)${inRoadmap ? `\n  [ ] Quitar ${name} de src/catalog/roadmap.ts (ya no es planeado)` : ""}
  [ ] API: props en español con JSDoc, tokens (var(--cn-*)) y nada de hex sueltos
  [ ] Skeleton fiel a las medidas reales; prop \`skeleton\`
  [ ] Historias: variantes, estados y Responsive validado a 320/480/1200 con datos extremos
  [ ] Pruebas: a11y (roles, nombres), teclado, casos límite; quitar los it.todo
  [ ] Sin desbordes: minWidth 0, overflowWrap, sx con "px" en strings (no números)
  [ ] README: sección de uso; CHANGELOG: describir la línea PENDIENTE
  [ ] npm run docs:catalog   (README, docs/catalog.json, docs/ROADMAP.md)
  [ ] npm run verify:all     (tipos, lint, pruebas, build y Storybook)
`);
