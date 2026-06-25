// apps/web/src/app/(dashboard)/leaderboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Trophy, Award, Zap, Loader2, Star, CheckCircle, ShieldAlert } from 'lucide-react';

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock global students rankings for leaderboard visualization
  const mockRankings = [
    { rank: 1, name: 'Siddharth Roy', level: 12, xp: 5800, isSelf: false },
    { rank: 2, name: 'Neha Sharma', level: 9, xp: 4200, isSelf: false },
    { rank: 3, name: 'Rohan Verma', level: 7, xp: 3450, isSelf: false },
    { rank: 4, name: 'John Doe', level: 2, xp: 750, isSelf: true }, // Proxy user
    { rank: 5, name: 'Ananya Gupta', level: 1, xp: 200, isSelf: false },
  ];

  useEffect(() => {
    async function loadGamification() {
      try {
        const res = await api.get('/analytics/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load gamification stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGamification();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Compiling gamification metrics...</p>
        </div>
      </div>
    );
  }

  const gamification = data?.gamification || { xp: 0, level: 1, streak: 0, streakBest: 0, badges: [] };
  const userRankings = mockRankings.map((r) => {
    if (r.isSelf) {
      return {
        ...r,
        name: data?.user?.fullName || 'John Doe',
        level: gamification.level,
        xp: gamification.xp,
      };
    }
    return r;
  }).sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Badges catalog
  const badgeCatalog = [
    { name: 'DSA Warrior', desc: 'Solve 10 data structures problems', reward: 100 },
    { name: 'Interview Master', desc: 'Complete 5 AI interviews', reward: 250 },
    { name: 'Backend Ninja', desc: 'Score 85% or higher on a Node.js test', reward: 150 },
    { name: 'Consistent Preparedness', desc: 'Maintain a 7-day interview streak', reward: 200 },
  ];

  const hasBadge = (badgeName: string) => {
    return gamification.badges?.some((b: any) => b.name.toLowerCase() === badgeName.toLowerCase());
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Prep Arena Leaderboard</h2>
        <p className="text-sm text-zinc-400">Earn XP by completing mock interviews and solving code challenges.</p>
      </div>

      {/* Row: Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Arena Rank</span>
            <span className="text-lg font-extrabold text-white">
              #{userRankings.find((r) => r.isSelf)?.rank || 4} of 250
            </span>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Streaks (Best)</span>
            <span className="text-lg font-extrabold text-white">
              {gamification.streak} Days ({gamification.streakBest || 5})
            </span>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shrink-0">
            <Star className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Level Progress</span>
            <span className="text-lg font-extrabold text-white">
              Level {gamification.level} ({gamification.xp} XP)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Leaderboard rankings */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Trophy className="h-4.5 w-4.5 text-primary" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Students Leaderboard</span>
          </div>

          <div className="flex flex-col gap-1">
            {userRankings.map((student) => (
              <div
                key={student.rank}
                className={`px-4 py-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                  student.isSelf
                    ? 'bg-primary/10 border-primary text-zinc-200 font-bold'
                    : 'bg-zinc-950/20 border-zinc-900 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-5 text-center font-extrabold text-zinc-500">{student.rank}</span>
                  <span className="text-zinc-200 truncate">{student.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-zinc-500">Lv.{student.level}</span>
                  <span className="font-extrabold font-mono text-zinc-350">{student.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Badges checklist */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Award className="h-4.5 w-4.5 text-orange-400" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Earned & Locked Badges</span>
          </div>

          <div className="flex flex-col gap-3">
            {badgeCatalog.map((b, idx) => {
              const unlocked = hasBadge(b.name);
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex gap-3.5 items-start ${
                    unlocked
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-300'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-500'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      unlocked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-zinc-850 text-zinc-650'
                    }`}
                  >
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${unlocked ? 'text-zinc-200' : 'text-zinc-500'}`}>{b.name}</span>
                      {unlocked && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-550 leading-relaxed">{b.desc}</span>
                    <span className="text-[9px] font-semibold text-primary mt-1">+{b.reward} XP Reward</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
