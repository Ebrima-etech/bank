import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getBankUser, BankUser } from './auth';
import api from './api';

interface Bank {
  id: number;
  name: string;
  logo?: string | null;
}

interface BankContextType {
  user: BankUser | null;
  bank: Bank | null;
  isAdmin: boolean;
  loading: boolean;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

export function BankProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BankUser | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getBankUser();
        setUser(userData);

        try {
          const rolesResponse = await api.get(`/user-roles/?user=${userData.id}`);
          const userRoles = rolesResponse.data.results || rolesResponse.data;
          if (userRoles.length > 0 && userRoles[0].bank) {
            const bankResponse = await api.get(`/banks/${userRoles[0].bank.id}/`);
            setBank(bankResponse.data);
          }
        } catch (error) {
          console.error('Error fetching bank:', error);
        }

        try {
          const rolesResponse = await api.get(`/user-roles/?user=${userData.id}&role=bank_admin`);
          const adminRoles = rolesResponse.data.results || rolesResponse.data;
          const isCurrentUserAdmin = adminRoles.some((role: any) => role.user?.id === userData.id);
          setIsAdmin(isCurrentUserAdmin);
        } catch (error) {
          console.error('Error checking user role:', error);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <BankContext.Provider value={{ user, bank, isAdmin, loading }}>
      {children}
    </BankContext.Provider>
  );
}

export function useBankContext() {
  const context = useContext(BankContext);
  if (context === undefined) {
    throw new Error('useBankContext must be used within a BankProvider');
  }
  return context;
}
