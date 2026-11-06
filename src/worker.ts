import { demoData } from "./worker-data.ts";
import { isSiteData } from "./dataset.ts";

interface Env {
  ASSETS: Fetcher;
  LOGIN_LIMIT: RateLimit;
  FAMILY_DATA?: KVNamespace;
  SITE_PASSWORD?: string;
  SESSION_SECRET?: string;
}

const WEEK = 7 * 86400;
const encoder = new TextEncoder();

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(body, { status, headers: {
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer", ...headers
  } });
}

function configured(env: Env): env is Env & { SITE_PASSWORD: string; SESSION_SECRET: string } {
  return typeof env.SITE_PASSWORD === "string" && env.SITE_PASSWORD.length >= 12 && env.SITE_PASSWORD.length <= 128
    && typeof env.SESSION_SECRET === "string" && env.SESSION_SECRET.length >= 32;
}

function cookieName(request: Request) {
  const { protocol, hostname } = new URL(request.url);
  const local = protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(hostname);
  return local ? "kinship-local" : "__Host-kinship";
}

function cookie(request: Request, value: string, age: number) {
  const name = cookieName(request);
  const secure = name.startsWith("__Host-") ? "; Secure" : "";
  return { "Set-Cookie": `${name}=${value}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${age}` };
}

function sessionKey(env: Env) {
  // Changing either secret invalidates outstanding sessions.
  return crypto.subtle.importKey("raw", encoder.encode(JSON.stringify([env.SESSION_SECRET, env.SITE_PASSWORD])),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function issueSession(env: Env) {
  const payload = `${Math.floor(Date.now() / 1000) + WEEK}.${crypto.randomUUID()}`;
  const signature = await crypto.subtle.sign("HMAC", await sessionKey(env), encoder.encode(payload));
  return `${payload}.${Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("")}`;
}

async function authenticated(request: Request, env: Env) {
  if (!configured(env)) return false;
  const name = cookieName(request);
  const entry = request.headers.get("Cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith(name + "="));
  const token = entry?.slice(name.length + 1);
  const match = token?.match(/^(\d{10})\.([a-f\d-]{36})\.([a-f\d]{64})$/);
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;
  const signature = Uint8Array.from(match[3].match(/../g)!, hex => parseInt(hex, 16));
  return crypto.subtle.verify("HMAC", await sessionKey(env), signature, encoder.encode(`${match[1]}.${match[2]}`));
}

async function passwordMatches(input: string, expected: string) {
  const digest = async (str: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(str)));
  const [left, right] = await Promise.all([digest(input), digest(expected)]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function login(request: Request, env: Env) {
  if (!configured(env)) return json({ error: "请先配置访问口令与会话密钥" }, 503);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) return json({ error: "需要 JSON 请求" }, 415);
  try {
    const limit = await env.LOGIN_LIMIT.limit({ key: request.headers.get("CF-Connecting-IP") ?? "local" });
    if (!limit.success) return json({ error: "尝试次数过多，请稍后重试" }, 429, { "Retry-After": "60" });
  } catch {
    return json({ error: "登录服务暂不可用" }, 503);
  }
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "请求格式无效" }, 400);
  const bytes = new Uint8Array(2048);
  let length = 0;
  let password: unknown;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (length + chunk.value.length > bytes.length) {
        await reader.cancel();
        return json({ error: "请求过大" }, 413);
      }
      bytes.set(chunk.value, length);
      length += chunk.value.length;
    }
    password = JSON.parse(new TextDecoder().decode(bytes.subarray(0, length)))?.password;
  } catch { return json({ error: "请求格式无效" }, 400); }
  if (typeof password !== "string" || password.length > 128 || !await passwordMatches(password, env.SITE_PASSWORD)) {
    return json({ error: "访问口令不正确" }, 401);
  }
  return json({ authenticated: true }, 200, cookie(request, await issueSession(env), WEEK));
}

async function loadData(env: Env) {
  if (!env.FAMILY_DATA) return json(demoData);
  try {
    const data = await env.FAMILY_DATA.get("site-data", "json");
    if (isSiteData(data)) return json(data);
  } catch { /* Keep storage details and malformed private records out of responses. */ }
  return json({ error: "族谱资料暂不可用，请联系维护者" }, 503);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "POST") {
      const origin = request.headers.get("Origin");
      if ((origin !== null && origin !== url.origin) || request.headers.get("Sec-Fetch-Site") === "cross-site") {
        return json({ error: "请求来源无效" }, 403);
      }
      if (url.pathname === "/api/login") return login(request, env);
      if (url.pathname === "/api/logout") return json({ authenticated: false }, 200, cookie(request, "", 0));
    }
    if (request.method === "GET") {
      if (url.pathname === "/api/session") return json({ authenticated: await authenticated(request, env) });
      if (url.pathname === "/api/data") return await authenticated(request, env) ? loadData(env) : json({ error: "请先登录" }, 401);
    }
    return json({ error: "接口不存在" }, 404);
  }
} satisfies ExportedHandler<Env>;
