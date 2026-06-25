// apps/web/src/app/(dashboard)/gps/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Compass,
  Sparkles,
  Loader2,
  CheckCircle,
  Play,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  BookOpen,
  Code2,
  Video,
  FileText
} from 'lucide-react';

const NODE_ICONS: Record<string, any> = {
  CODING: Code2,
  RESUME: FileText,
  INTERVIEW: Video,
  READ: BookOpen
};

export default function GpsPage() {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRoute();
  }, []);

  async function loadRoute() {
    try {
      const res = await api.get('/gps/route');
      setRoute(res.data.data);
    } catch (err) {
      console.error('Failed to load Career GPS route:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCompleteNode = async (nodeId: string) => {
    setCompletingId(nodeId);
    try {
      const res = await api.post('/gps/complete-node', { nodeId });
      setRoute(res.data.data);
      alert('Destination reached! Next preparation stop unlocked.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to complete GPS node');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Recalculating preparation route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Career GPS™</h2>
        <p className="text-sm text-zinc-400">Step-by-step navigation map from your current skill delta to target company offers.</p>
      </div>

      {route ? (
        <div className="flex flex-col gap-6">
          {/* Path Overview Card */}
          <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-950/20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Compass className="h-5 w-5 animate-spin-slow" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Path Target</span>
                <h3 className="font-bold text-lg text-zinc-200">{route.targetRole} Route</h3>
                <span className="text-xs text-zinc-500">Destination: {route.targetCompany}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overall Progress</span>
                <span className="text-lg font-extrabold text-white">{route.currentProgressPercent}%</span>
              </div>
              <div className="h-10 w-32 rounded-full bg-zinc-900 overflow-hidden border border-zinc-850 flex items-center p-1">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${route.currentProgressPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Transit Map / Stops Timeline */}
          <div className="glass-card p-6 flex flex-col gap-8 relative">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-3 block">Journey Map Stops</span>
            
            <div className="absolute left-[46px] top-24 bottom-12 w-0.5 bg-zinc-900 z-0"></div>

            <div className="flex flex-col gap-8 z-10 relative">
              {route.nodes?.map((node: any, idx: number) => {
                const Icon = NODE_ICONS[node.type] || BookOpen;
                const isActive = node.status === 'ACTIVE';
                const isCompleted = node.status === 'COMPLETED';

                return (
                  <div key={node.id} className="flex gap-6 items-start">
                    {/* Node status circle */}
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 border-2 z-10 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : isActive
                        ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20 animate-pulse'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Node details */}
                    <div className={`flex-1 p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      isActive
                        ? 'bg-primary/5 border-primary'
                        : isCompleted
                        ? 'bg-zinc-950/40 border-zinc-900/60 opacity-60'
                        : 'bg-zinc-950/20 border-zinc-900 opacity-40'
                    }`}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200">{node.title}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                            node.type === 'CODING' ? 'text-accent-emerald bg-emerald-500/5' :
                            node.type === 'INTERVIEW' ? 'text-accent-cyan bg-cyan-500/5' : 'text-primary bg-primary/5'
                          }`}>
                            {node.type}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 max-w-xl">{node.description}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-650 mt-1">
                          <Clock className="h-3 w-3" /> Est. {node.timeEstimateMinutes} minutes
                        </div>
                      </div>

                      <div className="flex items-center shrink-0">
                        {isActive && (
                          <button
                            onClick={() => handleCompleteNode(node.id)}
                            disabled={completingId === node.id}
                            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/10 transition-all flex items-center gap-1"
                          >
                            {completingId === node.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                Begin Stop <Play className="h-3 w-3 shrink-0" />
                              </>
                            )}
                          </button>
                        )}
                        {isCompleted && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                            <CheckCircle className="h-4 w-4" /> Cleared
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-3">
          <Compass className="h-10 w-10 text-zinc-650" />
          <span className="text-sm font-semibold text-zinc-400">Route map empty. Try launching a Company Simulation or seeding profile details.</span>
        </div>
      )}
    </div>
  );
}
