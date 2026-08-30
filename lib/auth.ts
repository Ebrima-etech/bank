import api from './api';
import type { BankUser } from '@/types';

export type { BankUser } from '@/types';

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
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bankLogout = () => {
  localStorage.removeItem('bank_access_token');
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
  return role && (role === 'bank_admin' || role === 'bank_staff');
};
