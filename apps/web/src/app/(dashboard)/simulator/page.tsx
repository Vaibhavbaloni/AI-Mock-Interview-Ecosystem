// apps/web/src/app/(dashboard)/simulator/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { api } from '@/lib/api';
import {
  Briefcase,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  ArrowRight,
  Award,
  RefreshCw,
  Code2
} from 'lucide-react';

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Nokia', 'TCS', 'Infosys', 'Accenture'];

const STAGE_LABELS: Record<string, string> = {
  RESUME_SCREENING: 'Resume Screening',
  ONLINE_ASSESSMENT: 'Online Assessment',
  TECHNICAL_ROUND_1: 'Technical Round 1',
  TECHNICAL_ROUND_2: 'Technical Round 2',
  MANAGERIAL_ROUND: 'Managerial Round',
  HR_ROUND: 'HR Round',
  OFFER_DECISION: 'Offer Decision'
};

export default function SimulatorPage() {
  const router = useRouter();

  const [simulations, setSimulations] = useState<any[]>([]);
  const [activeSim, setActiveSim] = useState<any>(null);
  const [company, setCompany] = useState('Nokia');
  const [role, setRole] = useState('Software Engineer');
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Online Assessment state variables
  const [oaProblem, setOaProblem] = useState<any>(null);
  const [oaLoading, setOaLoading] = useState(false);
  const [code, setCode] = useState('');
  const [errorOutput, setErrorOutput] = useState('');

  useEffect(() => {
    loadSimulations();
  }, []);

  async function loadSimulations() {
    try {
      const res = await api.get('/simulation/list');
      setSimulations(res.data.data);
      if (res.data.data.length > 0) {
        selectSimulation(res.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load simulations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function selectSimulation(id: string) {
    try {
      const res = await api.get(`/simulation/${id}/status`);
      const sim = res.data.data;
      setActiveSim(sim);
      setErrorOutput('');

      // If OA is active, fetch OA problem details
      if (sim.currentStage === 'ONLINE_ASSESSMENT' && sim.status === 'IN_PROGRESS') {
        loadOAProblem(id);
      }
    } catch (err) {
      console.error('Failed to fetch simulation status:', err);
    }
  }

  async function loadOAProblem(simId: string) {
    setOaLoading(true);
    try {
      const res = await api.get(`/simulation/${simId}/oa-problem`);
      const prob = res.data.data;
      setOaProblem(prob);
      setCode(prob.starterCode?.javascript || '// Write your JavaScript solution here\n');
    } catch (err) {
      console.error('Failed to fetch OA challenge details:', err);
    } finally {
      setOaLoading(false);
    }
  }

  const handleStartSim = async (e: React.FormEvent) => {
    e.preventDefault();
    setStarting(true);
    try {
      const res = await api.post('/simulation/start', {
        companyName: company,
        roleTitle: role
      });
      await loadSimulations();
      selectSimulation(res.data.data.id);
      alert('Simulation pipeline created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to start simulation');
    } finally {
      setStarting(false);
    }
  };

  const handleResumeScreening = async () => {
    if (!activeSim) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/simulation/${activeSim.id}/submit`, {});
      const updated = res.data.data;
      
      const screeningRound = updated.rounds?.find((r: any) => r.roundType === 'RESUME_SCREENING');
      alert(`Resume Screening completed!\nScore: ${screeningRound?.score || 0}/100\nFeedback: ${screeningRound?.feedback || ''}`);

      await selectSimulation(activeSim.id);
      await loadSimulations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to analyze resume match');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOASubmission = async () => {
    if (!activeSim) return;
    setSubmitting(true);
    setErrorOutput('');
    try {
      const res = await api.post(`/simulation/${activeSim.id}/submit`, {
        code,
        language: 'javascript'
      });
      const updated = res.data.data;
      const oaRound = updated.rounds?.find((r: any) => r.roundType === 'ONLINE_ASSESSMENT');

      if (oaRound?.isPassed) {
        alert('Assessment passed! Next recruitment round unlocked.');
      } else {
        setErrorOutput(oaRound?.feedback || 'Code failed test cases. Check console outputs.');
        alert('Assessment failed. Please revise your code and try again.');
      }

      await selectSimulation(activeSim.id);
      await loadSimulations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit OA solution');
    } finally {
      setSubmitting(false);
    }
  };

  const launchInterview = async () => {
    if (!activeSim) return;
    let type = 'TECHNICAL';
    if (activeSim.currentStage === 'HR_ROUND') type = 'HR';
    if (activeSim.currentStage === 'MANAGERIAL_ROUND') type = 'MIXED';

    try {
      const res = await api.post('/interviews', {
        type,
        difficulty: 'MEDIUM',
        persona: 'friendly_mentor',
        companyTrack: activeSim.companyName,
        isPressureMode: false,
        isVoiceEnabled: false,
        isVideoEnabled: false
      });
      const interview = res.data.data;
      alert(`Created new ${type} mock interview for ${activeSim.companyName}! Redirecting you to the interview room...`);
      router.push(`/interview/${interview.id}`);
    } catch (err: any) {
      alert('Failed to launch mock interview: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleSyncInterview = async () => {
    if (!activeSim) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/simulation/${activeSim.id}/submit`, {});
      const updated = res.data.data;
      const roundDetails = updated.rounds?.find((r: any) => r.roundType === activeSim.currentStage);

      if (roundDetails?.isPassed) {
        alert(`Stage Cleared! Interview synced with score: ${roundDetails.score}%`);
      } else {
        alert(`Mock interview synced, but score did not clear the 70% threshold. Synced score: ${roundDetails?.score || 0}%\nYou may complete another mock interview session to overwrite and try syncing again.`);
      }

      await selectSimulation(activeSim.id);
      await loadSimulations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to sync interview session scores');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Compiling company pipelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Dream Company Simulator™</h2>
        <p className="text-sm text-zinc-400">Rehearse the complete, multi-stage recruitment loops of target tech firms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left pane: Start & selection */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card p-6 flex flex-col gap-5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Start Simulation</span>
            <form onSubmit={handleStartSim} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Target Company</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-200"
                >
                  {COMPANIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Role Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Software Engineer"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={starting}
                className="py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Launch Loop'}
              </button>
            </form>
          </div>

          <div className="glass-card p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Simulations</span>
            <div className="flex flex-col gap-2">
              {simulations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSimulation(s.id)}
                  className={`p-3 rounded-xl border flex flex-col text-left transition-all ${
                    activeSim?.id === s.id
                      ? 'bg-primary/10 border-primary text-zinc-200'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-500 hover:bg-zinc-900/10'
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-200">{s.companyName}</span>
                  <span className="text-[10px] text-zinc-500">{s.roleTitle}</span>
                  <span className={`text-[9px] font-semibold mt-2 ${
                    s.status === 'COMPLETED' ? 'text-emerald-400' :
                    s.status === 'FAILED' ? 'text-red-400' : 'text-primary'
                  }`}>
                    {s.status} — {s.offerProbability}% Offer Prob
                  </span>
                </button>
              ))}
              {simulations.length === 0 && (
                <span className="text-xs text-zinc-650 text-center py-4">No simulations launched yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Pipeline timeline */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {activeSim ? (
            <div className="flex flex-col gap-6">
              {/* Simulator stats summary */}
              <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950/20">
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Simulation Loop</span>
                  <h3 className="font-bold text-lg text-zinc-200">{activeSim.companyName} Loop</h3>
                  <span className="text-xs text-zinc-550">{activeSim.roleTitle}</span>
                </div>
                <div className="flex flex-col justify-center text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Offer Probability</span>
                  <div className="text-2xl font-extrabold text-cyan-400 mt-1">{activeSim.offerProbability}%</div>
                </div>
                <div className="flex flex-col justify-center text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Simulation Status</span>
                  <span className={`text-xs font-bold mt-2.5 px-3 py-1 rounded-full border inline-block mx-auto ${
                    activeSim.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' :
                    activeSim.status === 'FAILED' ? 'text-red-400 bg-red-500/5 border-red-500/10' :
                    'text-primary bg-primary/5 border-primary/10 animate-pulse'
                  }`}>
                    {activeSim.status}
                  </span>
                </div>
              </div>

              {/* Rounds Stepper */}
              <div className="glass-card p-6 flex flex-col gap-6">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-3 block">Recruitment Loop Tracks</span>
                <div className="flex flex-col gap-4">
                  {Object.keys(STAGE_LABELS).map((stage, idx) => {
                    const round = activeSim.rounds?.find((r: any) => r.roundType === stage);
                    const isActive = activeSim.currentStage === stage && activeSim.status === 'IN_PROGRESS';
                    const isPassed = round?.isPassed;
                    const isLocked = !round && activeSim.status === 'IN_PROGRESS';

                    return (
                      <div key={stage} className="flex flex-col gap-2">
                        <div
                          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                            isActive
                              ? 'bg-primary/5 border-primary shadow-md shadow-primary/5'
                              : isPassed
                              ? 'bg-emerald-500/5 border-emerald-500/10'
                              : isLocked
                              ? 'bg-zinc-950/20 border-zinc-900 opacity-40'
                              : 'bg-zinc-950/20 border-zinc-900'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                              isPassed
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : isActive
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-zinc-900 border-zinc-850 text-zinc-550'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-200">{STAGE_LABELS[stage]}</span>
                              <span className="text-[10px] text-zinc-500">
                                {isActive ? 'Ongoing assessment round' : isPassed ? 'Stage Cleared' : 'Evaluation Pending'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {round?.feedback && (
                              <span className="text-[11px] text-zinc-500 italic max-w-md truncate">
                                "{round.feedback}"
                              </span>
                            )}

                            {isPassed && <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />}
                            {!isPassed && !isActive && !isLocked && round && <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                          </div>
                        </div>

                        {/* Interactive stages work areas */}
                        {isActive && (
                          <div className="ml-1 md:ml-11">
                            {stage === 'RESUME_SCREENING' && (
                              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AI Recruiter Screening</span>
                                  <p className="text-xs text-zinc-400">
                                    Our AI recruiter agent will score your primary resume and profile settings against the requirements of <strong>"{activeSim.roleTitle}"</strong> at {activeSim.companyName}.
                                  </p>
                                </div>
                                <button
                                  onClick={handleResumeScreening}
                                  disabled={submitting}
                                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-1.5 self-start disabled:opacity-50"
                                >
                                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                  Start Resume Screening Match
                                </button>
                              </div>
                            )}

                            {stage === 'ONLINE_ASSESSMENT' && (
                              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">OA Coding Challenge Workspace</span>
                                  <p className="text-xs text-zinc-400">Write and compile your JavaScript code. Your code will run automatically against all test cases.</p>
                                </div>

                                {oaLoading ? (
                                  <div className="flex items-center justify-center py-8 gap-2.5">
                                    <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
                                    <span className="text-xs text-zinc-500">Retrieving OA details...</span>
                                  </div>
                                ) : oaProblem ? (
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                    {/* Description and limits */}
                                    <div className="flex flex-col gap-4">
                                      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850 flex flex-col gap-2.5">
                                        <div className="flex items-center gap-2">
                                          <Code2 className="h-4 w-4 text-primary" />
                                          <span className="text-xs font-bold text-zinc-100">{oaProblem.title}</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{oaProblem.description}</p>
                                        {oaProblem.constraints && (
                                          <pre className="text-[10px] text-zinc-550 font-mono whitespace-pre-wrap bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 mt-2">
                                            {oaProblem.constraints}
                                          </pre>
                                        )}
                                      </div>

                                      {errorOutput && (
                                        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 text-[10px] font-mono text-red-400 leading-relaxed">
                                          {errorOutput}
                                        </div>
                                      )}
                                    </div>

                                    {/* Monaco Editor area */}
                                    <div className="flex flex-col gap-3.5">
                                      <div className="h-64 rounded-xl border border-zinc-850 overflow-hidden bg-zinc-950">
                                        <Editor
                                          height="100%"
                                          language="javascript"
                                          value={code}
                                          onChange={(val) => setCode(val || '')}
                                          theme="vs-dark"
                                          options={{
                                            fontSize: 11.5,
                                            minimap: { enabled: false },
                                            automaticLayout: true,
                                            fontFamily: 'Fira Code, monospace',
                                          }}
                                        />
                                      </div>
                                      <button
                                        onClick={handleOASubmission}
                                        disabled={submitting}
                                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-1.5 self-end disabled:opacity-50"
                                      >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                        Run and Submit Code
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-red-400">Failed to load OA problem workspace.</span>
                                )}
                              </div>
                            )}

                            {(stage.startsWith('TECHNICAL_ROUND') || stage === 'MANAGERIAL_ROUND' || stage === 'HR_ROUND') && (
                              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Live Mock Interview</span>
                                  <p className="text-xs text-zinc-400">
                                    You must launch and complete a mock interview track for <strong>{activeSim.companyName}</strong>. Complete the live chat/video session, then sync your scorecards.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    onClick={launchInterview}
                                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all flex items-center gap-1.5"
                                  >
                                    <Play className="h-3.5 w-3.5" /> Start Mock Interview
                                  </button>
                                  <button
                                    onClick={handleSyncInterview}
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                                  >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                    Sync Performance Results
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Digital Offer Letter Modal */}
              {activeSim.status === 'COMPLETED' && (
                <div className="glass-card p-8 bg-gradient-to-br from-primary/10 via-zinc-950 to-cyan-500/5 border border-primary/45 text-center flex flex-col items-center gap-4 relative overflow-hidden animate-pulse-slow">
                  <div className="absolute top-0 left-0 w-[50%] h-[50%] rounded-full bg-primary/5 blur-[80px] pointer-events-none"></div>
                  <Award className="h-12 w-12 text-cyan-400 animate-bounce" />
                  <h4 className="font-extrabold text-xl text-zinc-100 font-sans tracking-tight">Congratulations! Offer Generated</h4>
                  <p className="text-xs text-zinc-400 max-w-md">
                    You have successfully navigated the entire {activeSim.companyName} simulated loop. Your offer letter has been logged to your placement dossier.
                  </p>
                  <button
                    onClick={() => alert('Offer letter downloaded as PDF (Simulated)')}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
                  >
                    Download Digital Offer <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-3">
              <Briefcase className="h-10 w-10 text-zinc-650" />
              <span className="text-sm font-semibold text-zinc-400">Launch a target company recruitment loop to load progress timelines</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
