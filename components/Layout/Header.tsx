import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { bankLogout, getBankUser, BankUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<BankUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getBankUser();
        setUser(userData);

        // Check if user is bank admin
        try {
          const rolesResponse = await api.get('/user-roles/?role=bank_admin');
          const adminRoles = rolesResponse.data.results || rolesResponse.data;
          setIsAdmin(adminRoles.length > 0);
        } catch (error) {
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
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🏦</span>
            </div>
            <span className="hidden sm:inline font-bold text-lg text-gray-900">
              Bank Portal
            </span>
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-sm text-gray-700 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/dashboard/submit-payment" className="text-sm text-gray-700 hover:text-gray-900">
              Submit Payment
            </Link>
            {isAdmin && (
              <Link href="/dashboard/staff" className="text-sm text-gray-700 hover:text-gray-900">
                Staff
              </Link>
            )}
            {user && (
              <>
                <div className="text-right border-l border-gray-200 pl-6">
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Dashboard
            </Link>
            <Link href="/dashboard/submit-payment" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Submit Payment
            </Link>
            {isAdmin && (
              <Link href="/dashboard/staff" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Staff Management
              </Link>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
