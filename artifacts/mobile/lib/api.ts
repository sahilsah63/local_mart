import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "tc_auth_token";

function getBaseUrl(): string {
  // Same as setBaseUrl in _layout.tsx
  return "http://127.0.0.1:5000";
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const url = `${getBaseUrl()}/api${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export const api = {
  get:  <T = any>(p: string) => apiFetch<T>(p, { method: "GET" }),
  post: <T = any>(p: string, body?: any) => apiFetch<T>(p, { method: "POST", body: JSON.stringify(body) }),
  put:  <T = any>(p: string, body?: any) => apiFetch<T>(p, { method: "PUT", body: JSON.stringify(body) }),
  patch:<T = any>(p: string, body?: any) => apiFetch<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del:  <T = any>(p: string) => apiFetch<T>(p, { method: "DELETE" }),
};