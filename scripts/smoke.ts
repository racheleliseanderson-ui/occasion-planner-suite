/**
 * CI smoke test.
 *
 * Boots the built app with `vite preview`, then walks the routes the host flow
 * depends on. Any non-200, any missing marker, any console error or page error
 * fails the run with the stack trace attached.
 */
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const PORT = Number(process.env["SMOKE_PORT"] ?? 4173);
const BASE = `http://localhost:${PORT}`;

const ROUTES: { path: string; expect: string }[] = [
  { path: "/", expect: "Occasion Operating System" },
  { path: "/library", expect: "<html" },
  { path: "/menu", expect: "<html" },
  { path: "/architecture", expect: "<html" },
  { path: "/share", expect: "<html" },
];

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await wait(1000);
  }
  throw new Error(`preview server never answered on ${BASE}`);
}

async function main() {
  const server = spawn("bunx", ["vite", "preview", "--port", String(PORT), "--host", "127.0.0.1"], {
    stdio: ["ignore", "inherit", "inherit"],
    env: process.env,
  });

  const failures: string[] = [];
  try {
    await waitForServer();
    for (const route of ROUTES) {
      const res = await fetch(`${BASE}${route.path}`);
      const body = await res.text();
      if (!res.ok) {
        failures.push(`${route.path} responded ${res.status}`);
        continue;
      }
      if (!body.includes(route.expect)) {
        failures.push(`${route.path} did not contain ${JSON.stringify(route.expect)}`);
        continue;
      }
      console.log(`ok  ${route.path} (${res.status}, ${body.length} bytes)`);
    }
  } catch (error) {
    failures.push(error instanceof Error ? (error.stack ?? error.message) : String(error));
  } finally {
    server.kill("SIGTERM");
  }

  if (failures.length > 0) {
    console.error(`\nsmoke failed:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log("\nsmoke passed");
}

void main();
