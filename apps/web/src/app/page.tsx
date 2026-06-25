// apps/web/src/app/page.tsx
'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { ArrowRight, Terminal, Award, MessageSquare, Bot, Cpu, Sparkles, UserCheck } from 'lucide-react';

export default function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            InterviewVerse <span className="text-primary">AI</span>
          </span>
        </div>
        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white transition-all border border-zinc-700/50"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center py-20 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-primary font-medium mb-6 animate-pulse">
          <Bot className="h-3.5 w-3.5" /> Next-Gen Placement Preparation Ecosystem
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-[1.15]">
          Master Your Placements <br />
          With Adaptive AI
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          InterviewVerse AI is a complete placement ecosystem. Build resume intelligence, solve LeetCode problems,
          conduct live voice & webcam interviews, track your Placement Readiness Index, and land your dream job.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-24">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/25 text-base"
          >
            Start Preparing Free <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#features"
            className="px-8 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold transition-all border border-zinc-800/80 flex items-center justify-center text-base"
          >
            Explore Features
          </a>
        </div>

        {/* Features Grid */}
        <section id="features" className="w-full pt-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-16 text-zinc-100">
            More Than Just An AI Mock Interviewer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass-card p-8 text-left flex flex-col gap-4">
              <div className="h-10 w-10 rounded-lg bg-violet-600/10 flex items-center justify-center text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Resume Intelligence</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Upload your resume to extract key skills, evaluate ATS metrics, detect missing keywords, and tailor suggestions specifically to target job descriptions.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 text-left flex flex-col gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Adaptive Mock Rooms</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Engage in live voice and text interviews. AI adjusts question difficulty dynamically based on answer quality and simulates 6 diverse interviewer personalities.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-8 text-left flex flex-col gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-500">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Coding Interview Arena</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                LeetCode-style IDE workspace. Run test cases locally, submit code for syntax verification, and obtain runtime analysis and O(N) review suggestions.
              </p>
            </div>

            {/* Card 4 */}
            <div className="glass-card p-8 text-left flex flex-col gap-4">
              <div className="h-10 w-10 rounded-lg bg-orange-600/10 flex items-center justify-center text-orange-500">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Gamified Roadmaps</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Stay consistent with streaks, earn badges like DSA Warrior, gain XP for completed tasks, and track custom week-by-week roadmaps.
              </p>
            </div>

            {/* Card 5 */}
            <div className="glass-card p-8 text-left flex flex-col gap-4">
              <div className="h-10 w-10 rounded-lg bg-cyan-600/10 flex items-center justify-center text-cyan-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Placement Readiness Index™</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Monitor progress with a single, weighted score aggregating your resume depth, communication clarity, consistency history, and technical scores.
              </p>
            </div>

            {/* Card 6 */}
            <div className="glass-card p-8 text-left flex flex-col gap-4">
              <div className="h-10 w-10 rounded-lg bg-pink-600/10 flex items-center justify-center text-pink-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">AI Report Generation</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Download fully detailed scorecards detailing specific strengths, development opportunities, and hiring recommendations from FAANG managers.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 z-10">
        <span>© 2026 InterviewVerse AI. All rights reserved.</span>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <a href="#" className="hover:text-zinc-400">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-400">Terms of Service</a>
          <a href="#" className="hover:text-zinc-400">Github</a>
        </div>
      </footer>
    </div>
  );
}
