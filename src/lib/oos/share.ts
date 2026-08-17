import type { Conditions, Dish } from "./types";
import { ENGINE_VERSION, FIXTURE_VERSION, SCHEMA_VERSION } from "./versions";

/**
 * Shareable read-only plans. The link carries the plan itself: nothing is
 * uploaded, no account is involved, and a recipient can open it offline. The
 * payload is versioned JSON, gzip-compressed where the browser allows it, then
 * base64url-encoded into a single search param.
 */

export const SHARE_VERSION = 3;
/** Beyond this, mail clients and chat apps start truncating. */
export const SAFE_LINK_LENGTH = 1900;

export interface SharePayload {
  v: number;
  /** the whole declared occasion, operating conditions included */
  c: Conditions;
  /** the name of the kitchen profile the sender was using, for provenance only */
  k?: string;
  /** dishes the plan actually depends on — sender snapshot, not the recipient library */
  d?: Dish[];
  /** locked dish ids in order */
  m?: string[];
  /** sender's language, so the link opens as they wrote it */
  l?: string;
  engineVersion?: string;
  fixtureVersion?: string;
  schemaVersion?: string;
  signature?: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzip(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function gunzip(bytes: Uint8Array): Promise<string | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  } catch {
    return null;
  }
}

/** "z." marks a compressed body; "j." an uncompressed one. */
export async function encodeShare(payload: SharePayload): Promise<string> {
  const body: SharePayload = {
    ...payload,
    v: SHARE_VERSION,
    engineVersion: payload.engineVersion ?? ENGINE_VERSION,
    fixtureVersion: payload.fixtureVersion ?? FIXTURE_VERSION,
    schemaVersion: payload.schemaVersion ?? SCHEMA_VERSION,
  };
  const json = JSON.stringify(body);
  const packed = await gzip(json);
  if (packed) return `z.${toBase64Url(packed)}`;
  return `j.${toBase64Url(new TextEncoder().encode(json))}`;
}

export async function decodeShare(token: string): Promise<SharePayload | null> {
  try {
    const marker = token.slice(0, 2);
    const body = fromBase64Url(token.slice(2));
    let json: string | null;
    if (marker === "z.") json = await gunzip(body);
    else if (marker === "j.") json = new TextDecoder().decode(body);
    else return null;
    if (!json) return null;
    const parsed = JSON.parse(json) as SharePayload;
    if (!parsed || typeof parsed !== "object" || !parsed.c || typeof parsed.c !== "object") return null;
    if (parsed.v > SHARE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function shareStale(payload: SharePayload): boolean {
  return Boolean(
    (payload.engineVersion && payload.engineVersion !== ENGINE_VERSION) ||
      (payload.fixtureVersion && payload.fixtureVersion !== FIXTURE_VERSION),
  );
}

export function shareUrl(token: string, lang?: string): string {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  const langPart = lang && lang !== "en" ? `&lang=${lang}` : "";
  return `${base}/share?p=${token}${langPart}`;
}
