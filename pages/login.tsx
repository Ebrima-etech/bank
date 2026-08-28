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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Bank Portal</h1>
          <p className="text-sm text-gray-600">GIA Hajj Payment System</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h2>
            <p className="text-sm text-gray-600">to submit payments and track submissions</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
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
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
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
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Info */}
          <div className="text-xs text-gray-600">
            <p className="font-medium text-gray-900 mb-2">Features</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Submit payments (manual or bulk CSV)</li>
              <li>• View submission history</li>
              <li>• API documentation</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2026 Gambia International Airlines</p>
        </div>
      </div>
    </div>
  );
}
