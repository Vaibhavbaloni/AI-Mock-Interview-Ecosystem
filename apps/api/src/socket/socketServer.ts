// apps/api/src/socket/socketServer.ts
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { InterviewSession } from '../models/InterviewSession';
import { aiOrchestrator } from '../ai/provider/AIOrchestrator';
import {
  buildInterviewSystemPrompt,
  buildEvaluationPrompt,
  buildFinalReportPrompt,
  PersonaId,
  PERSONAS,
} from '../ai/prompts/interview.prompts';
import { InterviewStatus, UserRole } from '@prisma/client';

interface SocketUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export function initializeSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1] ||
        socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: UserRole };
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      next();
    } catch (err) {
      logger.error('Socket authentication failed:', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user?.email})`);

    // ─── JOIN INTERVIEW ──────────────────────────────────
    socket.on('join_interview', async ({ interviewId }) => {
      try {
        const userId = socket.user?.id;
        if (!userId) return socket.emit('error', 'User not authenticated');

        // Check if interview exists and belongs to the user
        const interview = await prisma.interview.findFirst({
          where: { id: interviewId, userId },
          include: { user: { include: { skills: true } } },
        });

        if (!interview) {
          return socket.emit('error', 'Interview not found or access denied');
        }

        socket.join(interviewId);
        logger.info(`User ${userId} joined room ${interviewId}`);

        // Find or create MongoDB transcript session
        let mongoSession = await InterviewSession.findOne({ interviewId });
        if (!mongoSession) {
          mongoSession = await InterviewSession.create({
            interviewId,
            userId,
            messages: [],
            replayTimeline: [],
            tokenUsage: {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              model: env.AI_PRIMARY_PROVIDER,
              estimatedCostUsd: 0,
            },
          });
        }

        // If interview just scheduled, transition to IN_PROGRESS and seed the first question
        if (interview.status === InterviewStatus.SCHEDULED) {
          await prisma.interview.update({
            where: { id: interviewId },
            data: {
              status: InterviewStatus.IN_PROGRESS,
              startedAt: new Date(),
              mongoSessionId: mongoSession._id as string,
            },
          });

          // Generate first question
          const personaId = (interview.persona as PersonaId) || 'friendly_mentor';
          const skillsList = interview.user.skills.map((s) => s.name);
          const totalQuestions = 5; // Default interview length

          const systemPrompt = buildInterviewSystemPrompt({
            personaId,
            interviewType: interview.type,
            difficulty: interview.difficulty,
            targetRole: 'Software Engineer',
            companyTrack: interview.companyTrack || undefined,
            userSkills: skillsList,
            questionCount: 1,
            totalQuestions,
            topicsCovered: [],
          });

          const response = await aiOrchestrator.parseJSON<{
            question: string;
            questionType: string;
            isFollowup: boolean;
            difficultyAdjustment: string;
            internalNote: string;
            evaluationRubric: string[];
          }>(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Hello, I am ready to start my interview.' },
            ],
            'interview_qa'
          );

          // Save question in PostgreSQL
          const dbQuestion = await prisma.interviewQuestion.create({
            data: {
              interviewId,
              sequenceOrder: 1,
              questionText: response.question,
              questionType: response.questionType,
              difficulty: interview.difficulty,
              isFollowup: response.isFollowup,
            },
          });

          // Save question in MongoDB
          mongoSession.messages.push({
            role: 'interviewer',
            content: response.question,
            timestamp: new Date(),
            persona: personaId,
          });
          await mongoSession.save();

          io.to(interviewId).emit('new_question', {
            questionId: dbQuestion.id,
            questionText: response.question,
            questionType: response.questionType,
            sequenceOrder: 1,
            totalQuestions,
            internalNote: response.internalNote,
            evaluationRubric: response.evaluationRubric,
          });
        } else {
          // Send current state
          const questionsCount = await prisma.interviewQuestion.count({
            where: { interviewId },
          });

          const currentQuestions = await prisma.interviewQuestion.findMany({
            where: { interviewId },
            orderBy: { sequenceOrder: 'asc' },
            include: { answers: true },
          });

          socket.emit('resume_session', {
            status: interview.status,
            questions: currentQuestions,
            messages: mongoSession.messages,
            totalQuestions: 5,
          });
        }
      } catch (err: any) {
        logger.error('Error in join_interview:', err);
        socket.emit('error', 'Failed to initialize or join interview');
      }
    });

    // ─── CANDIDATE ANSWER ────────────────────────────────
    socket.on('submit_answer', async ({ interviewId, questionId, answerText }) => {
      try {
        const userId = socket.user?.id;
        if (!userId) return socket.emit('error', 'User not authenticated');

        const interview = await prisma.interview.findFirst({
          where: { id: interviewId, userId },
          include: {
            user: { include: { skills: true } },
            questions: {
              orderBy: { sequenceOrder: 'asc' },
              include: { answers: true },
            },
          },
        });

        if (!interview || interview.status !== InterviewStatus.IN_PROGRESS) {
          return socket.emit('error', 'Interview is not in progress');
        }

        const currentQuestion = interview.questions.find((q) => q.id === questionId);
        if (!currentQuestion) return socket.emit('error', 'Question not found');

        // 1. Evaluate Candidate Answer via AI
        const evaluationPrompt = buildEvaluationPrompt({
          question: currentQuestion.questionText,
          answer: answerText,
          questionType: currentQuestion.questionType || 'technical',
          difficulty: interview.difficulty,
          evaluationRubric: ['Clarity', 'Accuracy', 'Problem-Solving'],
        });

        const evaluation = await aiOrchestrator.parseJSON<{
          score: number;
          technicalAccuracy: number;
          communicationClarity: number;
          completeness: number;
          keywordsMatched: string[];
          fillerWords: string[];
          strengths: string[];
          weaknesses: string[];
          idealAnswer: string;
          coachingTip: string;
          starComponents?: {
            situation?: boolean;
            task?: boolean;
            action?: boolean;
            result?: boolean;
          };
        }>([{ role: 'user', content: evaluationPrompt }], 'behavioral_eval');

        // 2. Save Answer in PostgreSQL
        const dbAnswer = await prisma.interviewAnswer.create({
          data: {
            questionId,
            interviewId,
            answerText,
            score: evaluation.score,
            aiFeedback: evaluation as any,
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
          },
        });

        // 3. Update MongoDB
        const mongoSession = await InterviewSession.findOne({ interviewId });
        if (mongoSession) {
          // Add candidate answer message
          mongoSession.messages.push({
            role: 'candidate',
            content: answerText,
            timestamp: new Date(),
            evaluation: {
              score: evaluation.score,
              keywordsMatched: evaluation.keywordsMatched,
              fillerWords: evaluation.fillerWords,
              sentiment: evaluation.score >= 75 ? 'positive' : evaluation.score >= 50 ? 'neutral' : 'negative',
              starComponents: {
                situation: !!evaluation.starComponents?.situation,
                task: !!evaluation.starComponents?.task,
                action: !!evaluation.starComponents?.action,
                result: !!evaluation.starComponents?.result,
              },
            },
          });

          // Add a custom coaching event to timeline
          const timeOffset = Math.floor((Date.now() - (interview.startedAt?.getTime() || Date.now())) / 1000);
          if (evaluation.fillerWords.length > 2) {
            mongoSession.replayTimeline.push({
              timeOffsetSeconds: timeOffset,
              event: 'FILLER_WORD',
              note: `Used filler words: ${evaluation.fillerWords.join(', ')}`,
              severity: 'warning',
            });
          }
          if (evaluation.score >= 85) {
            mongoSession.replayTimeline.push({
              timeOffsetSeconds: timeOffset,
              event: 'STRONG_ANSWER',
              note: evaluation.strengths[0] || 'Very strong response',
              severity: 'positive',
            });
          } else if (evaluation.score < 50) {
            mongoSession.replayTimeline.push({
              timeOffsetSeconds: timeOffset,
              event: 'WEAK_ANSWER',
              note: evaluation.weaknesses[0] || 'Answer lacked depth or clarity',
              severity: 'negative',
            });
          }

          await mongoSession.save();
        }

        // Emit local answer evaluation back for real-time coach view
        socket.emit('answer_evaluated', {
          score: evaluation.score,
          feedback: evaluation.coachingTip,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
        });

        // 4. Check If Interview Finished
        const totalQuestions = 5;
        const currentOrder = currentQuestion.sequenceOrder;

        if (currentOrder >= totalQuestions) {
          // Mark Interview as Completed and trigger Report Compilation
          await prisma.interview.update({
            where: { id: interviewId },
            data: {
              status: InterviewStatus.COMPLETED,
              completedAt: new Date(),
            },
          });

          io.to(interviewId).emit('interview_completed', {
            message: 'Interview completed. Generating your performance report...',
          });

          // Compile Report Async
          setTimeout(async () => {
            try {
              const freshSession = await InterviewSession.findOne({ interviewId });
              const freshQuestions = await prisma.interviewQuestion.findMany({
                where: { interviewId },
                include: { answers: true },
              });

              const transcript = freshQuestions.map((q) => ({
                question: q.questionText,
                answer: q.answers[0]?.answerText || '',
                score: q.answers[0]?.score || 0,
              }));

              const avgScore = Math.round(
                transcript.reduce((acc, t) => acc + t.score, 0) / transcript.length
              );

              const reportPrompt = buildFinalReportPrompt({
                interviewType: interview.type,
                difficulty: interview.difficulty,
                companyTrack: interview.companyTrack || undefined,
                transcript,
                averageScore: avgScore,
              });

              const report = await aiOrchestrator.parseJSON<{
                summary: string;
                technicalSummary: string;
                behavioralSummary: string;
                overallScore: number;
                technicalScore: number;
                communicationScore: number;
                behavioralScore: number;
                strengths: string[];
                weaknesses: string[];
                improvementPlan: string[];
                hireRecommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'No Hire';
                hireProbability: number;
                nextSteps: string[];
              }>([{ role: 'user', content: reportPrompt }], 'report_generation');

              // Update Mongoose Session Report
              if (freshSession) {
                freshSession.aiReport = {
                  summary: report.summary,
                  technicalSummary: report.technicalSummary,
                  behavioralSummary: report.behavioralSummary,
                  strengths: report.strengths,
                  weaknesses: report.weaknesses,
                  improvementPlan: report.improvementPlan,
                  hireRecommendation: report.hireRecommendation,
                  nextSteps: report.nextSteps,
                };
                await freshSession.save();
              }

              // Update Postgres with overall scores
              await prisma.interview.update({
                where: { id: interviewId },
                data: {
                  overallScore: report.overallScore,
                  technicalScore: report.technicalScore,
                  communicationScore: report.communicationScore,
                  behavioralScore: report.behavioralScore,
                  hireProbability: report.hireProbability,
                },
              });

              // Apply Gamification XP
              const userGamification = await prisma.userGamification.findUnique({
                where: { userId },
              });

              if (userGamification) {
                const xpEarned = report.overallScore * 2;
                await prisma.userGamification.update({
                  where: { userId },
                  data: {
                    xpTotal: { increment: xpEarned },
                    streakCurrent: { increment: 1 },
                    lastActivity: new Date(),
                  },
                });
              }

              io.to(interviewId).emit('report_generated', {
                report,
                overallScore: report.overallScore,
                hireProbability: report.hireProbability,
              });
            } catch (reportErr) {
              logger.error('Error generating final report:', reportErr);
            }
          }, 1000);
        } else {
          // Generate NEXT Question
          const nextOrder = currentOrder + 1;
          const personaId = (interview.persona as PersonaId) || 'friendly_mentor';
          const skillsList = interview.user.skills.map((s) => s.name);
          const topicsCovered = interview.questions.map((q) => q.questionText.slice(0, 20));

          const systemPrompt = buildInterviewSystemPrompt({
            personaId,
            interviewType: interview.type,
            difficulty: interview.difficulty,
            targetRole: 'Software Engineer',
            companyTrack: interview.companyTrack || undefined,
            userSkills: skillsList,
            questionCount: nextOrder,
            totalQuestions,
            topicsCovered,
          });

          // Feed full conversational history to the model
          const chatHistory = mongoSession
            ? mongoSession.messages.map((m) => ({
                role: m.role === 'interviewer' ? ('assistant' as const) : ('user' as const),
                content: m.content,
              }))
            : [];

          const response = await aiOrchestrator.parseJSON<{
            question: string;
            questionType: string;
            isFollowup: boolean;
            difficultyAdjustment: string;
            internalNote: string;
            evaluationRubric: string[];
          }>(
            [
              { role: 'system', content: systemPrompt },
              ...chatHistory,
              { role: 'user', content: answerText },
            ],
            'interview_qa'
          );

          // Save Question in Postgres
          const dbQuestion = await prisma.interviewQuestion.create({
            data: {
              interviewId,
              sequenceOrder: nextOrder,
              questionText: response.question,
              questionType: response.questionType,
              difficulty: interview.difficulty,
              isFollowup: response.isFollowup,
            },
          });

          // Save Question in MongoDB
          if (mongoSession) {
            mongoSession.messages.push({
              role: 'interviewer',
              content: response.question,
              timestamp: new Date(),
              persona: personaId,
            });
            await mongoSession.save();
          }

          io.to(interviewId).emit('new_question', {
            questionId: dbQuestion.id,
            questionText: response.question,
            questionType: response.questionType,
            sequenceOrder: nextOrder,
            totalQuestions,
            internalNote: response.internalNote,
            evaluationRubric: response.evaluationRubric,
          });
        }
      } catch (err: any) {
        logger.error('Error processing candidate answer:', err);
        socket.emit('error', 'Failed to process answer and load next question');
      }
    });

    // ─── WEBCAM HEARTBEAT / REAL-TIME COACH FEED ──────────
    socket.on('webcam_heartbeat', async ({ interviewId, analytics }) => {
      try {
        const mongoSession = await InterviewSession.findOne({ interviewId });
        if (mongoSession) {
          // Average out the video analysis metrics or store as is
          mongoSession.videoAnalysis = {
            eyeContactScore: analytics.eyeContact || 80,
            smileFrequency: analytics.smile || 10,
            headPostureScore: analytics.posture || 90,
            speakingPaceWpm: analytics.paceWpm || 130,
            confidenceScore: analytics.confidence || 75,
            nervousnessIndicators: analytics.nervousIndicators || [],
          };

          // Generate a visual event note if eye contact is very low
          if (analytics.eyeContact < 40) {
            const timeOffset = Math.floor((Date.now() - (mongoSession.createdAt.getTime() || Date.now())) / 1000);
            mongoSession.replayTimeline.push({
              timeOffsetSeconds: timeOffset,
              event: 'EYE_CONTACT_DROP',
              note: 'Eye contact dropped significantly',
              severity: 'warning',
            });
          }

          await mongoSession.save();
        }
      } catch (err) {
        logger.error('Error storing video analysis telemetry:', err);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}
