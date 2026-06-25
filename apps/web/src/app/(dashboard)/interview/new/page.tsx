// apps/web/src/app/(dashboard)/interview/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Sparkles, ArrowRight, UserCheck, ShieldAlert, HeartHandshake, Bot, Shield, Loader2 } from 'lucide-react';

const PERSONAS = [
  {
    id: 'strict_faang',
    name: 'Alex Chen',
    title: 'Senior Staff Engineer, Google',
    company: 'Google',
    description: 'Terse, direct, and technically rigorous. Evaluates system details and Big-O efficiency.',
    avatarColor: '#4285F4',
    icon: Shield,
  },
  {
    id: 'friendly_mentor',
    name: 'Sarah Kim',
    title: 'Engineering Manager, Stripe',
    company: 'Stripe',
    description: 'Encouraging and constructive. Builds on your responses with helpful guidance.',
    avatarColor: '#635BFF',
    icon: HeartHandshake,
  },
  {
    id: 'aggressive_stress',
    name: 'Marcus Reed',
    title: 'VP Engineering, Tech Startup',
    company: 'Startup VC',
    description: 'Intense and rapid-fire. Challenges every assumption and uses pressure/silence tactics.',
    avatarColor: '#EF4444',
    icon: ShieldAlert,
  },
  {
    id: 'hr_specialist',
    name: 'Priya Nair',
    title: 'HR Lead, Microsoft',
    company: 'Microsoft',
    description: 'Professional and process-oriented. Evaluates culture alignment and behavioral fit.',
    avatarColor: '#00A4EF',
    icon: UserCheck,
  },
];

export default function NewInterviewPage() {
  const router = useRouter();

  const [type, setType] = useState('TECHNICAL');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [persona, setPersona] = useState('friendly_mentor');
  const [isPressureMode, setIsPressureMode] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const res = await api.post('/interviews', {
        type,
        difficulty,
        persona,
        isPressureMode,
        isVoiceEnabled,
        isVideoEnabled,
      });
      const interview = res.data.data;
      router.push(`/interview/${interview.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Setup Mock Interview</h2>
        <p className="text-sm text-zinc-400">Configure parameters to customize your live training environment.</p>
      </div>

      {/* Grid of settings */}
      <div className="flex flex-col gap-6">
        {/* Type & Difficulty Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Interview Type</span>
            <div className="grid grid-cols-2 gap-3">
              {['TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-3 rounded-xl border text-xs font-semibold transition-all ${
                    type === t
                      ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Difficulty Level</span>
            <div className="grid grid-cols-2 gap-3">
              {['EASY', 'MEDIUM', 'HARD', 'FAANG'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-3 rounded-xl border text-xs font-semibold transition-all ${
                    difficulty === d
                      ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Personas selector */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Interviewer Persona</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`p-4 rounded-xl border flex gap-4 text-left transition-all ${
                    persona === p.id
                      ? 'bg-primary/10 border-primary text-zinc-200'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:bg-zinc-900/10'
                  }`}
                >
                  <div
                    style={{ backgroundColor: `${p.avatarColor}15`, color: p.avatarColor }}
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-current/15"
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-200">{p.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-semibold truncate">
                        {p.company}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium truncate">{p.title}</span>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Telemetry Toggles */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Environmental Simulation</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pressure toggle */}
            <button
              onClick={() => setIsPressureMode(!isPressureMode)}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                isPressureMode
                  ? 'bg-red-500/5 border-red-500/30 text-red-400'
                  : 'bg-zinc-950/20 border-zinc-900 text-zinc-500'
              }`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center ${isPressureMode ? 'border-red-400 bg-red-400/20' : 'border-zinc-800 bg-zinc-950'}`}>
                {isPressureMode && <span className="text-[10px]">✓</span>}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold">Pressure Mode</span>
                <span className="text-[9px] text-zinc-500">Adds response countdowns</span>
              </div>
            </button>

            {/* Voice toggle */}
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                isVoiceEnabled
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-zinc-950/20 border-zinc-900 text-zinc-500'
              }`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center ${isVoiceEnabled ? 'border-primary bg-primary/20' : 'border-zinc-800 bg-zinc-950'}`}>
                {isVoiceEnabled && <span className="text-[10px]">✓</span>}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold">Voice Interview</span>
                <span className="text-[9px] text-zinc-500">Reads questions via TTS</span>
              </div>
            </button>

            {/* Video toggle */}
            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                isVideoEnabled
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-zinc-950/20 border-zinc-900 text-zinc-500'
              }`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center ${isVideoEnabled ? 'border-primary bg-primary/20' : 'border-zinc-800 bg-zinc-950'}`}>
                {isVideoEnabled && <span className="text-[10px]">✓</span>}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold">Webcam Track</span>
                <span className="text-[9px] text-zinc-500">Enable video telemetry</span>
              </div>
            </button>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleCreateSession}
          disabled={loading}
          className="py-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/25 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Launch Live Interview Room <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
