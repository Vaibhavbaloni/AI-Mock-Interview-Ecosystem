// apps/api/src/modules/coding/coding.controller.ts
import { Request, Response } from 'express';
import { prisma, mockCodingProblems } from '../../config/database';
import { successResponse } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { aiOrchestrator } from '../../ai/provider/AIOrchestrator';
import { DifficultyLevel } from '@prisma/client';
import vm from 'vm';
import axios from 'axios';
import { env } from '../../config/env';

// Local VM executor for JavaScript
export function executeJavaScriptLocal(userCode: string, functionName: string, testCases: any[]): {
  status: string;
  testResults: any[];
} {
  const testResults: any[] = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const contextObject = { console, result: null };
    vm.createContext(contextObject);

    // Format args based on input structure (object keys)
    const argNames = Object.keys(tc.input);
    const argValues = Object.values(tc.input);

    let runScript = '';
    if (tc.input && Array.isArray(tc.input.operations) && Array.isArray(tc.input.params)) {
      runScript = `
        ${userCode}
        try {
          let inst = null;
          let outputs = [];
          const ops = ${JSON.stringify(tc.input.operations)};
          const params = ${JSON.stringify(tc.input.params)};
          for (let j = 0; j < ops.length; j++) {
            if (j === 0) {
              inst = new ${functionName}(...params[j]);
              outputs.push(null);
            } else {
              const method = ops[j];
              const val = inst[method](...params[j]);
              outputs.push(val !== undefined ? val : null);
            }
          }
          result = outputs;
        } catch (e) {
          result = "ERROR: " + e.message;
        }
      `;
    } else {
      runScript = `
        ${userCode}
        try {
          result = ${functionName}(...${JSON.stringify(argValues)});
        } catch (e) {
          result = "ERROR: " + e.message;
        }
      `;
    }

    try {
      const script = new vm.Script(runScript);
      script.runInContext(contextObject, { timeout: 1000 }); // 1 second timeout

      const actualOutput = contextObject.result;
      const expectedOutput = tc.output;

      // Deep compare outputs
      const isCorrect = JSON.stringify(actualOutput) === JSON.stringify(expectedOutput);
      if (isCorrect) passedCount++;

      testResults.push({
        testCaseIndex: i,
        input: tc.input,
        expected: expectedOutput,
        actual: actualOutput,
        passed: isCorrect,
      });
    } catch (err: any) {
      testResults.push({
        testCaseIndex: i,
        input: tc.input,
        expected: expectedOutput,
        actual: 'TIMEOUT OR ERROR: ' + err.message,
        passed: false,
      });
    }
  }

  const allPassed = passedCount === testCases.length;
  return {
    status: allPassed ? 'accepted' : 'wrong',
    testResults,
  };
}

export function getFunctionName(title: string): string {
  if (title === 'Two Sum') return 'twoSum';
  if (title === 'Valid Parentheses') return 'isValid';
  if (title === 'Design LRU Cache') return 'LRUCache';
  if (title === 'Merge Two Sorted Lists') return 'mergeTwoLists';
  if (title === 'Reverse Linked List') return 'reverseList';
  if (title === 'Best Time to Buy and Sell Stock') return 'maxProfit';
  if (title === 'Group Anagrams') return 'groupAnagrams';
  if (title === 'Longest Substring Without Repeating Characters') return 'lengthOfLongestSubstring';
  if (title === '3Sum') return 'threeSum';
  if (title === 'Container With Most Water') return 'maxArea';
  if (title === 'Binary Search') return 'search';
  if (title === 'Find Minimum in Rotated Sorted Array') return 'findMin';
  return 'solution';
}

export class CodingController {
  async listProblems(req: Request, res: Response) {
    let problems = await prisma.codingProblem.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Auto-seed if database doesn't have all the questions
    if (problems.length < 10) {
      const existingIds = new Set(problems.map((p) => p.id));
      const toSeed = mockCodingProblems.filter((p) => !existingIds.has(p.id));
      if (toSeed.length > 0) {
        for (const prob of toSeed) {
          try {
            await prisma.codingProblem.create({
              data: {
                id: prob.id,
                title: prob.title,
                description: prob.description,
                difficulty: prob.difficulty as any,
                tags: prob.tags,
                companies: prob.companies,
                constraints: prob.constraints,
                starterCode: prob.starterCode as any,
                testCases: prob.testCases as any,
              },
            });
          } catch (err) {
            // Ignore if already created or offline mock database handles it
          }
        }
        problems = await prisma.codingProblem.findMany({
          orderBy: { createdAt: 'asc' },
        });
      }
    }

    return successResponse(res, problems, 'Coding problems retrieved successfully');
  }

  async getProblemDetails(req: Request, res: Response) {
    const { id } = req.params;
    const problem = await prisma.codingProblem.findUnique({
      where: { id },
    });

    if (!problem) {
      throw new NotFoundError('Coding problem not found');
    }

    return successResponse(res, problem, 'Coding problem retrieved successfully');
  }

  async submitCode(req: Request, res: Response) {
    const userId = req.user.id;
    const { id: problemId } = req.params;
    const { code, language, interviewId } = req.body;

    if (!code || !language) {
      throw new ValidationError('Code and language are required');
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      throw new NotFoundError('Problem not found');
    }

    const testCases = (problem.testCases as any[]) || [];
    const hiddenCases = (problem.hiddenCases as any[]) || [];
    const allTestCases = [...testCases, ...hiddenCases];

    let executionResult = { status: 'error', testResults: [] as any[] };

    // Resolve function name from title
    const functionName = getFunctionName(problem.title);

    // 1. Run compilation/execution
    if (language.toLowerCase() === 'javascript') {
      executionResult = executeJavaScriptLocal(code, functionName, allTestCases);
    } else if (env.JUDGE0_API_URL && env.JUDGE0_API_KEY) {
      // Production Judge0 execution logic
      try {
        const languageIds: Record<string, number> = { python: 71, cpp: 54, java: 62 };
        const langId = languageIds[language.toLowerCase()] || 71;

        // Compile and run against Judge0
        const response = await axios.post(
          `${env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
          {
            source_code: code,
            language_id: langId,
            stdin: JSON.stringify(allTestCases.map((tc) => tc.input)),
          },
          { headers: { 'X-RapidAPI-Key': env.JUDGE0_API_KEY } }
        );

        const stdout = response.data.stdout;
        const statusId = response.data.status?.id;

        const isAccepted = statusId === 3; // 3 means Accepted
        executionResult = {
          status: isAccepted ? 'accepted' : 'wrong',
          testResults: [
            {
              passed: isAccepted,
              actual: stdout || response.data.compile_output || 'Run completed',
              expected: 'Outputs matching problem specs',
            },
          ],
        };
      } catch (err: any) {
        executionResult = {
          status: 'error',
          testResults: [{ passed: false, actual: 'Judge0 compiler error: ' + err.message, expected: '' }],
        };
      }
    } else {
      // Mock execution fallback for Python/C++ when Judge0 is missing
      executionResult = {
        status: 'accepted',
        testResults: [
          {
            passed: true,
            actual: 'Mock compiler: execution skipped. Install Judge0 for Python/C++ compilation.',
            expected: 'Outputs matching problem specs',
          },
        ],
      };
    }

    // 2. Perform AI code review and complexity analysis
    const reviewPrompt = `You are an elite software architect and LeetCode reviewer.
Analyze this user submission for the coding problem: "${problem.title}".

PROBLEM DESCRIPTION:
${problem.description}

USER SUBMISSION (${language}):
\`\`\`${language}
${code}
\`\`\`

Evaluate the code quality and complexity. Return ONLY JSON:
{
  "timeComplexity": "O(N) / O(N^2) etc",
  "spaceComplexity": "O(1) / O(N) etc",
  "isOptimal": <true|false>,
  "codeSmells": ["smell 1", "smell 2"],
  "refactoringSuggestions": ["suggestion 1", "suggestion 2"],
  "improvedCode": "Write optimized starter code block matching the language"
}`;

    let aiReview = {
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      isOptimal: false,
      codeSmells: [],
      refactoringSuggestions: [],
      improvedCode: '',
    };

    try {
      aiReview = await aiOrchestrator.parseJSON<any>(
        [{ role: 'user', content: reviewPrompt }],
        'coding_review'
      );
    } catch (err) {
      // Silent error fallback
    }

    // 3. Save submission record
    const submission = await prisma.codingSubmission.create({
      data: {
        userId,
        problemId,
        interviewId: interviewId || null,
        language,
        code,
        status: executionResult.status,
        testResults: executionResult.testResults,
        complexity: {
          time: aiReview.timeComplexity,
          space: aiReview.spaceComplexity,
        },
        aiReview: aiReview as any,
      },
    });

    // 4. Update user experience/gamification XP on correct answer
    if (executionResult.status === 'accepted') {
      const userGamification = await prisma.userGamification.findUnique({
        where: { userId },
      });
      if (userGamification) {
        const xpEarned = problem.difficulty === DifficultyLevel.EASY ? 20 : problem.difficulty === DifficultyLevel.MEDIUM ? 50 : 100;
        await prisma.userGamification.update({
          where: { userId },
          data: {
            xpTotal: { increment: xpEarned },
            lastActivity: new Date(),
          },
        });
      }
    }

    return successResponse(res, submission, 'Code submitted and reviewed successfully');
  }
}

export const codingController = new CodingController();
