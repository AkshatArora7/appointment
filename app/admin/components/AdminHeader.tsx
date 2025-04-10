import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon, FaDesktop, FaSignOutAlt, FaChevronLeft } from 'react-icons/fa';
import Link from 'next/link';
import ClientOnly from '@/components/ClientOnly';

interface AdminHeaderProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title, 
  showBackButton = false,
  backUrl = '/admin/dashboard'
}) => {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const toggleTheme = (): void => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md mb-6 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {showBackButton && (
            <Link
              href={backUrl}
              className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Go back"
            >
              <FaChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Logged in as {session?.user?.name || 'Admin'} (Admin)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <ClientOnly>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm"
              aria-label="Toggle theme"
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm text-gray-700 dark:text-gray-200"
          >
            <FaSignOutAlt className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
