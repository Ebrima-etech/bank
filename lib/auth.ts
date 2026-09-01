import api from './api';
import type { BankUser } from '@/types';

export type { BankUser } from '@/types';

// Session timeout in minutes (12 minutes)
const SESSION_TIMEOUT_MINUTES = 12;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

export interface BankLoginResponse {
  access: string;
  username: string;
  bank_name: string;
}

export const bankLogin = async (username: string, password: string): Promise<BankLoginResponse> => {
  try {
    const response = await api.post('/auth/token/', { username, password });
    const token = response.data.access;
    localStorage.setItem('bank_access_token', token);
    // Store login timestamp for session timeout
    localStorage.setItem('bank_login_timestamp', Date.now().toString());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bankLogout = () => {
  localStorage.removeItem('bank_access_token');
  localStorage.removeItem('bank_login_timestamp');
};

export const isSessionExpired = (): boolean => {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('bank_access_token');
  const timestamp = localStorage.getItem('bank_login_timestamp');

  // If no token or timestamp, session is expired
  if (!token || !timestamp) return false;

  // Check if session timeout has been exceeded
  const loginTime = parseInt(timestamp);
  const currentTime = Date.now();
  const elapsedTime = currentTime - loginTime;

  return elapsedTime > SESSION_TIMEOUT_MS;
};

export const getBankUser = async (): Promise<BankUser> => {
  const response = await api.get('/auth/me/');
  return response.data;
};

export const isBankLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('bank_access_token');
};

export const getBankToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bank_access_token');
};

export const getUserRole = async (userId: number): Promise<string | null> => {
  try {
    const response = await api.get(`/user-roles/?user=${userId}`);
    const roles = response.data.results || response.data;
    if (roles.length > 0) {
      return roles[0].role; // Return first role
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const isBankUser = async (userId: number): Promise<boolean> => {
  const role = await getUserRole(userId);
  return !!(role && (role === 'bank_admin' || role === 'bank_staff'));
};
