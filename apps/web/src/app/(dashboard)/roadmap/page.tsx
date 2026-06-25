// apps/web/src/app/(dashboard)/roadmap/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Compass, BookOpen, CheckSquare, Target, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoadmap, setSelectedRoadmap] = useState<any>(null);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  async function loadRoadmaps() {
    try {
      const res = await api.get('/resumes/roadmap/all');
      const list = res.data.data;
      setRoadmaps(list);
      if (list.length > 0) {
        setSelectedRoadmap(list[0]);
      }
    } catch (err) {
      console.error('Failed to load roadmaps:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Retrieving personalized roadmaps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Personalized Learning Roadmap</h2>
        <p className="text-sm text-zinc-400">Week-by-week study logs tailored to balance missing keywords detected in your resume.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Roadmap selection list */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Roadmaps</span>
          <div className="flex flex-col gap-2">
            {roadmaps.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoadmap(r)}
                className={`p-4 rounded-xl border text-left transition-colors flex flex-col gap-1 ${
                  selectedRoadmap?.id === r.id
                    ? 'bg-primary/10 border-primary text-zinc-200'
                    : 'bg-zinc-950/20 border-zinc-900 text-zinc-500 hover:bg-zinc-900/10'
                }`}
              >
                <span className="text-xs font-bold text-zinc-200">{r.targetRole}</span>
                <span className="text-[10px] text-zinc-500">{r.targetCompany || 'General Preparation'}</span>
              </button>
            ))}
            {roadmaps.length === 0 && (
              <div className="p-4 rounded-xl bg-zinc-950/20 border border-zinc-900 text-center flex flex-col gap-2 text-xs text-zinc-550">
                <span>No roadmaps generated yet.</span>
                <Link href="/resume" className="text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1">
                  Upload & Match JD <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Week-by-week timeline */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {selectedRoadmap ? (
            <div className="flex flex-col gap-6">
              {/* Header card info */}
              <div className="glass-card p-6 flex justify-between items-center bg-zinc-950/20">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Roadmap Schedule</span>
                  <h3 className="font-bold text-lg text-zinc-200">{selectedRoadmap.targetRole} Gaps</h3>
                  <span className="text-xs text-zinc-550">Created on {new Date(selectedRoadmap.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Weeks timeline */}
              <div className="flex flex-col gap-6">
                {(selectedRoadmap.weeksPlan as any[] || []).map((week, idx) => (
                  <div key={idx} className="glass-card p-6 flex flex-col gap-5 bg-zinc-950/20 border border-zinc-900">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          W{week.week || idx + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-200">{week.theme}</span>
                          <span className="text-[9px] text-zinc-500 font-semibold uppercase">{week.estimatedHours || 15} Hours study</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {week.skills?.map((s: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-[9px] text-zinc-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Daily Checklist */}
                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" /> Daily checklist plan
                      </span>
                      <div className="flex flex-col gap-2 pl-5">
                        {week.dailyPlan?.map((plan: string, i: number) => (
                          <div key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span>{plan}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resources & milestones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-900/50 pt-4 text-xs">
                      {/* Resource links */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" /> Study Materials
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {week.resources?.map((res: any, i: number) => (
                            <a
                              key={i}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              {res.name} <span className="text-[9px] text-zinc-500 font-normal">({res.type || 'free'})</span>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Milestone target */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" /> Weekly Milestone Target
                        </span>
                        <p className="text-zinc-400 italic leading-relaxed">
                          {week.milestone || 'Complete weekly review.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-3">
              <Compass className="h-10 w-10 text-zinc-650" />
              <span className="text-sm font-semibold text-zinc-400">Select or generate a roadmap schema to load schedule views</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
