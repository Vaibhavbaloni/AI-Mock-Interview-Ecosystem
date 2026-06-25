// apps/web/src/app/(dashboard)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Video,
  Code2,
  Compass,
  Trophy,
  LogOut,
  Loader2,
  User,
  Briefcase,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-zinc-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Resume Intelligence', path: '/resume', icon: FileText },
    { name: 'Mock Interviews', path: '/interview/new', icon: Video },
    { name: 'Coding Arena', path: '/coding', icon: Code2 },
    { name: 'Skill Roadmap', path: '/roadmap', icon: Compass },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Company Simulator', path: '/simulator', icon: Briefcase },
    { name: 'Career GPS', path: '/gps', icon: Compass },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950/50 backdrop-blur-md flex flex-col justify-between p-6 z-10">
        <div className="flex flex-col gap-10">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              InterviewVerse <span className="text-primary">AI</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/15 font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="flex flex-col gap-4 border-t border-zinc-900 pt-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-zinc-850 flex items-center justify-center border border-zinc-800 text-zinc-300">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-200 truncate">
                {user.profile?.fullName || 'Active User'}
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout().then(() => router.push('/'))}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-900 px-8 flex items-center justify-between bg-zinc-950/20 backdrop-blur-sm z-10">
          <h1 className="text-sm font-semibold text-zinc-400">
            Welcome, <span className="text-zinc-200">{user.profile?.fullName}</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              Live Session Status: Connected
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
