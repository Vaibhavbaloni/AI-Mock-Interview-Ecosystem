// apps/api/src/modules/coach/coach.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';
import { InsightCategory, InsightSeverity } from '@prisma/client';

export class CoachController {
  async getInsights(req: Request, res: Response) {
    const userId = req.user.id;

    let insights = await prisma.aiCoachInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (insights.length === 0) {
      await prisma.aiCoachInsight.createMany({
        data: [
          {
            userId,
            category: InsightCategory.COMMUNICATION,
            insightText: 'Avoid filler words like "like" and "uh" during initial technical explanations. Your usage rose by +15% when describing hashing constraints.',
            severity: InsightSeverity.WARNING,
          },
          {
            userId,
            category: InsightCategory.TECHNICAL,
            insightText: 'Excellent space complexity analysis. You consistently optimize systems from O(N) to O(1) in mock interviews.',
            severity: InsightSeverity.INFO,
          },
          {
            userId,
            category: InsightCategory.BEHAVIORAL,
            insightText: 'Slow down pacing when answering stress questions. Keep your speed under 140 WPM for maximum clarity.',
            severity: InsightSeverity.CRITICAL,
          },
        ],
      });
      insights = await prisma.aiCoachInsight.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    }

    // Fetch speech diagnostics
    let speech = await prisma.userSpeechPatterns.findUnique({
      where: { userId },
    });

    // Seed defaults if empty
    if (!speech) {
      speech = await prisma.userSpeechPatterns.create({
        data: {
          userId,
          fillerWordRatio: 0.04,
          averagePacingWpm: 135,
          detectedToneProfile: 'Calm & Professional',
        },
      });
    }

    return successResponse(
      res,
      {
        insights,
        speechMetrics: speech,
      },
      'AI Coach analytics retrieved successfully'
    );
  }

  async compileWeeklyReport(req: Request, res: Response) {
    const userId = req.user.id;

    // Simulate an offline analysis summary trigger
    const initialCount = await prisma.aiCoachInsight.count({ where: { userId } });
    
    if (initialCount === 0) {
      await prisma.aiCoachInsight.createMany({
        data: [
          {
            userId,
            category: InsightCategory.COMMUNICATION,
            insightText: 'Avoid filler words like "like" and "uh" during initial technical explanations. Your usage rose by +15% when describing hashing constraints.',
            severity: InsightSeverity.WARNING,
          },
          {
            userId,
            category: InsightCategory.TECHNICAL,
            insightText: 'Excellent space complexity analysis. You consistently optimize systems from O(N) to O(1) in mock interviews.',
            severity: InsightSeverity.INFO,
          },
          {
            userId,
            category: InsightCategory.BEHAVIORAL,
            insightText: 'Slow down pacing when answering stress questions. Keep your speed under 140 WPM for maximum clarity.',
            severity: InsightSeverity.CRITICAL,
          },
        ],
      });
    }

    const updated = await prisma.aiCoachInsight.findMany({ where: { userId } });
    return successResponse(res, updated, 'Weekly coach analysis compiled successfully');
  }
}

export const coachController = new CoachController();
