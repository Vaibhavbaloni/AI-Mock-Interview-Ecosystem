// apps/web/src/app/(dashboard)/coding/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { api } from '@/lib/api';
import {
  Cpu,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function CodingArenaPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<any>(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  // Execution outputs
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    async function loadProblem() {
      try {
        const res = await api.get(`/coding/problems/${id}`);
        const prob = res.data.data;
        setProblem(prob);
        
        // Load starter code
        const starter = prob.starterCode?.[language] || `// Write your code here`;
        setCode(starter);
      } catch (err) {
        console.error('Failed to load problem:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
  }, [id]);

  // Handle language switch
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (problem?.starterCode?.[lang]) {
      setCode(problem.starterCode[lang]);
    } else {
      setCode(`// Starter code not available for ${lang}`);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const res = await api.post(`/coding/problems/${id}/submit`, {
        code,
        language,
      });
      setSubmissionResult(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-xs text-zinc-500">Launching LeetCode Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 relative">
      {/* Left Column: Problem description & details */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 overflow-y-auto pr-2">
        <div className="glass-card p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Code2 className="h-4.5 w-4.5 text-primary" />
            <span className="text-xs font-bold text-zinc-355 uppercase tracking-wider">{problem.title}</span>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            {/* Description */}
            <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{problem.description}</p>

            {/* Constraints */}
            {problem.constraints && (
              <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-900 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Constraints</span>
                <p className="text-zinc-500 leading-relaxed font-mono whitespace-pre-wrap">{problem.constraints}</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Optimization Feedback */}
        {submissionResult?.aiReview && (
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
              <span className="text-xs font-bold text-zinc-350 uppercase tracking-wider">AI Complexity Audit</span>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Time</span>
                  <span className="font-bold text-primary font-mono">{submissionResult.complexity?.time}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Space</span>
                  <span className="font-bold text-primary font-mono">{submissionResult.complexity?.space}</span>
                </div>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Refactoring Gaps</span>
                {submissionResult.aiReview?.refactoringSuggestions?.map((s: string, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-400 flex items-start gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Code Editor & Executions */}
      <div className="flex-1 glass-card flex flex-col justify-between overflow-hidden relative">
        {/* Editor Toolbar */}
        <div className="p-3 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
          <div className="flex items-center gap-2">
            {['javascript', 'python'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                  language === lang
                    ? 'bg-primary text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Submit Solution
              </>
            )}
          </button>
        </div>

        {/* Monaco Editor Panel */}
        <div className="flex-1 min-h-[300px] bg-zinc-950">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              automaticLayout: true,
              fontFamily: 'Fira Code, monospace',
            }}
          />
        </div>

        {/* Execution Results Console Drawer */}
        <div className="border-t border-zinc-900 bg-zinc-950/80 p-4 max-h-[220px] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-3">
            <Cpu className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Test Execution Logs</span>
          </div>

          <div className="flex flex-col gap-3">
            {submissionResult ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">Verdict:</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      submissionResult.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {submissionResult.status === 'accepted' ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" /> Accepted
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" /> Failed
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {submissionResult.testResults?.map((res: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 flex flex-col gap-1.5 text-[11px] font-mono">
                      <div className="flex justify-between items-center text-[10px] border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-550">Test Case {idx + 1}</span>
                        <span className={res.passed ? 'text-emerald-400' : 'text-red-400'}>{res.passed ? 'PASSED' : 'FAILED'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500">Input: {JSON.stringify(res.input)}</span>
                        <span className="text-zinc-300">Actual: {JSON.stringify(res.actual)}</span>
                        <span className="text-zinc-400">Expected: {JSON.stringify(res.expected)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <span className="text-xs text-zinc-650">No code compiled. Hit "Submit Solution" to trigger executions.</span>
            )}
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
