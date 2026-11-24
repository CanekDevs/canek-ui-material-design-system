import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sources = [
  "../src/styles/tokens.ref.css",
  "../src/styles/tokens.sys.css",
  "../src/styles/tokens.css",
].map((path) => resolve(__dirname, path));
const target = resolve(__dirname, "../dist/tokens.css");

const contents = await Promise.all(sources.map((path) => readFile(path, "utf8")));
await mkdir(dirname(target), { recursive: true });
await writeFile(target, contents.join("\n"));
console.log("Copied tokens.ref.css + tokens.sys.css + tokens.css to dist/tokens.css");
