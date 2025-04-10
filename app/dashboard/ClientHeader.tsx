import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon, FaDesktop, FaSignOutAlt, FaCopy } from 'react-icons/fa';
import Link from 'next/link';
import ClientOnly from '@/components/ClientOnly';

const ClientHeader: React.FC = () => {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [linkCopied, setLinkCopied] = React.useState<boolean>(false);

  const toggleTheme = (): void => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const copyBookingLink = (): void => {
    if (!session?.user?.clientSlug) return;
    
    const link = `${window.location.origin}/book/${session.user.clientSlug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back, {session?.user?.clientName || session?.user?.name || 'Client'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {session?.user?.clientSlug && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Your booking link:</span>
              <button
                onClick={copyBookingLink}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center transition-colors"
                aria-label="Copy booking link"
              >
                <FaCopy className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Copy</span>
              </button>
              {linkCopied && (
                <span className="text-green-600 dark:text-green-400 text-xs font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                  Copied!
                </span>
              )}
            </div>
          )}

          <ClientOnly>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-gray-600"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <FaSun className="h-5 w-5 text-amber-500" />
              ) : theme === 'dark' ? (
                <FaMoon className="h-5 w-5 text-indigo-400" />
              ) : (
                <FaDesktop className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              )}
            </button>
          </ClientOnly>
          
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            aria-label="Sign out"
          >
            <FaSignOutAlt className="h-5 w-5 text-red-500 dark:text-red-400" />
            <span className="hidden md:inline text-red-600 dark:text-red-400 font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;
