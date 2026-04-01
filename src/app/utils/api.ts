/**
 * Base API client.
 * JWT token: localStorage 'auth_token'
 * AES 비밀번호: 메모리(세션)에만 보관 — 서버로 전송 시 SHA-256 해싱
 */

import { sha256 } from "./crypto";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api/v1";
const TOKEN_KEY = "auth_token";

// ── JWT ──────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── AES 비밀번호 (메모리 전용, 원문 보관) ─────────────────
let _encryptionPassword: string | null = null;

export function setEncryptionPassword(pw: string): void {
  _encryptionPassword = pw;
}
export function getEncryptionPassword(): string | null {
  return _encryptionPassword;
}
export function clearEncryptionPassword(): void {
  _encryptionPassword = null;
}

/** 서버로 보내기 전 SHA-256 해싱 */
export async function hashEncryptionPassword(pw: string): Promise<string> {
  return sha256(pw);
}

// ── HTTP ─────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // 암호화 비밀번호는 SHA-256 해시로만 전송 (원문은 서버에 닿지 않음)
  const encHeader = _encryptionPassword
    ? await sha256(_encryptionPassword)
    : null;

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(encHeader ? { "X-Encryption-Password": encHeader } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("plastic_surgery_auth");
    _encryptionPassword = null;
    window.location.href = "/login";
    throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
  }

  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  post:   <T>(path: string, body: unknown) =>
            request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  get:    <T>(path: string) => request<T>(path, { method: "GET" }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  patch:  <T>(path: string, body: unknown) =>
            request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  upload: <T>(path: string, formData: FormData) =>
            request<T>(path, { method: "POST", body: formData }),
};
