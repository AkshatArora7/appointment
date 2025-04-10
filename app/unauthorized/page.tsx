import Link from 'next/link';
import React from 'react';
import { FaExclamationTriangle, FaHome, FaSignInAlt } from 'react-icons/fa';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200 dark:border-amber-700">
          <FaExclamationTriangle className="text-amber-500 dark:text-amber-400 text-3xl" />
        </div>
        
        <h1 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">Access Denied</h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          You don't have permission to access this page.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <FaHome className="h-4 w-4" />
            Go to Homepage
          </Link>
          <Link 
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm border border-gray-200 dark:border-gray-600 font-medium"
          >
            <FaSignInAlt className="h-4 w-4" />
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
