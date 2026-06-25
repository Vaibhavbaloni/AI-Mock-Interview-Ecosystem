// apps/api/src/modules/simulation/simulation.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { aiOrchestrator } from '../../ai/provider/AIOrchestrator';
import { SimulatorStage, SimulationStatus } from '@prisma/client';
import { executeJavaScriptLocal, getFunctionName } from '../coding/coding.controller';

export class SimulationController {
  async startSimulation(req: Request, res: Response) {
    const userId = req.user.id;
    const { companyName, roleTitle } = req.body;

    if (!companyName || !roleTitle) {
      throw new ValidationError('Company name and role title are required');
    }

    const simulation = await prisma.companySimulation.create({
      data: {
        userId,
        companyName,
        roleTitle,
        currentStage: SimulatorStage.RESUME_SCREENING,
        status: SimulationStatus.IN_PROGRESS,
        offerProbability: 15, // Baseline
      },
    });

    // Create initial round record
    await prisma.simulationRound.create({
      data: {
        simulationId: simulation.id,
        roundType: SimulatorStage.RESUME_SCREENING,
        score: 0,
        isPassed: false,
      },
    });

    return successResponse(res, simulation, 'Company hiring simulation started successfully');
  }

  async getSimulationStatus(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    const simulation = await prisma.companySimulation.findFirst({
      where: { id, userId },
      include: { rounds: { orderBy: { completedAt: 'asc' } } },
    });

    if (!simulation) {
      throw new NotFoundError('Simulation run not found');
    }

    return successResponse(res, simulation, 'Simulation status retrieved successfully');
  }

  async getOAProblem(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    const simulation = await prisma.companySimulation.findFirst({
      where: { id, userId },
    });

    if (!simulation) {
      throw new NotFoundError('Simulation run not found');
    }

    // Try finding coding problem matching target company
    let problem = await prisma.codingProblem.findFirst({
      where: {
        companies: {
          has: simulation.companyName
        }
      }
    });

    if (!problem) {
      // Fallback: pick any easy problem, or Two Sum
      problem = await prisma.codingProblem.findFirst({
        where: { difficulty: 'EASY' }
      });
    }

    if (!problem) {
      const { mockCodingProblems } = require('../../config/database');
      problem = mockCodingProblems[0];
    }

    return successResponse(res, problem, 'Active coding challenge retrieved successfully');
  }

  async submitRoundDetails(req: Request, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;
    const { code, language } = req.body;

    const simulation = await prisma.companySimulation.findFirst({
      where: { id, userId },
      include: { rounds: true },
    });

    if (!simulation) {
      throw new NotFoundError('Simulation run not found');
    }

    const currentStage = simulation.currentStage;
    const currentRound = simulation.rounds.find((r) => r.roundType === currentStage);
    if (!currentRound) {
      throw new NotFoundError('Active round record not found');
    }

    let roundScore = 0;
    let feedback = '';
    let passStage = false;

    // 1. Evaluate stage dynamically
    if (currentStage === SimulatorStage.RESUME_SCREENING) {
      const primaryResume = await prisma.resume.findFirst({
        where: { userId, isPrimary: true },
      });

      const profile = await prisma.profile.findFirst({ where: { userId } });
      const skills = await prisma.skill.findMany({ where: { userId } });

      let resumeText = '';
      if (primaryResume) {
        resumeText = primaryResume.rawExtractedText || JSON.stringify(primaryResume.extractedData);
      } else {
        resumeText = `Candidate Name: ${profile?.fullName || 'John Doe'}\nHeadline: ${profile?.headline || 'Engineer'}\nBio: ${profile?.bio || 'Aspiring Software Developer'}\nSkills: ${skills.map(s => s.name).join(', ')}`;
      }

      const prompt = `You are an expert recruiter screening candidates for ${simulation.companyName}.
Role: ${simulation.roleTitle}

Analyze the candidate's resume match level.
Resume Profile Text:
${resumeText}

Provide evaluation in strictly JSON format:
{
  "score": <number 0-100 representing suitability>,
  "feedback": "<2-3 sentences of constructive recruiter feedback>"
}`;

      try {
        const aiResult = await aiOrchestrator.parseJSON<{ score: number; feedback: string }>(
          [{ role: 'user', content: prompt }],
          'resume_extraction'
        );
        roundScore = aiResult.score || 70;
        feedback = aiResult.feedback || 'Resume matches role baseline.';
        passStage = roundScore >= 60;
      } catch (err) {
        roundScore = 75;
        feedback = 'Resume cleared screening based on skill alignment profile.';
        passStage = true;
      }

    } else if (currentStage === SimulatorStage.ONLINE_ASSESSMENT) {
      if (!code || !language) {
        throw new ValidationError('Code and language are required for the online assessment.');
      }

      // Pick the same active coding challenge
      let problem = await prisma.codingProblem.findFirst({
        where: {
          companies: {
            has: simulation.companyName
          }
        }
      });
      if (!problem) {
        problem = await prisma.codingProblem.findFirst({
          where: { difficulty: 'EASY' }
        });
      }

      if (!problem) {
        const { mockCodingProblems } = require('../../config/database');
        problem = mockCodingProblems[0];
      }

      const testCases = (problem.testCases as any[]) || [];
      const hiddenCases = (problem.hiddenCases as any[]) || [];
      const allTestCases = [...testCases, ...hiddenCases];

      const functionName = getFunctionName(problem.title);
      const executionResult = executeJavaScriptLocal(code, functionName, allTestCases);

      if (executionResult.status === 'accepted') {
        roundScore = 100;
        feedback = `Congratulations! Passed all ${allTestCases.length} test cases successfully.`;
        passStage = true;
      } else {
        roundScore = 40;
        const failedCase = executionResult.testResults.find(t => !t.passed);
        feedback = `Failed coding assessment. Expected ${JSON.stringify(failedCase?.expected)}, got ${JSON.stringify(failedCase?.actual)}.`;
        passStage = false;
      }

    } else if (
      currentStage === SimulatorStage.TECHNICAL_ROUND_1 ||
      currentStage === SimulatorStage.TECHNICAL_ROUND_2 ||
      currentStage === SimulatorStage.MANAGERIAL_ROUND ||
      currentStage === SimulatorStage.HR_ROUND
    ) {
      // Fetch latest completed interview matching the company name
      const latestInterview = await prisma.interview.findFirst({
        where: {
          userId,
          status: 'COMPLETED',
          OR: [
            { companyTrack: simulation.companyName },
            { companyTrack: { contains: simulation.companyName } }
          ]
        },
        orderBy: { completedAt: 'desc' }
      });

      if (!latestInterview) {
        throw new ValidationError(`No completed mock interview found for track "${simulation.companyName}". Please start and complete a mock interview for "${simulation.companyName}" first!`);
      }

      roundScore = latestInterview.overallScore || 70;
      feedback = `Mock interview synced successfully. Synced Score: ${roundScore}%.`;
      passStage = roundScore >= 70;

    } else {
      // Default fallback
      roundScore = 80;
      feedback = 'Stage processed successfully.';
      passStage = true;
    }

    // 2. Update current round
    await prisma.simulationRound.update({
      where: { id: currentRound.id },
      data: {
        score: roundScore,
        feedback,
        isPassed: passStage,
        completedAt: new Date(),
      },
    });

    // 3. Determine next stage
    let nextStage = simulation.currentStage;
    let status = simulation.status;
    let offerProb = simulation.offerProbability;

    if (passStage) {
      offerProb += 15;
      switch (simulation.currentStage) {
        case SimulatorStage.RESUME_SCREENING:
          nextStage = SimulatorStage.ONLINE_ASSESSMENT;
          break;
        case SimulatorStage.ONLINE_ASSESSMENT:
          nextStage = SimulatorStage.TECHNICAL_ROUND_1;
          break;
        case SimulatorStage.TECHNICAL_ROUND_1:
          nextStage = SimulatorStage.TECHNICAL_ROUND_2;
          break;
        case SimulatorStage.TECHNICAL_ROUND_2:
          nextStage = SimulatorStage.MANAGERIAL_ROUND;
          break;
        case SimulatorStage.MANAGERIAL_ROUND:
          nextStage = SimulatorStage.HR_ROUND;
          break;
        case SimulatorStage.HR_ROUND:
          nextStage = SimulatorStage.OFFER_DECISION;
          status = SimulationStatus.COMPLETED;
          offerProb = 100;
          break;
        default:
          break;
      }
    } else {
      status = SimulationStatus.FAILED;
      offerProb = 0;
    }

    const updatedSim = await prisma.companySimulation.update({
      where: { id },
      data: {
        currentStage: nextStage,
        status,
        offerProbability: offerProb,
      },
    });

    // 4. Create next round record if not completed/failed
    if (passStage && status === SimulationStatus.IN_PROGRESS) {
      await prisma.simulationRound.create({
        data: {
          simulationId: simulation.id,
          roundType: nextStage,
          score: 0,
          isPassed: false,
        },
      });
    }

    return successResponse(res, updatedSim, 'Simulation stage evaluated successfully');
  }

  async listSimulations(req: Request, res: Response) {
    const userId = req.user.id;
    const simulations = await prisma.companySimulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, simulations, 'User simulations list retrieved successfully');
  }
}

export const simulationController = new SimulationController();
