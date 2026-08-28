import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isBankLoggedIn } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isBankLoggedIn()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-lg shadow-lg mb-4">
          <span className="text-3xl">🏦</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Bank Portal</h1>
        <p className="text-gray-600 mt-2">Redirecting...</p>
      </div>
    </div>
  );
}
