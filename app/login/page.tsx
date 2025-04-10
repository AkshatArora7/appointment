"use client";

import React, { useState, useEffect } from 'react';
import { signIn, useSession, SignInResponse } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaLock, FaSpinner } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import axios, { AxiosResponse } from 'axios';

interface CheckUserResponse {
  exists: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    // Handle error from URL params
    if (errorParam) {
      setError('Authentication failed. Please check your credentials.');
    }

    if (status === 'authenticated') {
      // Redirect users based on their role
      if (session.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (session.user.role === 'client') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [status, session, router, errorParam]);

  const checkUserExists = async (): Promise<boolean> => {
    if (!username) return false;
    try {
      const response = await fetch(`/api/auth/check-user?username=${encodeURIComponent(username)}`);
      
      if (!response.ok) {
        return false;
      }
      
      const data: CheckUserResponse = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking user:', error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo(null);
    
    // DEBUG: Check if user exists first
    const userExists = await checkUserExists();
    
    if (!userExists) {
      setError(`User "${username}" not found. Please check your username.`);
      setLoading(false);
      return;
    }
    
    try {
      const result: SignInResponse | undefined = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });
      
      if (result?.error) {
        console.error("Sign in error:", result.error);
        
        if (result.error === "CredentialsSignin") {
          setError('Invalid username or password. Please try again.');
        } else {
          setError(`Authentication failed: ${result.error}`);
        }
        
        // Add debug info
        setDebugInfo(`Username: ${username}, Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-green-500 text-white">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-gray-800 dark:text-white w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Client Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="pl-10 w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-800"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="pl-10 w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-800"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg shadow transition duration-300 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={toggleTheme}
            className="text-sm underline hover:text-blue-500"
          >
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </button>
        </div>

        {/* Add debug info panel for development */}
        {debugInfo && process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300 rounded">
            <p>Debug info:</p>
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
