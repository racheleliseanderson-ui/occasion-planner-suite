/**
 * Run log.
 *
 * A small in-memory ring buffer that records what the conditions flow did and,
 * when something fails, the real stack trace. It runs in production as well as
 * development: a host who hits a failure on the day can copy the trace out of
 * the run console rather than describe it from memory.
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  at: number;
  level: LogLevel;
  scope: string;
  message: string;
  /** milliseconds, when the entry records timed work */
  ms?: number;
  /** full stack trace and cause chain, when the entry records a failure */
  stack?: string;
  detail?: Record<string, unknown>;
}

const LIMIT = 200;
const entries: LogEntry[] = [];
const listeners = new Set<(all: LogEntry[]) => void>();

function emit() {
  const snapshot = entries.slice();
  for (const fn of listeners) fn(snapshot);
}

export function subscribeLog(fn: (all: LogEntry[]) => void): () => void {
  listeners.add(fn);
  fn(entries.slice());
  return () => listeners.delete(fn);
}

export function readLog(): LogEntry[] {
  return entries.slice();
}

export function clearLog() {
  entries.length = 0;
  emit();
}

/** Message, stack and the full cause chain, flattened to one printable string. */
export function describeThrown(error: unknown): { message: string; stack: string } {
  const parts: string[] = [];
  let current: unknown = error;
  let message = "";
  for (let depth = 0; depth < 5 && current != null; depth++) {
    if (current instanceof Error) {
      if (depth === 0) message = `${current.name}: ${current.message}`;
      parts.push(`${depth === 0 ? "" : "caused by: "}${current.stack ?? `${current.name}: ${current.message}`}`);
      current = current.cause;
      continue;
    }
    const text = typeof current === "string" ? current : safeJson(current);
    if (depth === 0) message = text;
    parts.push(text);
    break;
  }
  return { message: message || "Unknown error", stack: parts.join("\n").slice(0, 8000) };
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

let seq = 0;

export function log(
  level: LogLevel,
  scope: string,
  message: string,
  extra: { ms?: number; stack?: string; detail?: Record<string, unknown> } = {},
): LogEntry {
  const entry: LogEntry = {
    id: `${Date.now()}-${seq++}`,
    at: Date.now(),
    level,
    scope,
    message,
    ...(extra.ms !== undefined && { ms: extra.ms }),
    ...(extra.stack !== undefined && { stack: extra.stack }),
    ...(extra.detail !== undefined && { detail: extra.detail }),
  };
  entries.push(entry);
  if (entries.length > LIMIT) entries.splice(0, entries.length - LIMIT);
  emit();
  return entry;
}

/** Record a failure with its stack, and forward it to production error reporting. */
export function logError(scope: string, error: unknown, detail?: Record<string, unknown>): LogEntry {
  const { message, stack } = describeThrown(error);
  const entry = log("error", scope, message, {
    stack,
    ...(detail !== undefined && { detail }),
  });
  report(error, { scope, ...detail });
  return entry;
}

type Reporter = (
  error: unknown,
  context?: Record<string, unknown>,
  options?: { mechanism?: string; handled?: boolean; severity?: string },
) => void;

function report(error: unknown, context: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    __lovableEvents?: { captureException?: Reporter };
    __lovableReportRuntimeError?: (p: { message: string; stack?: string; filename?: string }) => void;
  };
  const { message, stack } = describeThrown(error);
  try {
    w.__lovableEvents?.captureException?.(
      error,
      { source: "oos-run-log", route: window.location.pathname, ...context },
      { mechanism: "manual", handled: true, severity: "error" },
    );
    w.__lovableReportRuntimeError?.({ message, stack, filename: window.location.pathname });
  } catch {
    /* reporting must never break the flow it is observing */
  }
  // Keep the trace in the browser console too, so production sessions with the
  // console open show the same detail the run log holds.
  console.error(`[oos:${String(context["scope"] ?? "app")}] ${message}\n${stack}`);
}

/** Time a synchronous unit of work, logging its duration or its stack on failure. */
export function timed<T>(scope: string, message: string, fn: () => T): T {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const value = fn();
    const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
    log("info", scope, message, { ms: Math.max(1, Math.round(ended - started)) });
    return value;
  } catch (error) {
    logError(scope, error, { message });
    throw error;
  }
}

/** Plain-text dump of the log, for pasting into a bug report. */
export function logText(): string {
  return entries
    .map((e) => {
      const head = `${new Date(e.at).toISOString()} ${e.level.toUpperCase()} [${e.scope}] ${e.message}${
        e.ms !== undefined ? ` (${e.ms} ms)` : ""
      }`;
      const detail = e.detail ? `\n  detail: ${safeJson(e.detail)}` : "";
      const stack = e.stack ? `\n${e.stack}` : "";
      return head + detail + stack;
    })
    .join("\n");
}

let installed = false;

/** Capture uncaught errors and rejected promises into the same log. */
export function installGlobalErrorCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error ?? (event as ErrorEvent).message;
    const { message, stack } = describeThrown(err);
    log("error", "window.onerror", message, { stack, detail: { filename: (event as ErrorEvent).filename } });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const { message, stack } = describeThrown((event as PromiseRejectionEvent).reason);
    log("error", "unhandledrejection", message, { stack });
  });
}
