// apps/web/src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <html lang="en" className="dark">
      <head>
        <title>InterviewVerse AI — Placement Readiness Platform</title>
        <meta name="description" content="Adaptive AI Mock Interviews, Resume Intelligence, Coding Arena, and Skill Gap Roadmap" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
