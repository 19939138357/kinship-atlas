import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import worker from "../src/worker.ts";
import { demoData } from "../src/worker-data.ts";
import { isSiteData } from "../src/dataset.ts";

const env = {
  SITE_PASSWORD: randomBytes(16).toString("hex"),
  SESSION_SECRET: randomBytes(32).toString("hex"),
  LOGIN_LIMIT: { limit: async () => ({ success: true }) }
};
const origin = "https://atlas.example";
function api(path, init = {}, bindings = env) {
  return worker.fetch(new Request(origin + "/api/" + path, init), bindings);
}
function login(password = env.SITE_PASSWORD, bindings = env, originHeader = origin) {
  return api("login", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: originHeader },
    body: JSON.stringify({ password })
  }, bindings);
}
async function signIn() {
  const response = await login();
  assert.equal(response.status, 200);
  const cookie = response.headers.get("Set-Cookie");
  for (const flag of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/"]) assert.ok(cookie.includes(flag));
  return cookie.split(";")[0];
}

test("archive is locked without configured secrets or a valid session", async () => {
  assert.equal((await login(undefined, {})).status, 503);
  assert.equal((await login("invalid")).status, 401);
  assert.equal((await api("data")).status, 401);
  assert.deepEqual(await (await api("session")).json(), { authenticated: false });
  assert.equal((await login(undefined, env, "http://atlas.example")).status, 403);
  assert.equal((await login(undefined, { ...env, LOGIN_LIMIT: { limit: () => ({ success: false }) } })).status, 429);
});

test("valid sessions can read the demo; tampering or rotating secrets denies access", async () => {
  const Cookie = await signIn();
  const init = { headers: { Cookie } };
  assert.deepEqual(await (await api("session", init)).json(), { authenticated: true });
  const data = await api("data", init);
  assert.equal(data.status, 200);
  assert.match(data.headers.get("cache-control"), /no-store/);
  assert.deepEqual(await data.json(), demoData);
  assert.ok(isSiteData(demoData));
  const corrupt = Cookie.slice(0, -1) + (Cookie.endsWith("0") ? "1" : "0");
  assert.equal((await api("data", { headers: { Cookie: corrupt } })).status, 401);
  assert.equal((await api("data", init, { ...env, SITE_PASSWORD: env.SITE_PASSWORD + "x" })).status, 401);
  assert.equal((await api("data", init, { ...env, SITE_PASSWORD: undefined })).status, 401);
  const logout = await api("logout", { ...init, method: "POST" });
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
});

test("data binding is read only after login; missing or malformed data fails closed", async () => {
  const Cookie = await signIn();
  let calls = 0;
  const data = { ...demoData, meta: { ...demoData.meta, title: "Test Fixture" } };
  const bindings = { ...env, FAMILY_DATA: { get: async (key, type) => {
    assert.equal(key, "site-data");
    assert.equal(type, "json");
    calls += 1;
    return data;
  } } };
  assert.equal((await api("data", {}, bindings)).status, 401);
  assert.equal(calls, 0);
  assert.deepEqual(await (await api("data", { headers: { Cookie } }, bindings)).json(), data);
  assert.equal(calls, 1);
  for (const get of [() => null, () => ({ ...data, extra: "unexpected" }), () => { throw Error("storage"); }]) {
    const result = await api("data", { headers: { Cookie } }, { ...env, FAMILY_DATA: { get } });
    assert.equal(result.status, 503);
    assert.deepEqual(Object.keys(await result.json()), ["error"]);
  }
});

test("schema checks reject self references, cycles, invalid dates and duplicate or missing IDs", () => {
  const invalid = [
    data => { data.members[0].spouseIds = [data.members[0].id]; },
    data => { data.members[0].fatherId = data.members[4].id; },
    data => { data.members[0].id = data.members[1].id; },
    data => { data.members[0].childIds = ["unknown"]; },
    data => { data.members[0].lunarBirth.month = 15; },
    data => { data.members[0].unexpected = "excluded"; }
  ];
  for (const mutate of invalid) {
    const data = structuredClone(demoData);
    mutate(data);
    assert.equal(isSiteData(data), false);
  }
});

test("only loopback HTTP uses a local cookie; public hosts require the secure cookie", async () => {
  for (const [host, local] of [["127.0.0.1:8787", true], ["atlas.example", false]]) {
    const url = "http://" + host;
    const request = new Request(url + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.SITE_PASSWORD }) });
    const response = await worker.fetch(request, env);
    const value = response.headers.get("set-cookie");
    assert.equal(value.includes("; Secure"), !local);
    assert.ok(value.startsWith(local ? "kinship-local=" : "__Host-kinship="));
    const Cookie = value.split(";")[0];
    const session = await worker.fetch(new Request(url + "/api/session", { headers: { Cookie } }), env);
    assert.deepEqual(await session.json(), { authenticated: true });
  }
});
