// apps/web/src/app/(dashboard)/interview/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interviewStore';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Sparkles,
  Zap,
  Loader2,
  Tv,
} from 'lucide-react';

export default function LiveInterviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const {
    currentQuestion,
    messages,
    isCompleted,
    isGeneratingReport,
    report,
    error,
    joinSession,
    submitAnswer,
    sendWebcamHeartbeat,
    leaveSession,
  } = useInterviewStore();

  const [typedAnswer, setTypedAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(true);

  // Web Speech API references
  const recognitionRef = useRef<any>(null);

  // Local media stream references
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Chat window scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    joinSession(id);

    // Initialize Web Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTypedAnswer((prev) => prev + ' ' + finalTranscript);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }

    // Initialize WebCam stream
    startWebcam();

    // Setup periodic webcam analytical heartbeat mock (every 10s)
    const heartbeatInterval = setInterval(() => {
      sendWebcamHeartbeat({
        eyeContact: Math.floor(Math.random() * 30) + 60, // 60-90%
        smile: Math.floor(Math.random() * 20),
        posture: Math.floor(Math.random() * 15) + 80,
        paceWpm: Math.floor(Math.random() * 40) + 120, // 120-160
        confidence: Math.floor(Math.random() * 25) + 65,
      });
    }, 10000);

    return () => {
      leaveSession();
      stopWebcam();
      clearInterval(heartbeatInterval);
    };
  }, [id]);

  useEffect(() => {
    // Scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamEnabled(true);
    } catch (err) {
      console.warn('Webcam permission denied or unsupported:', err);
      setWebcamEnabled(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebcamEnabled(false);
  };

  const toggleWebcam = () => {
    if (webcamEnabled) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;

    submitAnswer(typedAnswer);
    setTypedAnswer('');
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const lastEvaluation = [...messages]
    .reverse()
    .find((m) => m.role === 'candidate' && m.evaluation)?.evaluation;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 relative">
      {/* Left Column: Webcam and Coach tips */}
      <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
        {/* WebCam Feed Box */}
        <div className="glass-card aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden relative bg-zinc-950/80 border border-zinc-900 shadow-xl flex items-center justify-center">
          {webcamEnabled ? (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover transform scale-x-[-1]" />
          ) : (
            <div className="text-zinc-650 flex flex-col items-center gap-2">
              <Tv className="h-8 w-8" />
              <span className="text-[10px] font-bold">Webcam Track Inactive</span>
            </div>
          )}

          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              onClick={toggleWebcam}
              className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
                webcamEnabled ? 'bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300' : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}
            >
              {webcamEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Real-time Coach view */}
        <div className="flex-1 glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Copilot Coach</span>
          </div>

          <div className="flex-1 flex flex-col justify-center text-center gap-2">
            {lastEvaluation ? (
              <div className="flex flex-col gap-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">Response Score:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    lastEvaluation.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : lastEvaluation.score >= 50 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {lastEvaluation.score}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 text-[11px] text-zinc-400 leading-relaxed">
                  <span className="font-semibold text-zinc-300">Live Advice:</span> {lastEvaluation.feedback}
                </div>
              </div>
            ) : (
              <div className="text-zinc-650 flex flex-col items-center gap-2">
                <Zap className="h-5 w-5" />
                <p className="text-[10px] leading-relaxed max-w-[180px]">
                  Submit your response to see instant scoring feedback and real-time coaching suggestions here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Q&A Chat Console */}
      <div className="flex-1 glass-card flex flex-col justify-between overflow-hidden relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 p-3 rounded bg-red-500/10 border border-red-500/25 text-red-400 text-xs z-10 text-center">
            {error}
          </div>
        )}

        {/* Dialog Header */}
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-zinc-300">Interview Room Q&A Log</span>
          </div>

          {isCompleted && (
            <button
              onClick={() => router.push(`/interview/${id}/report`)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/15"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compiling Report...
                </>
              ) : (
                'View Performance Scorecard'
              )}
            </button>
          )}
        </div>

        {/* Dialog lists */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-1.5 max-w-[80%] ${m.role === 'interviewer' ? 'self-start' : 'self-end items-end'}`}
            >
              <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">
                {m.role === 'interviewer' ? 'AI Interviewer' : 'Candidate'}
              </span>
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'interviewer'
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                    : 'bg-primary text-white rounded-tr-none'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        {!isCompleted && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-900 bg-zinc-950/40 flex flex-col gap-3">
            <textarea
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder={isRecording ? 'Listening to your response...' : 'Type or speak your answer here...'}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-primary/50 min-h-[70px] resize-none"
              disabled={isGeneratingReport}
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
                  isRecording
                    ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-450 hover:text-zinc-300'
                }`}
                title="Speak Answer"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="submit"
                disabled={!typedAnswer.trim() || isGeneratingReport}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                Send Answer <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export const Send = (props: any) => (
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
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
