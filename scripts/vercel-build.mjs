/**
 * Explicit Vercel build entry — avoids bare `vite` on PATH (exit 127).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");

if (!existsSync(viteBin)) {
  console.error(
    "[vercel-build] vite missing at",
    viteBin,
    "\nRun `npm ci` first. Ensure package.json lists vite in dependencies.",
  );
  process.exit(127);
}

console.log("[vercel-build] using", viteBin);
const result = spawnSync(process.execPath, [viteBin, "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
