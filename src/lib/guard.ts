// Spend guard for the public AI routes. They call a billed model on the
// site owner's key, so anyone on the internet could otherwise run up the
// bill. Limits are per server instance (in memory): not airtight across a
// fleet of instances, but it caps a single abuser and a runaway script at a
// known cost without adding paid infrastructure.

type Window = { start: number; count: number };

export interface Limits {
  perIpPerHour: number;
  globalPerHour: number;
}

const HOUR = 60 * 60 * 1000;
const buckets = new Map<string, Window>();

function hit(key: string, limit: number, now: number): boolean {
  const w = buckets.get(key);
  if (!w || now - w.start >= HOUR) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  if (w.count >= limit) return false;
  w.count++;
  return true;
}

// Keep the map from growing without bound on a long-lived instance.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, w] of buckets) if (now - w.start >= HOUR) buckets.delete(k);
}

const ALLOWED_ORIGIN = /^(https:\/\/(www\.)?8020\.best|https:\/\/[a-z0-9-]+-adamtpangs-projects\.vercel\.app|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

export function clientIp(headers: Headers): string {
  return (headers.get("x-forwarded-for") || "").split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}

/** Returns an error message and status, or null when the request may proceed. */
export function checkRequest(route: string, headers: Headers, limits: Limits, now = Date.now()): { error: string; status: number } | null {
  const origin = headers.get("origin");
  if (origin && !ALLOWED_ORIGIN.test(origin)) {
    return { error: "Requests from other sites are not allowed.", status: 403 };
  }
  sweep(now);
  if (!hit(`${route}:global`, limits.globalPerHour, now)) {
    return { error: "8020 is busy right now. Try again in a little while.", status: 429 };
  }
  if (!hit(`${route}:ip:${clientIp(headers)}`, limits.perIpPerHour, now)) {
    return { error: "You have hit the hourly limit for AI sorting. Try again within the hour.", status: 429 };
  }
  return null;
}

export function resetGuardForTests() {
  buckets.clear();
}

/** Trims a list of user strings to safe sizes, or returns null if unusable. */
export function cleanStrings(value: unknown, maxItems: number, maxLength: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map(v => v.slice(0, maxLength));
  return out.length > maxItems ? null : out;
}
