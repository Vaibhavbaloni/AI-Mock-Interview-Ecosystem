// apps/web/src/app/(dashboard)/coding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Target, Award, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function CodingProblemsPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProblems() {
      try {
        const res = await api.get('/coding/problems');
        setProblems(res.data.data);
      } catch (err) {
        console.error('Failed to load coding problems:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Retrieving coding challenges...</p>
        </div>
      </div>
    );
  }

  const difficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
      case 'MEDIUM':
        return 'text-orange-400 bg-orange-500/5 border-orange-500/10';
      case 'HARD':
      case 'FAANG':
        return 'text-red-400 bg-red-500/5 border-red-500/10';
      default:
        return 'text-zinc-400 bg-zinc-950 border-zinc-900';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Coding Arena</h2>
        <p className="text-sm text-zinc-400">Master data structures and algorithms, compile solutions, and see AI reviews.</p>
      </div>

      {/* Grid of problems */}
      <div className="glass-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-900 bg-zinc-950/20 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-4">Problem Name</div>
          <div className="col-span-2 text-center">Difficulty</div>
          <div className="col-span-3">Topic Tags</div>
          <div className="col-span-2">Target Companies</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* List of problems */}
        <div className="flex flex-col divide-y divide-zinc-900">
          {problems.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-zinc-900/10 transition-colors text-xs text-zinc-300"
            >
              <div className="col-span-4 flex items-center gap-2.5">
                <Code2 className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="font-bold text-zinc-100">{p.title}</span>
              </div>

              <div className="col-span-2 text-center">
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${difficultyColor(p.difficulty)}`}>
                  {p.difficulty}
                </span>
              </div>

              <div className="col-span-3 flex flex-wrap gap-1.5">
                {p.tags?.slice(0, 3).map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-[9px] text-zinc-400 font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="col-span-2 flex flex-wrap gap-1">
                {p.companies?.slice(0, 2).map((c: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10 text-[9px] text-primary font-semibold"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="col-span-1 text-right">
                <Link
                  href={`/coding/${p.id}`}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white transition-all shadow-md shadow-primary/10"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {problems.length === 0 && (
            <div className="text-center py-12 text-zinc-550 flex flex-col items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <span>No problems seeded in the database. Run prisma seed.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export const Code2 = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
