import { api, setToken, clearToken, getToken, clearEncryptionPassword, hashEncryptionPassword } from "./api";

const USER_KEY = "plastic_surgery_auth";

export interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthResponse {
  token: string;
  user: { id: number; username: string; email?: string };
}

function storeUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function login(username: string, password: string): Promise<User> {
  const res = await api.post<AuthResponse>("/auth/login", { username, password });
  setToken(res.token);
  const user: User = {
    id: String(res.user.id),
    username: res.user.username,
    email: res.user.email,
  };
  storeUser(user);
  return user;
}

export async function register(
  username: string,
  password: string,
  encryptionPassword: string,
  email?: string
): Promise<User> {
  const res = await api.post<AuthResponse>("/auth/signup", {
    username,
    password,
    encryption_password: await hashEncryptionPassword(encryptionPassword),
    ...(email ? { email } : {}),
  });
  setToken(res.token);
  const user: User = {
    id: String(res.user.id),
    username: res.user.username,
    email: res.user.email,
  };
  storeUser(user);
  return user;
}

export function logout(): void {
  clearToken();
  clearEncryptionPassword();
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser(): User | null {
  // Token must also be present
  if (!getToken()) return null;
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
