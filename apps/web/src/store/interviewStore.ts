// apps/web/src/store/interviewStore.ts
import { create } from 'zustand';
import { getSocket, disconnectSocket } from '@/lib/socket';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  evaluation?: {
    score: number;
    feedback?: string;
  };
}

interface Question {
  questionId: string;
  questionText: string;
  questionType: string;
  sequenceOrder: number;
  totalQuestions: number;
  internalNote?: string;
  evaluationRubric?: string[];
}

interface InterviewState {
  activeInterviewId: string | null;
  currentQuestion: Question | null;
  messages: Message[];
  isCompleted: boolean;
  isGeneratingReport: boolean;
  report: any | null;
  error: string | null;
  joinSession: (interviewId: string) => void;
  submitAnswer: (answerText: string) => void;
  sendWebcamHeartbeat: (analytics: {
    eyeContact: number;
    smile: number;
    posture: number;
    paceWpm: number;
    confidence: number;
  }) => void;
  leaveSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  activeInterviewId: null,
  currentQuestion: null,
  messages: [],
  isCompleted: false,
  isGeneratingReport: false,
  report: null,
  error: null,

  joinSession: (interviewId) => {
    set({ activeInterviewId: interviewId, isCompleted: false, messages: [], currentQuestion: null, report: null });
    const socket = getSocket();

    socket.connect();

    socket.emit('join_interview', { interviewId });

    socket.on('new_question', (question: Question) => {
      set((state) => ({
        currentQuestion: question,
        messages: [
          ...state.messages,
          { role: 'interviewer', content: question.questionText, timestamp: new Date() },
        ],
      }));
    });

    socket.on('resume_session', (data: { status: string; messages: any[]; totalQuestions: number }) => {
      const messagesFormatted = data.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));

      // Find the last interviewer message as active question if still in progress
      let activeQ = null;
      if (data.status === 'IN_PROGRESS' && messagesFormatted.length > 0) {
        const lastInterviewerMsg = [...messagesFormatted].reverse().find((m) => m.role === 'interviewer');
        if (lastInterviewerMsg) {
          activeQ = {
            questionId: '', // Mock placeholder, backend resolves it
            questionText: lastInterviewerMsg.content,
            questionType: 'technical',
            sequenceOrder: messagesFormatted.filter((m) => m.role === 'interviewer').length,
            totalQuestions: data.totalQuestions,
          };
        }
      }

      set({
        messages: messagesFormatted,
        isCompleted: data.status === 'COMPLETED',
        currentQuestion: activeQ,
      });
    });

    socket.on('answer_evaluated', (data: { score: number; feedback: string }) => {
      // Update last candidate message with evaluation scores
      set((state) => {
        const updatedMessages = [...state.messages];
        const lastCandidateIdx = [...updatedMessages].reverse().findIndex((m) => m.role === 'candidate');
        if (lastCandidateIdx !== -1) {
          const idx = updatedMessages.length - 1 - lastCandidateIdx;
          updatedMessages[idx].evaluation = {
            score: data.score,
            feedback: data.feedback,
          };
        }
        return { messages: updatedMessages };
      });
    });

    socket.on('interview_completed', () => {
      set({ isCompleted: true, isGeneratingReport: true });
    });

    socket.on('report_generated', (data: { report: any }) => {
      set({ report: data.report, isGeneratingReport: false });
    });

    socket.on('error', (errMsg: string) => {
      set({ error: errMsg });
    });
  },

  submitAnswer: (answerText) => {
    const { activeInterviewId, currentQuestion } = get();
    if (!activeInterviewId || !currentQuestion) return;

    const socket = getSocket();
    socket.emit('submit_answer', {
      interviewId: activeInterviewId,
      questionId: currentQuestion.questionId,
      answerText,
    });

    // Optimistically add candidate message
    set((state) => ({
      messages: [
        ...state.messages,
        { role: 'candidate', content: answerText, timestamp: new Date() },
      ],
      currentQuestion: null, // Clear active question until next arrives
    }));
  },

  sendWebcamHeartbeat: (analytics) => {
    const { activeInterviewId } = get();
    if (!activeInterviewId) return;

    const socket = getSocket();
    socket.emit('webcam_heartbeat', {
      interviewId: activeInterviewId,
      analytics,
    });
  },

  leaveSession: () => {
    const socket = getSocket();
    socket.off('new_question');
    socket.off('resume_session');
    socket.off('answer_evaluated');
    socket.off('interview_completed');
    socket.off('report_generated');
    socket.off('error');
    disconnectSocket();
    set({ activeInterviewId: null, currentQuestion: null, messages: [], isCompleted: false, report: null });
  },
}));
