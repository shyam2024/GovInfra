import { api } from './api';
import type { User } from '@/types';

interface TokenResponse {
  access_token?: string;
  token?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<string> {
    const mode = import.meta.env.VITE_AUTH_LOGIN_MODE ?? 'json';
    const { data } =
      mode === 'form'
        ? await api.post<TokenResponse>('/auth/login', new URLSearchParams({ username: email, password }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
        : await api.post<TokenResponse>('/auth/login', { email, password });

    const token = data.access_token ?? data.token;
    if (!token) throw new Error('Login succeeded but the server returned no token.');
    return token;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
