import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { bankLogout, getBankUser, BankUser } from '@/lib/auth';
import { BiChevronDown, BiLogOut } from 'react-icons/bi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Bank {
  id: number;
  name: string;
  logo?: string | null;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<BankUser | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getBankUser();
        setUser(userData);

        // Fetch bank associated with this user
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

        // Check if THIS specific user is a bank admin
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
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    bankLogout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="h-16 px-8 flex items-center justify-between">
        {/* Logo and Bank Name */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          {bank?.logo ? (
            <img src={bank.logo} alt={bank.name} className="h-10 w-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
              🏦
            </div>
          )}
          <div className="hidden sm:flex flex-col">
            <p className="text-sm font-semibold text-slate-900">{bank?.name || 'Bank Portal'}</p>
            <p className="text-xs text-slate-500">Payment Processing</p>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/dashboard">
            <span className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              router.pathname === '/dashboard'
                ? 'text-blue-700 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}>
              Dashboard
            </span>
          </Link>
          <Link href="/dashboard/submit-payment">
            <span className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              router.pathname === '/dashboard/submit-payment'
                ? 'text-blue-700 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}>
              Submit Payment
            </span>
          </Link>
          {isAdmin && (
            <Link href="/dashboard/staff">
              <span className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                router.pathname === '/dashboard/staff'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}>
                Staff
              </span>
            </Link>
          )}
        </nav>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex flex-col text-right">
                <p className="text-sm font-medium text-slate-900">{user.username}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <BiLogOut size={18} />
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
