// apps/api/src/modules/interviews/interviews.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { InterviewSession } from '../../models/InterviewSession';
import { successResponse } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { aiOrchestrator } from '../../ai/provider/AIOrchestrator';
import { InterviewStatus, InterviewType, DifficultyLevel } from '@prisma/client';

export class InterviewsController {
  async createInterview(req: Request, res: Response) {
    const userId = req.user.id;
    const { type, difficulty, persona, companyTrack, isPressureMode, isVoiceEnabled, isVideoEnabled } = req.body;

    if (!type) {
      throw new ValidationError('Interview type is required');
    }

    const interview = await prisma.interview.create({
      data: {
        userId,
        type: type as InterviewType,
        difficulty: (difficulty as DifficultyLevel) || DifficultyLevel.MEDIUM,
        persona: persona || 'friendly_mentor',
        companyTrack: companyTrack || null,
        isPressureMode: !!isPressureMode,
        isVoiceEnabled: !!isVoiceEnabled,
        isVideoEnabled: !!isVideoEnabled,
        status: InterviewStatus.SCHEDULED,
      },
    });

    return successResponse(res, interview, 'Interview scheduled successfully', 201);
  }

  async getInterviews(req: Request, res: Response) {
    const userId = req.user.id;
    const interviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, interviews, 'Interviews retrieved successfully');
  }

  async getInterviewDetails(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    const interview = await prisma.interview.findFirst({
      where: { id, userId },
      include: {
        questions: {
          orderBy: { sequenceOrder: 'asc' },
          include: { answers: true },
        },
        journal: true,
      },
    });

    if (!interview) {
      throw new NotFoundError('Interview session not found or access denied');
    }

    // Load rich transcripts and video analytics from MongoDB
    const mongoSession = await InterviewSession.findOne({ interviewId: id });

    return successResponse(
      res,
      {
        interview,
        transcripts: mongoSession,
      },
      'Interview details retrieved successfully'
    );
  }

  async createJournal(req: Request, res: Response) {
    const userId = req.user.id;
    const { id: interviewId } = req.params;
    const { wentWell, wentBadly, willImprove } = req.body;

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId },
    });

    if (!interview) {
      throw new NotFoundError('Interview not found or access denied');
    }

    // Call AI to generate reflection feedback
    const reflectionPrompt = `You are a career development coach. Give constructive feedback on a student's self-reflection of their interview.
What went well: ${wentWell || 'Not filled'}
What went poorly: ${wentBadly || 'Not filled'}
What they plan to improve: ${willImprove || 'Not filled'}
Overall Score in interview: ${interview.overallScore || 'Not evaluated'}

Write a 2-3 sentence encouraging, actionable summary of what they should focus on. Keep it friendly and concise.`;

    const aiResponse = await aiOrchestrator.chat([
      { role: 'user', content: reflectionPrompt },
    ]);

    const journal = await prisma.interviewJournal.upsert({
      where: { interviewId },
      update: {
        wentWell,
        wentBadly,
        willImprove,
        aiReflection: aiResponse.content,
      },
      create: {
        userId,
        interviewId,
        wentWell,
        wentBadly,
        willImprove,
        aiReflection: aiResponse.content,
      },
    });

    return successResponse(res, journal, 'Interview reflection journal updated');
  }
}

export const interviewsController = new InterviewsController();
