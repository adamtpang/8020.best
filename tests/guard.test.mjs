import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { checkRequest, cleanStrings, resetGuardForTests } from "../src/lib/guard.ts";
import { COMPANION_SHA256, COMPANION_ZIP, EXTENSION_SHA256, EXTENSION_ZIP, INSTALL_URL } from "../src/lib/extension-release.ts";

const h = (ip, origin) => new Headers({ "x-forwarded-for": ip, ...(origin ? { origin } : {}) });

test("per-IP limit blocks the 41st request in an hour, then resets", () => {
  resetGuardForTests();
  const t = 1_000_000;
  for (let i = 0; i < 40; i++) assert.equal(checkRequest("sort", h("1.1.1.1"), { perIpPerHour: 40, globalPerHour: 1000 }, t), null);
  assert.equal(checkRequest("sort", h("1.1.1.1"), { perIpPerHour: 40, globalPerHour: 1000 }, t)?.status, 429);
  assert.equal(checkRequest("sort", h("2.2.2.2"), { perIpPerHour: 40, globalPerHour: 1000 }, t), null);
  assert.equal(checkRequest("sort", h("1.1.1.1"), { perIpPerHour: 40, globalPerHour: 1000 }, t + 60 * 60 * 1000), null);
});

test("global limit caps total spend across IPs", () => {
  resetGuardForTests();
  for (let i = 0; i < 3; i++) assert.equal(checkRequest("d", h(`9.9.9.${i}`), { perIpPerHour: 10, globalPerHour: 3 }), null);
  assert.equal(checkRequest("d", h("9.9.9.9"), { perIpPerHour: 10, globalPerHour: 3 })?.status, 429);
});

test("other websites cannot call the API, the site and previews can", () => {
  resetGuardForTests();
  const L = { perIpPerHour: 100, globalPerHour: 100 };
  assert.equal(checkRequest("s", h("3.3.3.3", "https://evil.example"), L)?.status, 403);
  assert.equal(checkRequest("s", h("3.3.3.3", "https://8020.best"), L), null);
  assert.equal(checkRequest("s", h("3.3.3.3", "https://www.8020.best"), L), null);
  assert.equal(checkRequest("s", h("3.3.3.3", "http://localhost:3000"), L), null);
});

test("input cleaning rejects oversized batches and trims long items", () => {
  assert.equal(cleanStrings(Array(31).fill("x"), 30, 500), null);
  assert.deepEqual(cleanStrings(["a".repeat(900), "", 5, "ok"], 30, 500).map(s => s.length), [500, 2]);
  assert.equal(cleanStrings("nope", 30, 500), null);
});

test("the published extension zip exists and matches its advertised hash", () => {
  assert.equal(INSTALL_URL, "/download");
  const file = new URL(`../public${EXTENSION_ZIP}`, import.meta.url);
  assert.ok(existsSync(file), `missing ${EXTENSION_ZIP}`);
  assert.equal(createHash("sha256").update(readFileSync(file)).digest("hex"), EXTENSION_SHA256);
  const companion = new URL(`../public${COMPANION_ZIP}`, import.meta.url);
  assert.ok(existsSync(companion), `missing ${COMPANION_ZIP}`);
  assert.equal(createHash("sha256").update(readFileSync(companion)).digest("hex"), COMPANION_SHA256);
});
