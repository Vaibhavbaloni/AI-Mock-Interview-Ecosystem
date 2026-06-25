// apps/web/src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  ChevronRight,
  Target,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Flame,
  Compass,
  Briefcase,
  Play,
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [gpsPath, setGpsPath] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [dashRes, coachRes, gpsRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/coach/insights'),
          api.get('/gps/route').catch(() => ({ data: { data: null } }))
        ]);
        setData(dashRes.data.data);
        setCoachData(coachRes.data.data);
        setGpsPath(gpsRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard premium metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Compiling dashboard analytics...</p>
        </div>
      </div>
    );
  }

  const pri = data?.priScore || 72;
  const metrics = data?.metrics || { resumeScore: 65, codingScore: 75, interviewScore: 70, consistencyScore: 80 };
  const gamification = data?.gamification || { xp: 250, level: 1, streak: 3, badges: [] };
  
  // Calculate SVG Radar points for DNA
  const dna = data?.dna || {
    communication: 70,
    leadership: 60,
    problemSolving: 80,
    technical: 75,
    adaptability: 65,
    confidence: 70,
  };

  const radarKeys = ['communication', 'leadership', 'problemSolving', 'technical', 'adaptability', 'confidence'];
  const labels = ['Communication', 'Leadership', 'Problem Solving', 'Technical', 'Adaptability', 'Confidence'];
  const center = 100;
  const maxVal = 100;
  const r = 70;

  const points = radarKeys.map((key, i) => {
    const val = dna[key] || 50;
    const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
    const x = center + (r * val / maxVal) * Math.cos(angle);
    const y = center + (r * val / maxVal) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridPoints = [25, 50, 75, 100].map((level) => {
    return radarKeys.map((_, i) => {
      const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
      const x = center + (r * level / maxVal) * Math.cos(angle);
      const y = center + (r * level / maxVal) * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Continue Journey / Welcome Banner */}
      <div className="relative overflow-hidden p-8 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-[30%] h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="h-4 w-4 animate-pulse" /> Active Learning Session Checkpoint
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 font-sans tracking-tight">
            {gpsPath?.nodes?.find((n: any) => n.status === 'ACTIVE')?.title || 'Ready for Placements?'}
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
            {gpsPath?.nodes?.find((n: any) => n.status === 'ACTIVE')?.description || 'Resume your preparation path. Improve your PRI score by completing customized GPS nodes.'}
          </p>
        </div>
        <Link
          href={gpsPath ? '/gps' : '/interview/new'}
          className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
        >
          {gpsPath ? 'Continue preparation GPS' : 'Launch Mock Room'} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Main KPI Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: PRI Score Circular Gauge */}
        <div className="glass-card p-6 flex flex-col items-center justify-between text-center gap-4">
          <div className="w-full flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Placement Readiness Index</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>

          {/* SVG Circular Gauge */}
          <div className="relative h-36 w-36 flex flex-col items-center justify-center mt-2">
            <svg className="h-full w-full transform -rotate-90">
              <circle cx="72" cy="72" r="58" stroke="#1f2937" strokeWidth="10" fill="transparent" />
              <circle
                cx="72"
                cy="72"
                r="58"
                stroke="hsl(262, 83%, 58%)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 58}
                strokeDashoffset={2 * Math.PI * 58 * (1 - pri / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">{pri}</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">PRI Score</span>
            </div>
          </div>

          <div className="text-center">
            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${
              pri <= 40 ? 'text-red-400 bg-red-500/5 border-red-500/10' :
              pri <= 60 ? 'text-orange-400 bg-orange-500/5 border-orange-500/10' :
              pri <= 80 ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' :
              'text-cyan-400 bg-cyan-500/5 border-cyan-500/10 animate-pulse'
            }`}>
              {pri <= 40 ? 'Beginner Candidate' :
               pri <= 60 ? 'Developing' :
               pri <= 80 ? 'Placement Ready' : 'Elite Candidate'}
            </span>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-left mt-2">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900/50">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Resume</span>
              <span className="text-xs font-bold text-zinc-200">{metrics.resumeScore}/100</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900/50">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Coding</span>
              <span className="text-xs font-bold text-zinc-200">{metrics.codingScore}/100</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Interview DNA Radar Chart */}
        <div className="glass-card p-6 flex flex-col items-center justify-between text-center gap-4">
          <div className="w-full flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Interview DNA Radar</span>
            <Target className="h-4 w-4 text-accent-cyan" />
          </div>

          {/* SVG Radar Chart */}
          <div className="relative h-36 w-full flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="h-full w-auto max-h-[140px]">
              {/* Grid circles */}
              {gridPoints.map((gp, idx) => (
                <polygon key={idx} points={gp} fill="none" stroke="#27272a" strokeWidth="0.5" />
              ))}
              {/* Grid lines */}
              {radarKeys.map((_, i) => {
                const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={center + r * Math.cos(angle)}
                    y2={center + r * Math.sin(angle)}
                    stroke="#27272a"
                    strokeWidth="0.5"
                  />
                );
              })}
              {/* DNA Polygon */}
              <polygon points={points} fill="rgba(124, 58, 237, 0.2)" stroke="hsl(262, 83%, 58%)" strokeWidth="1.5" />
              {/* Dots */}
              {points.split(' ').map((p, idx) => {
                const [x, y] = p.split(',');
                return <circle key={idx} cx={x} cy={y} r="2.5" fill="hsl(262, 83%, 58%)" />;
              })}
            </svg>
          </div>

          <span className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
            Strengths: Problem Solving & Technical. Keep interviewing to balance.
          </span>
        </div>

        {/* Widget 3: Gamification & Stats */}
        <div className="glass-card p-6 flex flex-col justify-between gap-6">
          <div className="w-full flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gamification Profile</span>
            <Award className="h-4 w-4 text-accent-emerald" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-400">Current Streak</span>
                  <span className="text-lg font-extrabold text-white">{gamification.streak} Days</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-900 text-xs font-semibold">
                Level {gamification.level}
              </div>
            </div>

            {/* XP progress bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>XP Progress</span>
                <span>{gamification.xp} / 500 XP</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(gamification.xp / 500) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Recent Badges</span>
            <div className="flex gap-1.5">
              {gamification.badges.slice(0, 3).map((badge: any, i: number) => (
                <div
                  key={i}
                  title={badge.name}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-300"
                >
                  {badge.name.split(' ')[0]}
                </div>
              ))}
              {gamification.badges.length === 0 && <span className="text-zinc-650">No badges earned yet</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features Block: Skill Heatmap & AI Coach Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill Heatmap Grid */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Skill mastery heatmap</span>
            <Compass className="h-4 w-4 text-primary" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-1.5">
            {[
              { label: 'Arrays', score: 85, color: 'bg-primary/80 border-primary' },
              { label: 'Strings', score: 70, color: 'bg-primary/60 border-primary/70' },
              { label: 'Linked Lists', score: 50, color: 'bg-primary/40 border-primary/50' },
              { label: 'Trees', score: 30, color: 'bg-primary/20 border-primary/30' },
              { label: 'Graphs', score: 10, color: 'bg-zinc-900 border-zinc-850 text-zinc-550' },
              { label: 'Dynamic Prog', score: 25, color: 'bg-primary/20 border-primary/30' },
              { label: 'System Design', score: 60, color: 'bg-primary/50 border-primary/60' },
              { label: 'STAR behavior', score: 75, color: 'bg-primary/70 border-primary/80' },
              { label: 'Pacing (Speech)', score: 80, color: 'bg-primary/80 border-primary' },
              { label: 'Consistency', score: 90, color: 'bg-primary/95 border-primary' }
            ].map((skill, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-zinc-900/50 bg-zinc-950/40 flex flex-col justify-between h-20">
                <span className="text-[10px] text-zinc-400 font-bold block truncate">{skill.label}</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono font-extrabold text-zinc-200">{skill.score}%</span>
                  <div className={`h-2.5 w-2.5 rounded-full ${skill.color}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Coach Alerts Panel */}
        <div className="glass-card p-6 lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Coach Panel Alerts</span>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </div>
          <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
            {coachData?.insights?.map((insight: any) => (
              <div key={insight.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-900/80 flex items-start gap-2.5">
                <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                  insight.severity === 'CRITICAL' ? 'text-red-500 animate-pulse' :
                  insight.severity === 'WARNING' ? 'text-orange-400' : 'text-blue-400'
                }`} />
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">{insight.category}</span>
                  <span className="text-[11px] text-zinc-300 leading-normal mt-0.5">{insight.insightText}</span>
                </div>
              </div>
            ))}
            {(!coachData?.insights || coachData.insights.length === 0) && (
              <div className="text-center py-8 text-zinc-550 flex flex-col items-center justify-center h-full gap-2">
                <Flame className="h-5 w-5 text-zinc-650" />
                <span className="text-[10px] text-zinc-500">No active alerts. Preparing loops will generate coach suggestions here.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <h3 className="font-semibold text-sm text-zinc-200">Refine Your Resume</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              Scan your resume against ATS criteria, see missing keywords, and automatically create tailored roadmap schedules.
            </p>
            <Link href="/resume" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              Go to Resume Scan <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="glass-card p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center text-accent-emerald shrink-0 border border-accent-emerald/20">
            <Code2 className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <h3 className="font-semibold text-sm text-zinc-200">Solve Coding Challenges</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-3">
              Code inside our Monaco editor workspace. Test JavaScript logic in-sandbox and retrieve refactoring reviews.
            </p>
            <Link href="/coding" className="text-xs font-semibold text-accent-emerald flex items-center gap-1 hover:underline">
              Enter Coding Arena <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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
