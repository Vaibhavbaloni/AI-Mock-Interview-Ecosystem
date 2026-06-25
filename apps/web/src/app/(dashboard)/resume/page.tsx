// apps/web/src/app/(dashboard)/resume/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Upload,
  FileCheck,
  Percent,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
  FileText,
  Compass,
} from 'lucide-react';
import Link from 'next/link';

export default function ResumePage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [roadmapping, setRoadmapping] = useState(false);

  // Job description matching state
  const [jdText, setJdText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [matchResult, setMatchResult] = useState<any>(null);

  // Roadmap output
  const [roadmapResult, setRoadmapResult] = useState<any>(null);

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    try {
      const res = await api.get('/resumes');
      const list = res.data.data;
      setResumes(list);

      const primary = list.find((r: any) => r.isPrimary) || list[0];
      if (primary) {
        selectResume(primary.id);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  }

  async function selectResume(id: string) {
    try {
      const res = await api.get(`/resumes/${id}`);
      setActiveResume(res.data.data.resume);
      setDetails(res.data.data.details);
    } catch (err) {
      console.error('Failed to load resume details:', err);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    try {
      const res = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh
      await loadResumes();
      alert('Resume parsed and analyzed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleJdMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText) return;

    setMatching(true);
    try {
      const res = await api.post('/resumes/match-jd', {
        resumeId: activeResume?.id,
        jobDescriptionText: jdText,
        companyName,
        roleTitle,
      });
      setMatchResult(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to match JD');
    } finally {
      setMatching(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!roleTitle) {
      alert('Please enter a role title in the JD Match form first.');
      return;
    }

    setRoadmapping(true);
    try {
      const res = await api.post('/resumes/generate-roadmap', {
        targetRole: roleTitle,
        targetCompany: companyName || 'Dream Company',
        timelineWeeks: 4,
      });
      setRoadmapResult(res.data.data.roadmap);
      alert('Custom study roadmap generated based on skill gaps!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to generate roadmap');
    } finally {
      setRoadmapping(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-zinc-100">Resume Intelligence</h2>
        <p className="text-sm text-zinc-400">Optimize your resume ATS score and scan against job descriptions.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Upload and Resume List */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-card p-6 flex flex-col gap-5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Upload New Resume</span>

            <label className="border-2 border-dashed border-zinc-800 hover:border-primary/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-zinc-950/20">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-zinc-500" />
              )}
              <span className="text-xs font-semibold text-zinc-300">
                {uploading ? 'Analyzing contents...' : 'Choose Resume (PDF, Word, Image)'}
              </span>
              <span className="text-[10px] text-zinc-500">Max size: 5MB</span>
              <input type="file" onChange={handleFileUpload} accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*" className="hidden" disabled={uploading} />
            </label>
          </div>

          <div className="glass-card p-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Resumes</span>
            <div className="flex flex-col gap-2">
              {resumes.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => selectResume(r.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    activeResume?.id === r.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-zinc-950/20 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold truncate text-left">{r.fileName || 'resume.pdf'}</span>
                  </div>
                  {r.isPrimary && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white">Active</span>}
                </button>
              ))}
              {resumes.length === 0 && (
                <span className="text-xs text-zinc-650 text-center py-4">No resumes uploaded yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Resume Scores and optimization suggestions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeResume ? (
            <>
              {/* ATS Scores Gauge Row */}
              <div className="glass-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                    <span className="text-lg font-bold">{activeResume.atsScore}%</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">ATS Score</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <span className="text-lg font-bold">{activeResume.technicalDepth}%</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tech Depth</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-emerald-600/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <span className="text-lg font-bold">{activeResume.projectImpact}%</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Project Impact</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-orange-600/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                    <span className="text-lg font-bold">{activeResume.qualityScore}%</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Quality Score</span>
                </div>
              </div>

              {/* Suggestions bullets */}
              <div className="glass-card p-6 flex flex-col gap-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Bullet Point Optimizer</span>
                <div className="flex flex-col gap-3">
                  {details?.aiSuggestions?.improvedBullets?.map((b: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col gap-2.5">
                      <div className="flex items-start gap-2 text-xs">
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <span className="text-zinc-500"><strong className="text-zinc-400">Original:</strong> {b.original}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs border-t border-zinc-900/50 pt-2.5">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-zinc-200"><strong className="text-emerald-400">Optimized:</strong> {b.improved}</span>
                      </div>
                    </div>
                  ))}
                  {(!details?.aiSuggestions?.improvedBullets || details.aiSuggestions.improvedBullets.length === 0) && (
                    <span className="text-xs text-zinc-500">No suggestions compiled. Ensure PDF text was extracted properly.</span>
                  )}
                </div>
              </div>

              {/* Missing Gaps keywords */}
              <div className="glass-card p-6 flex flex-col gap-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Missing Critical Skills</span>
                <div className="flex flex-wrap gap-2">
                  {details?.aiSuggestions?.missingSections?.map((skill: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-300">
                      {skill}
                    </span>
                  ))}
                  {(!details?.aiSuggestions?.missingSections || details.aiSuggestions.missingSections.length === 0) && (
                    <span className="text-xs text-zinc-500">Perfect! No major missing sections detected.</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-3">
              <Upload className="h-10 w-10 text-zinc-650" />
              <span className="text-sm font-semibold text-zinc-400">Please upload a resume to inspect ATS suggestions</span>
            </div>
          )}
        </div>
      </div>

      {/* JD Matching section */}
      {activeResume && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-card p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <FileCheck className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Job Description Match</span>
            </div>

            <form onSubmit={handleJdMatch} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Google"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Role Title</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Backend Engineer"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Job Description Details</label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste core requirements, skills needed..."
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-200 min-h-[120px] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={matching}
                className="py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compare Resume & JD'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            {matchResult ? (
              <div className="glass-card p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Similarity Scorecard</span>
                  <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-bold">
                    {matchResult.matchPercent}% Match
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Missing in JD */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Missing Skills for Role</span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingSkills?.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-500/5 border border-red-500/10 text-[9px] text-red-400">
                          {s}
                        </span>
                      ))}
                      {(!matchResult.missingSkills || matchResult.missingSkills.length === 0) && (
                        <span className="text-xs text-zinc-500">Perfect overlap!</span>
                      )}
                    </div>
                  </div>

                  {/* Overlaps */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Overlapping Match Keywords</span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.overlapSkills?.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-[9px] text-emerald-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tailoring suggestions */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Tailoring Recommendations</span>
                  <div className="flex flex-col gap-2">
                    {matchResult.analysis?.tailoringSuggestions?.map((s: string, i: number) => (
                      <div key={i} className="text-xs text-zinc-300 flex items-start gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                        <Sparkles className="h-4 w-4 text-primary shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-4 border-t border-zinc-900 pt-5">
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={roadmapping}
                    className="px-5 py-3 rounded-xl bg-accent-emerald text-white text-xs font-semibold transition-all hover:bg-emerald-500 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {roadmapping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Compass className="h-4 w-4" /> Create Custom Roadmap Gaps
                      </>
                    )}
                  </button>

                  {roadmapResult && (
                    <Link
                      href="/roadmap"
                      className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1"
                    >
                      View Generated Roadmap
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-3">
                <Percent className="h-10 w-10 text-zinc-650" />
                <span className="text-sm font-semibold text-zinc-400">Paste job requirements on the left to see similarity scoring</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
