import api from './api';

export interface BankLoginResponse {
  access: string;
  username: string;
  bank_name: string;
}

export interface BankUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
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
