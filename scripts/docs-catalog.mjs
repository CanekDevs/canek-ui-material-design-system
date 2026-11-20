/**
 * Regenera la documentación derivada del catálogo y de las reglas de gobierno:
 * - README.md (bloque entre <!-- catalog:start --> y <!-- catalog:end -->)
 * - docs/catalog.json y docs/ROADMAP.md
 * - docs/governance/colores-hardcodeados.md (y baja la línea base de colores si mejoró)
 *
 * Corre las pruebas generadoras de src/__governance__ en modo escritura (CN_GOVERNANCE_WRITE=1),
 * así la lógica vive en un solo lugar y la misma prueba falla en CI si algo quedó desactualizado.
 *
 *   npm run docs:catalog
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vitest = resolve(root, "node_modules", "vitest", "vitest.mjs");

const result = spawnSync(
  process.execPath,
  [vitest, "run", "src/__governance__/catalog-docs.test.ts", "src/__governance__/colors.test.ts"],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, CN_GOVERNANCE_WRITE: "1" },
  },
);

process.exit(result.status ?? 1);
