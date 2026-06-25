// apps/api/src/modules/resumes/resumes.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ResumeAnalysis } from '../../models/ResumeAnalysis';
import { successResponse } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { extractTextFromPdf } from '../../utils/pdf';
import { extractTextFromDocx } from '../../utils/docx';
import { extractTextFromImage } from '../../utils/imageOcr';
import { aiOrchestrator } from '../../ai/provider/AIOrchestrator';
import { buildResumeExtractionPrompt, buildJDMatchingPrompt, buildRoadmapPrompt } from '../../ai/prompts/resume.prompts';
import { SkillLevel } from '@prisma/client';

export class ResumesController {
  async uploadAndAnalyze(req: Request, res: Response) {
    const userId = req.user.id;
    if (!req.file) {
      throw new ValidationError('No resume file uploaded. Please upload a PDF, DOCX, or Image file.');
    }

    // 1. Extract Text
    let rawText = '';
    const mime = req.file.mimetype || '';
    const originalName = req.file.originalname || '';
    const isImage = mime.startsWith('image/');
    const isDocx = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || originalName.endsWith('.docx');

    if (mime === 'application/pdf' || originalName.endsWith('.pdf')) {
      rawText = await extractTextFromPdf(req.file.buffer);
    } else if (isDocx) {
      rawText = await extractTextFromDocx(req.file.buffer);
    } else if (isImage) {
      rawText = await extractTextFromImage(req.file.buffer, mime);
    } else {
      throw new ValidationError('Unsupported file format. Please upload a PDF, Word (.docx), or Image file.');
    }

    // 2. Analyze via Gemini AI
    const extractionPrompt = buildResumeExtractionPrompt(rawText);
    const analysis = await aiOrchestrator.parseJSON<any>(
      [{ role: 'user', content: extractionPrompt }],
      'resume_extraction'
    );

    // 3. Save to PostgreSQL
    const dbResume = await prisma.resume.create({
      data: {
        userId,
        fileUrl: 'local://' + (req.file.originalname || 'resume.pdf'), // Mock file url
        fileName: req.file.originalname,
        atsScore: analysis.scores?.atsScore || 70,
        qualityScore: analysis.scores?.qualityScore || 70,
        technicalDepth: analysis.scores?.technicalDepth || 70,
        projectImpact: analysis.scores?.projectImpact || 70,
        overallScore: analysis.scores?.overallScore || 70,
        extractedData: {
          skills: analysis.skills,
          experience: analysis.experience,
          education: analysis.education,
        },
        analysisResult: {
          missingSections: analysis.missingSections,
          improvedBullets: analysis.improvedBullets,
          atsRecommendations: analysis.atsRecommendations,
          overallFeedback: analysis.overallFeedback,
        },
        isPrimary: true,
        isAnalyzed: true,
      },
    });

    // Make other resumes non-primary
    await prisma.resume.updateMany({
      where: { userId, id: { not: dbResume.id } },
      data: { isPrimary: false },
    });

    // 4. Save to MongoDB
    const mongoAnalysis = await ResumeAnalysis.create({
      resumeId: dbResume.id,
      userId,
      rawExtractedText: rawText,
      parsedData: {
        skills: analysis.skills,
        experience: analysis.experience,
        education: analysis.education,
        projects: analysis.projects || [],
        certifications: analysis.certifications || [],
        achievements: analysis.achievements || [],
      },
      aiSuggestions: {
        missingSections: analysis.missingSections || [],
        improvedBullets: analysis.improvedBullets || [],
        atsRecommendations: analysis.atsRecommendations || [],
        overallFeedback: analysis.overallFeedback || '',
      },
    });

    // 5. Proactively insert extracted skills into user skill profile
    const technicalSkills = analysis.skills?.technical || [];
    const existingUserSkills = await prisma.skill.findMany({
      where: { userId },
      select: { name: true },
    });
    const existingSkillNames = new Set(existingUserSkills.map((s) => s.name.toLowerCase()));

    const skillsToCreate = technicalSkills
      .filter((name: string) => !existingSkillNames.has(name.toLowerCase()))
      .slice(0, 10) // Limit to top 10 new skills to prevent spam
      .map((name: string) => ({
        userId,
        name,
        category: 'Extracted Skill',
        level: SkillLevel.INTERMEDIATE,
        source: 'resume',
      }));

    if (skillsToCreate.length > 0) {
      await prisma.skill.createMany({ data: skillsToCreate });
    }

    return successResponse(
      res,
      {
        resumeId: dbResume.id,
        postgresRecord: dbResume,
        mongoAnalysis: mongoAnalysis,
      },
      'Resume uploaded and analyzed successfully'
    );
  }

  async listResumes(req: Request, res: Response) {
    const userId = req.user.id;
    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, resumes, 'User resumes retrieved successfully');
  }

  async getResumeAnalysis(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new NotFoundError('Resume not found or access denied');
    }

    const mongoAnalysis = await ResumeAnalysis.findOne({ resumeId: id });

    return successResponse(
      res,
      {
        resume,
        details: mongoAnalysis,
      },
      'Resume analysis retrieved successfully'
    );
  }

  async matchJobDescription(req: Request, res: Response) {
    const userId = req.user.id;
    const { resumeId, jobDescriptionText, companyName, roleTitle } = req.body;

    if (!jobDescriptionText) {
      throw new ValidationError('Job description text is required');
    }

    // 1. Fetch resume to match
    let resume = null;
    if (resumeId) {
      resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    } else {
      resume = await prisma.resume.findFirst({ where: { userId, isPrimary: true } });
    }

    if (!resume) {
      throw new NotFoundError('No active resume found. Please upload a resume first.');
    }

    // Fetch deep analysis from MongoDB
    const mongoAnalysis = await ResumeAnalysis.findOne({ resumeId: resume.id });
    const resumeTextSummary = mongoAnalysis
      ? JSON.stringify({
          skills: mongoAnalysis.parsedData.skills,
          experience: mongoAnalysis.parsedData.experience.map((e) => `${e.role} at ${e.company}`),
          projects: mongoAnalysis.parsedData.projects.map((p) => p.name),
        })
      : JSON.stringify(resume.extractedData);

    // 2. Call JD Match AI
    const jdPrompt = buildJDMatchingPrompt(resumeTextSummary, jobDescriptionText);
    const matchResult = await aiOrchestrator.parseJSON<any>(
      [{ role: 'user', content: jdPrompt }],
      'jd_matching'
    );

    // 3. Save matching in DB
    const dbJd = await prisma.jobDescription.create({
      data: {
        userId,
        resumeId: resume.id,
        companyName: companyName || 'Target Company',
        roleTitle: roleTitle || 'Target Role',
        rawText: jobDescriptionText,
        matchPercent: matchResult.matchPercent || 0,
        overlapSkills: matchResult.overlapSkills || [],
        missingSkills: matchResult.missingSkills || [],
        analysis: matchResult,
      },
    });

    return successResponse(res, dbJd, 'Job description matched successfully');
  }

  async generateRoadmap(req: Request, res: Response) {
    const userId = req.user.id;
    const { targetRole, targetCompany, timelineWeeks } = req.body;

    if (!targetRole) {
      throw new ValidationError('Target role is required');
    }

    // 1. Fetch current skills
    const userSkills = await prisma.skill.findMany({ where: { userId } });
    const skillsList = userSkills.map((s) => s.name);

    // 2. Find latest JD match for missing skills
    const latestJd = await prisma.jobDescription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const missingSkills = latestJd ? latestJd.missingSkills : ['Docker', 'CI/CD', 'System Design'];

    // 3. Run AI roadmap generation
    const roadmapPrompt = buildRoadmapPrompt({
      currentSkills: skillsList,
      targetRole,
      targetCompany: targetCompany || undefined,
      missingSkills,
      timelineWeeks: timelineWeeks ? parseInt(timelineWeeks) : 4,
    });

    const roadmapData = await aiOrchestrator.parseJSON<any>(
      [{ role: 'user', content: roadmapPrompt }],
      'roadmap_generation'
    );

    // 4. Save to SkillRoadmap in PostgreSQL
    const roadmap = await prisma.skillRoadmap.create({
      data: {
        userId,
        targetRole,
        targetCompany: targetCompany || 'General',
        weeksPlan: roadmapData.weeks || [],
        progress: 0,
        isActive: true,
      },
    });

    return successResponse(res, { roadmap, details: roadmapData }, 'Roadmap generated successfully');
  }

  async getRoadmaps(req: Request, res: Response) {
    const userId = req.user.id;
    const roadmaps = await prisma.skillRoadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, roadmaps, 'User roadmaps retrieved successfully');
  }
}

export const resumesController = new ResumesController();
