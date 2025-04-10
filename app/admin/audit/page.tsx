"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FaSearch, FaSync, FaTimes } from 'react-icons/fa';
import AdminHeader from '../components/AdminHeader';
import { AuditLog } from '@/types/interfaces';

const AuditLogsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [clientSearchInput, setClientSearchInput] = useState<string>('');
  const [showClientSuggestions, setShowClientSuggestions] = useState<boolean>(false);
  const [filteredClients, setFilteredClients] = useState<{ id: number; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    } else {
      fetchClients();
      fetchAuditLogs();
    }
  }, [session, router]);

  const fetchClients = async (): Promise<void> => {
    try {
      const response = await fetch('/api/admin/clients');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch clients`);
      }
      
      const data = await response.json();
      setClients(data.clients.map((client: any) => ({ 
        id: client.id, 
        name: client.name 
      })));
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAuditLogs = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/admin/audit-logs';
      const params = new URLSearchParams();
      
      if (clientFilter !== 'all') {
        params.append('clientId', clientFilter);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('Fetching audit logs with URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch audit logs`);
      }
      
      const data = await response.json();
      console.log('Received audit logs:', data.auditLogs?.length || 0);
      setAuditLogs(data.auditLogs || []);
    } catch (error) {
      setError('Failed to load audit logs. Please try again.');
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setIsSearching(true);
    fetchAuditLogs();
  };

  const handleClientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientSearchInput(value);
    
    if (value.trim() === '') {
      setClientFilter('all');
      setFilteredClients([]);
      return;
    }
    
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredClients(filtered);
    setShowClientSuggestions(true);
  };
  
  const selectClient = (client: { id: number; name: string }) => {
    setClientSearchInput(client.name);
    setClientFilter(client.id.toString());
    setShowClientSuggestions(false);
    
    setIsSearching(true);
    fetchAuditLogs();
  };
  
  const clearClientFilter = () => {
    setClientSearchInput('');
    setClientFilter('all');
    setShowClientSuggestions(false);
    
    setIsSearching(true);
    fetchAuditLogs();
  };

  const handleRefresh = (): void => {
    setSearchQuery('');
    clearClientFilter();
    fetchAuditLogs();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setShowClientSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminHeader title="Audit Logs" showBackButton backUrl="/admin/dashboard" />
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Logs
                  </label>
                  <div className="relative">
                    <input
                      id="search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by action or details..."
                      className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaSearch className="text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="mt-auto p-2 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white rounded-md transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
            
            <div>
              <label htmlFor="clientFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Client
              </label>
              <div className="flex gap-2 relative">
                <div className="relative">
                  <input
                    id="clientFilter"
                    ref={clientInputRef}
                    type="text"
                    value={clientSearchInput}
                    onChange={handleClientSearch}
                    onFocus={() => {
                      if (clientSearchInput && clients.length > 0) {
                        setShowClientSuggestions(true);
                      }
                    }}
                    placeholder="Type client name..."
                    className="p-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-60"
                  />
                  {clientSearchInput && (
                    <button 
                      type="button"
                      onClick={clearClientFilter}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <FaTimes size={14} />
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                  title="Reset filters"
                >
                  <FaSync />
                </button>
                
                {showClientSuggestions && filteredClients.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
                  >
                    {filteredClients.map(client => (
                      <div 
                        key={client.id}
                        onClick={() => selectClient(client)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200"
                      >
                        {client.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {(clientFilter !== 'all' || searchQuery.trim() !== '') && (
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              
              {clientFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  Client: {clientSearchInput}
                  <button 
                    type="button" 
                    onClick={clearClientFilter} 
                    className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
              
              {searchQuery.trim() !== '' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  Search: {searchQuery}
                  <button 
                    type="button" 
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearching(true);
                      fetchAuditLogs();
                    }} 
                    className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
          
          {loading ? (
            <div className="space-y-3">
              {/* Table header shimmer */}
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-full flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-1 px-6 py-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md w-full relative overflow-hidden">
                      {/* Standard pulse animation instead of custom shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-gray-500 to-transparent opacity-40 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Table rows shimmer */}
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-md w-full flex mb-2">
                  {[1, 2, 3, 4, 5].map((col) => (
                    <div key={col} className="flex-1 px-6 py-5">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full relative overflow-hidden">
                        {/* Standard pulse animation with gradient overlay for shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-gray-500 to-transparent opacity-40 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              No audit logs found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {format(new Date(log.actionDate), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {log.client?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {log.details || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
