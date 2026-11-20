// @vitest-environment node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";
import { CN_CATALOG } from "../catalog";
import { CN_ROADMAP } from "../catalog/roadmap";
import type { CnRoadmapItem } from "../catalog/roadmap";
import type { CnCatalogCategory, CnCatalogDomain, CnCatalogEntry } from "../catalog/types";

/*
 * Documentación generada desde `src/catalog`:
 * - `docs/catalog.json`: catálogo completo (para herramientas y agentes).
 * - Bloque del README entre `<!-- catalog:start -->` y `<!-- catalog:end -->`.
 * - `docs/ROADMAP.md`: componentes planeados (`src/catalog/roadmap.ts`).
 *
 * `npm run docs:catalog` corre esta prueba con CN_GOVERNANCE_WRITE=1 y reescribe los archivos.
 * Sin esa variable, la prueba falla si alguno está desactualizado.
 */
const ROOT = process.cwd();
const WRITE = process.env.CN_GOVERNANCE_WRITE === "1";
const README = join(ROOT, "README.md");
const CATALOG_JSON = join(ROOT, "docs", "catalog.json");
const ROADMAP_MD = join(ROOT, "docs", "ROADMAP.md");
const START = "<!-- catalog:start -->";
const END = "<!-- catalog:end -->";
const REGENERATE = "Ejecuta `npm run docs:catalog` y versiona el resultado.";

const CATEGORY_LABELS: Record<CnCatalogCategory, string> = {
  fundamentos: "Fundamentos",
  acciones: "Acciones",
  formularios: "Formularios",
  datos: "Datos",
  graficas: "Gráficas",
  retroalimentacion: "Retroalimentación",
  superposiciones: "Superposiciones",
  navegacion: "Navegación",
  layout: "Layout",
  contenido: "Contenido",
  medios: "Medios",
  ia: "IA",
};
const DOMAIN_LABELS: Record<CnCatalogDomain, string> = {
  general: "General",
  erp: "ERP",
  crm: "CRM",
  cms: "CMS",
  ecommerce: "E-commerce",
  pos: "Punto de venta",
  reservas: "Reservas",
  pagos: "Pagos",
  rrhh: "RR. HH.",
  landing: "Landing",
  dashboards: "Tableros",
  ia: "IA",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as CnCatalogCategory[];
const DOMAINS = Object.keys(DOMAIN_LABELS) as CnCatalogDomain[];
const PRIORITIES: CnRoadmapItem["priority"][] = ["alta", "media", "baja"];

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const domainsText = (domains: CnCatalogDomain[]) =>
  domains.map((domain) => DOMAIN_LABELS[domain]).join(", ");
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
const count = <T>(items: T[], pick: (item: T) => boolean) => items.filter(pick).length;

const prettify = async (text: string, file: string) =>
  format(text, { ...(await resolveConfig(file)), filepath: file });

const COMPONENTS_DIR = join(ROOT, "src", "components");
const folders = readdirSync(COMPONENTS_DIR).filter((name) =>
  statSync(join(COMPONENTS_DIR, name)).isDirectory(),
);

// ─── Generadores ───────────────────────────────────────────────────

const catalogBlock = (catalog: CnCatalogEntry[], roadmap: CnRoadmapItem[]): string => {
  const lines = [
    START,
    "",
    "<!-- Generado por `npm run docs:catalog` desde `src/catalog`. No editar a mano. -->",
    "",
    `**${catalog.length} componentes documentados.** Cada uno tiene en Storybook las secciones *Para qué sirve*, *Cuándo NO usarlo* y *Relación con vecinos*. El catálogo completo en JSON está en [\`docs/catalog.json\`](./docs/catalog.json) y los ${roadmap.length} componentes planeados en [\`docs/ROADMAP.md\`](./docs/ROADMAP.md).`,
    "",
  ];
  for (const category of CATEGORIES) {
    const entries = catalog.filter((entry) => entry.category === category).sort(byName);
    if (!entries.length) continue;
    lines.push(
      `### ${CATEGORY_LABELS[category]} (${entries.length})`,
      "",
      "| Componente | Qué es | Dominios | Estado |",
      "| --- | --- | --- | --- |",
      ...entries.map(
        (entry) =>
          `| \`${entry.name}\` | ${cell(entry.summary)} | ${domainsText(entry.domains)} | ${entry.status} |`,
      ),
      "",
    );
  }
  lines.push(END);
  return lines.join("\n");
};

const roadmapMarkdown = (roadmap: CnRoadmapItem[], catalog: CnCatalogEntry[]): string => {
  const lines = [
    "# Hoja de ruta de componentes",
    "",
    "Archivo generado por `npm run docs:catalog` desde `src/catalog/roadmap.ts`. No editar a mano.",
    "",
    "Componentes **planeados** para cubrir sistemas ERP, CRM, CMS, e-commerce, landing pages, punto de",
    "venta, reservaciones, pagos, RR. HH., tableros e interfaces de IA. Antes de crear uno, revisa la",
    "columna *Por qué no basta lo existente*: si un componente actual puede extenderse, se extiende",
    "(ver `AGENTS.md`, regla de utilidad primero). Al implementarlo, su texto pasa al catálogo y sale",
    "de esta lista.",
    "",
    `Existentes: **${catalog.length}** · Planeados: **${roadmap.length}** (alta ${count(roadmap, (i) => i.priority === "alta")}, media ${count(roadmap, (i) => i.priority === "media")}, baja ${count(roadmap, (i) => i.priority === "baja")}).`,
    "",
    "## Resumen por categoría",
    "",
    "| Categoría | Planeados | Alta | Media | Baja |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const category of CATEGORIES) {
    const items = roadmap.filter((item) => item.category === category);
    if (!items.length) continue;
    lines.push(
      `| ${CATEGORY_LABELS[category]} | ${items.length} | ${PRIORITIES.map((p) => count(items, (i) => i.priority === p)).join(" | ")} |`,
    );
  }
  lines.push(
    "",
    "## Resumen por dominio",
    "",
    "Un componente puede servir a varios dominios.",
    "",
    "| Dominio | Planeados | Componentes |",
    "| --- | --- | --- |",
  );
  for (const domain of DOMAINS) {
    const items = roadmap.filter((item) => item.domains.includes(domain)).sort(byName);
    if (!items.length) continue;
    lines.push(
      `| ${DOMAIN_LABELS[domain]} | ${items.length} | ${items.map((item) => `\`${item.name}\``).join(", ")} |`,
    );
  }
  lines.push("");
  for (const category of CATEGORIES) {
    const items = roadmap
      .filter((item) => item.category === category)
      .sort(
        (a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || byName(a, b),
      );
    if (!items.length) continue;
    lines.push(
      `## ${CATEGORY_LABELS[category]}`,
      "",
      "| Componente | Prioridad | Dominios | Qué es | Por qué no basta lo existente | Depende de |",
      "| --- | --- | --- | --- | --- | --- |",
      ...items.map(
        (item) =>
          `| \`${item.name}\` | ${item.priority} | ${domainsText(item.domains)} | ${cell(item.summary)} | ${cell(item.gap)} | ${item.dependsOn.map((dep) => `\`${dep}\``).join(", ") || "—"} |`,
      ),
      "",
    );
  }
  return lines.join("\n");
};

const catalogJson = (catalog: CnCatalogEntry[]) =>
  JSON.stringify(
    {
      $comment: "Generado por `npm run docs:catalog` desde src/catalog. No editar a mano.",
      total: catalog.length,
      entries: [...catalog].sort(
        (a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || byName(a, b),
      ),
    },
    null,
    2,
  );

// ─── Pruebas ───────────────────────────────────────────────────────

const syncFile = async (file: string, expected: string, stale: string[]) => {
  const formatted = await prettify(expected, file);
  const actual = existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
  if (actual === formatted) return;
  if (WRITE) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, formatted);
  } else {
    stale.push(file.slice(ROOT.length + 1));
  }
};

describe("documentación generada del catálogo", () => {
  it("README, docs/catalog.json y docs/ROADMAP.md están al día", async () => {
    const stale: string[] = [];
    await syncFile(CATALOG_JSON, catalogJson(CN_CATALOG), stale);
    await syncFile(ROADMAP_MD, roadmapMarkdown(CN_ROADMAP, CN_CATALOG), stale);

    const readme = readFileSync(README, "utf8").replace(/\r\n/g, "\n");
    const start = readme.indexOf(START);
    const end = readme.indexOf(END);
    expect(start, "README sin marcadores del catálogo").toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const block = (await prettify(catalogBlock(CN_CATALOG, CN_ROADMAP), "catalog-block.md")).trim();
    if (readme.slice(start, end + END.length) !== block) {
      if (WRITE)
        writeFileSync(README, readme.slice(0, start) + block + readme.slice(end + END.length));
      else stale.push("README.md (bloque del catálogo)");
    }
    expect(stale, REGENERATE).toEqual([]);
  });
});

describe("hoja de ruta", () => {
  const existing = new Set([
    ...folders,
    ...CN_CATALOG.flatMap((entry) => [entry.name, ...(entry.related ?? [])]),
  ]);
  const planned = new Set(CN_ROADMAP.map((item) => item.name));

  it("no tiene nombres duplicados y usa el prefijo Cn", () => {
    const names = CN_ROADMAP.map((item) => item.name);
    expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([]);
    expect(names.filter((name) => !/^Cn[A-Z][A-Za-z0-9]+$/.test(name))).toEqual([]);
  });

  it("no lista componentes que ya existen (muévelos al catálogo)", () => {
    expect(CN_ROADMAP.map((item) => item.name).filter((name) => existing.has(name))).toEqual([]);
  });

  it("sus dependencias existen o están planeadas", () => {
    const unknown = CN_ROADMAP.flatMap((item) =>
      item.dependsOn
        .filter((dep) => !existing.has(dep) && !planned.has(dep))
        .map((dep) => `${item.name} → ${dep}`),
    );
    expect(unknown).toEqual([]);
  });

  it("cada elemento explica qué es y por qué no basta lo existente", () => {
    const weak = CN_ROADMAP.filter(
      (item) =>
        item.summary.trim().length < 20 ||
        item.gap.trim().length < 40 ||
        item.domains.length === 0 ||
        item.dependsOn.includes(item.name),
    ).map((item) => item.name);
    expect(weak).toEqual([]);
  });
});
