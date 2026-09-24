import axios, { AxiosError } from 'axios';

export const TOKEN_KEY = 'govinfra.token';
export const UNAUTHORIZED_EVENT = 'govinfra:unauthorized';

/**
 * Token storage. localStorage keeps the session across reloads (requirement: persistent session).
 * For stricter deployments move to an httpOnly, SameSite cookie issued by the backend and delete this store.
 */
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) — session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLogin) {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** FastAPI returns `detail` as a string or as a list of {loc,msg}. Normalise both. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail ?? err.response?.data?.message;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const msgs = detail.map((d: { msg?: string }) => d?.msg).filter(Boolean);
      if (msgs.length) return msgs.join('; ');
    }
    if (err.code === 'ECONNABORTED') return 'The server took too long to respond.';
    if (!err.response) return 'Cannot reach the server. Check your connection or the API URL.';
    return `Request failed (${err.response.status}).`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

type Listish<T> = T[] | { items?: T[]; results?: T[]; data?: T[] } | null | undefined;

/** Accepts a bare array or a paginated envelope and always returns an array. */
export function unwrapList<T>(payload: Listish<T>): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.results ?? payload.data ?? [];
}
