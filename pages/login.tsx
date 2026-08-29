import { useState } from 'react';
import { useRouter } from 'next/router';
import { bankLogin } from '@/lib/auth';
import Button from '@/components/Common/Button';
import toast from 'react-hot-toast';

export default function BankLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await bankLogin(username, password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err) {
      const errorMessage =
        (err as any)?.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-lg mb-4">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2">GIA Bank Portal</h1>
          <p className="text-sm text-slate-400">Payment Processing System</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-white/10 rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
            <p className="text-sm text-gray-600">to access payment dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Bank Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-black hover:bg-gray-900 text-white font-medium py-2.5 rounded-lg text-sm"
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Info */}
          <div className="text-xs">
            <p className="font-medium text-gray-900 mb-3">Quick Access</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                Submit payments manually
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                Bulk upload via CSV
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                Track submission history
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© 2026 Gambia International Airlines</p>
        </div>
      </div>
    </div>
  );
}
