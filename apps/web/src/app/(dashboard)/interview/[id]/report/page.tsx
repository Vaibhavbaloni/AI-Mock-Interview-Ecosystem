// apps/web/src/app/(dashboard)/interview/[id]/report/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Award,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function InterviewReportPage() {
  const { id } = useParams() as { id: string };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Journal form state
  const [wentWell, setWentWell] = useState('');
  const [wentBadly, setWentBadly] = useState('');
  const [willImprove, setWillImprove] = useState('');
  const [savingJournal, setSavingJournal] = useState(false);
  const [journalFeedback, setJournalFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get(`/interviews/${id}`);
        setData(res.data.data);
        if (res.data.data.interview?.journal) {
          const j = res.data.data.interview.journal;
          setWentWell(j.wentWell || '');
          setWentBadly(j.wentBadly || '');
          setWillImprove(j.willImprove || '');
          setJournalFeedback(j.aiReflection || null);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingJournal(true);
    try {
      const res = await api.post(`/interviews/${id}/journal`, {
        wentWell,
        wentBadly,
        willImprove,
      });
      setJournalFeedback(res.data.data.aiReflection);
      alert('Journal reflection saved successfully! AI reflection generated.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save reflection');
    } finally {
      setSavingJournal(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Compiling your comprehensive scorecard report...</p>
        </div>
      </div>
    );
  }

  const interview = data?.interview || {};
  const mongoReport = data?.transcripts?.aiReport || {
    summary: 'Mock summary not compiled.',
    strengths: [],
    weaknesses: [],
    improvementPlan: [],
    hireRecommendation: 'Consider',
    nextSteps: [],
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 50) return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Performance Report</h2>
        <p className="text-sm text-zinc-400">Detailed feedback breakdown, scorecards, and learning plans.</p>
      </div>

      {/* Row: Main circular score + details summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Overall Score</span>
          <div className="h-28 w-28 rounded-full border-4 border-primary flex flex-col items-center justify-center bg-primary/5 shadow-xl shadow-primary/10">
            <span className="text-3xl font-extrabold text-white">{interview.overallScore || 0}</span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase">Points</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-300">{mongoReport.hireRecommendation}</span>
            <span className="text-[10px] text-zinc-500">Hiring Probability: {Math.round(parseFloat(interview.hireProbability || '0'))}%</span>
          </div>
        </div>

        <div className="md:col-span-2 glass-card p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Executive Summary</span>
          <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/20 p-4 rounded-xl border border-zinc-900">
            {mongoReport.summary}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${scoreColor(interview.technicalScore || 0)}`}>
              <span className="text-[9px] font-bold uppercase text-zinc-500">Technical</span>
              <span className="text-sm font-bold">{interview.technicalScore || 0}%</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${scoreColor(interview.communicationScore || 0)}`}>
              <span className="text-[9px] font-bold uppercase text-zinc-500">Communication</span>
              <span className="text-sm font-bold">{interview.communicationScore || 0}%</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${scoreColor(interview.behavioralScore || 0)}`}>
              <span className="text-[9px] font-bold uppercase text-zinc-500">Behavioral</span>
              <span className="text-sm font-bold">{interview.behavioralScore || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Strengths and gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Key Strengths</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {mongoReport.strengths?.map((s: string, i: number) => (
              <div key={i} className="text-xs text-zinc-300 flex items-start gap-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <XCircle className="h-4.5 w-4.5 text-red-400" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gaps & Weaknesses</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {mongoReport.weaknesses?.map((w: string, i: number) => (
              <div key={i} className="text-xs text-zinc-300 flex items-start gap-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap schedule */}
      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <TrendingUp className="h-4.5 w-4.5 text-primary" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recommended Improvement Roadmap</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mongoReport.improvementPlan?.map((p: string, i: number) => {
            const [title, desc] = p.split(': ');
            return (
              <div key={i} className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-primary uppercase">{title}</span>
                <p className="text-xs text-zinc-400 leading-relaxed">{desc || 'Focus area'}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reflective journal and AI Reflection feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Award className="h-4.5 w-4.5 text-primary" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Interview Journal</span>
          </div>

          <form onSubmit={handleJournalSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">What went well?</label>
              <textarea
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                placeholder="Good explanation of architecture..."
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 min-h-[60px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">What went badly?</label>
              <textarea
                value={wentBadly}
                onChange={(e) => setWentBadly(e.target.value)}
                placeholder="Struggled to compute big-O proof..."
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 min-h-[60px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase">What will you improve?</label>
              <textarea
                value={willImprove}
                onChange={(e) => setWillImprove(e.target.value)}
                placeholder="Review hash tables..."
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 min-h-[60px]"
              />
            </div>

            <button
              type="submit"
              disabled={savingJournal}
              className="py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {savingJournal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Reflection'}
            </button>
          </form>
        </div>

        {/* Coach reflection feedback */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <MessageCircle className="h-4.5 w-4.5 text-accent-cyan" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Coach Reflection Advice</span>
          </div>

          <div className="flex-1 flex items-center justify-center text-center">
            {journalFeedback ? (
              <div className="text-left flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 text-xs text-zinc-300 leading-relaxed w-full">
                <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-primary block mb-1">Coach Feedback Note:</span>
                  {journalFeedback}
                </div>
              </div>
            ) : (
              <div className="text-zinc-650 flex flex-col items-center gap-2 py-8">
                <MessageCircle className="h-6 w-6" />
                <span className="text-[10px] leading-relaxed max-w-[260px]">
                  Fill out your journal questions on the left. The AI coach will compile customized encouragement.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export const Heart = (props: any) => (
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
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
export const MessageCircle = (props: any) => (
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
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </svg>
);
