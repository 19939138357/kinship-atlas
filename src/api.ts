import type { SiteData } from "./types";

async function parse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "请求失败，请稍后重试");
  return payload;
}

export async function fetchSession(): Promise<boolean> {
  const response = await fetch("/api/session", { credentials: "same-origin" });
  const payload = await parse<{ authenticated: boolean }>(response);
  return payload.authenticated;
}

export async function login(password: string): Promise<void> {
  const response = await fetch("/api/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  await parse<{ authenticated: boolean }>(response);
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/logout", {
    method: "POST",
    credentials: "same-origin"
  });
  await parse<{ authenticated: boolean }>(response);
}

export async function fetchSiteData(): Promise<SiteData> {
  const response = await fetch("/api/data", { credentials: "same-origin" });
  return parse<SiteData>(response);
}
