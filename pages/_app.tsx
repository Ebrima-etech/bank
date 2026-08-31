import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { isBankLoggedIn } from '@/lib/auth';
import { BankProvider } from '@/lib/BankContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const publicPages = ['/login'];
  const isPublicPage = publicPages.includes(router.pathname);

  useEffect(() => {
    if (!isPublicPage && !isBankLoggedIn()) {
      router.push('/login');
    }
  }, [router, isPublicPage]);

  return (
    <>
      <Toaster position="top-right" />
      {isPublicPage ? (
        <Component {...pageProps} />
      ) : (
        <BankProvider>
          <Component {...pageProps} />
        </BankProvider>
      )}
    </>
  );
}
