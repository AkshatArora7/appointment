"use client";

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from "next-auth/react";
import React, { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Add this state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Only show the UI after component has mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {/* 
          Only render children once mounted on client
          Using full replacement instead of visibility:hidden to avoid hydration issues
        */}
        {mounted ? children : 
          <div style={{height: '100vh', width: '100vw', background: 'transparent'}}></div>
        }
      </ThemeProvider>
    </SessionProvider>
  );
}
