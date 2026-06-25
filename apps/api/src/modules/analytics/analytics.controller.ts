// apps/api/src/modules/analytics/analytics.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export class AnalyticsController {
  async getDashboardSummary(req: Request, res: Response) {
    const userId = req.user.id;

    // 1. Fetch User Profile, Skills, and Gamification stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        gamification: true,
        dnaProfile: true,
        skills: true,
        userBadges: {
          include: { badge: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Fetch Resume scores
    const primaryResume = await prisma.resume.findFirst({
      where: { userId, isPrimary: true },
    });
    const resumeScore = primaryResume?.atsScore || 0;

    // 3. Fetch Coding stats
    const codingSubmissions = await prisma.codingSubmission.findMany({
      where: { userId },
    });
    const totalSubmissions = codingSubmissions.length;
    const acceptedSubmissions = codingSubmissions.filter((s) => s.status === 'accepted').length;
    const codingScore = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    // 4. Fetch Mock Interview stats
    const completedInterviews = await prisma.interview.findMany({
      where: { userId, status: 'COMPLETED' },
    });
    const interviewCount = completedInterviews.length;
    const avgInterviewScore =
      interviewCount > 0
        ? Math.round(
            completedInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / interviewCount
          )
        : 0;

    // 5. Calculate Consistency score (based on days active in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeInterviews = await prisma.interview.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    });
    const uniqueDays = new Set(activeInterviews.map((i) => i.createdAt.toISOString().split('T')[0]));
    const consistencyScore = Math.min(Math.round((uniqueDays.size / 30) * 100) * 5, 100);

    // 6. Calculate Overall Placement Readiness Index (PRI)
    // Formula: 20% Resume + 30% Coding + 30% Interview + 20% Consistency
    const priScore = Math.round(
      resumeScore * 0.2 + codingScore * 0.3 + avgInterviewScore * 0.3 + consistencyScore * 0.2
    );

    // 7. Save PRI history if changed or periodically
    const latestPriRecord = await prisma.placementReadiness.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latestPriRecord || latestPriRecord.overallPri !== priScore) {
      await prisma.placementReadiness.create({
        data: {
          userId,
          overallPri: priScore,
          resumeScore,
          codingScore,
          communicationScore: avgInterviewScore, // Mock proxy
          behavioralScore: avgInterviewScore, // Mock proxy
          consistencyScore,
          hireProbability: Math.min(Math.max(priScore - 5, 0), 99),
        },
      });
    }

    // 8. Fetch heatmap calendar dates (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const mockInterviewsForHeatmap = await prisma.interview.findMany({
      where: {
        userId,
        createdAt: { gte: oneYearAgo },
      },
      select: { createdAt: true },
    });

    // Format dates to YYYY-MM-DD
    const heatmapCounts: Record<string, number> = {};
    mockInterviewsForHeatmap.forEach((interview) => {
      const dateStr = interview.createdAt.toISOString().split('T')[0];
      heatmapCounts[dateStr] = (heatmapCounts[dateStr] || 0) + 1;
    });

    const heatmapData = Object.entries(heatmapCounts).map(([date, count]) => ({
      date,
      count,
    }));

    // 9. Aggregate response
    const dashboardSummary = {
      user: {
        fullName: user.profile?.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.profile?.avatarUrl,
        headline: user.profile?.headline,
      },
      priScore: priScore || 60, // Default baseline
      metrics: {
        resumeScore,
        codingScore,
        interviewScore: avgInterviewScore,
        consistencyScore,
      },
      gamification: {
        xp: user.gamification?.xpTotal || 0,
        level: user.gamification?.level || 1,
        streak: user.gamification?.streakCurrent || 0,
        streakBest: user.gamification?.streakBest || 0,
        badges: user.userBadges.map((ub) => ({
          name: ub.badge.name,
          description: ub.badge.description,
          earnedAt: ub.earnedAt,
        })),
      },
      dna: {
        communication: user.dnaProfile?.communication || 50,
        leadership: user.dnaProfile?.leadership || 50,
        problemSolving: user.dnaProfile?.problemSolving || 50,
        technical: user.dnaProfile?.technical || 50,
        adaptability: user.dnaProfile?.adaptability || 50,
        confidence: user.dnaProfile?.confidence || 50,
      },
      heatmap: heatmapData,
    };

    return successResponse(res, dashboardSummary, 'Dashboard metrics compiled successfully');
  }

  async getHistoricalReadiness(req: Request, res: Response) {
    const userId = req.user.id;
    const history = await prisma.placementReadiness.findMany({
      where: { userId },
      orderBy: { recordedAt: 'asc', },
      take: 15, // Return past 15 updates
    });

    return successResponse(res, history, 'Historical readiness retrieved successfully');
  }
}

export const analyticsController = new AnalyticsController();
