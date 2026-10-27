import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = resolve(__dirname, "../src/styles/tokens.css");
const target = resolve(__dirname, "../dist/tokens.css");

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
console.log("Copied tokens.css to dist/");
