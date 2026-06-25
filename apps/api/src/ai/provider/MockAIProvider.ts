// apps/api/src/ai/provider/MockAIProvider.ts
import { AIProvider, Message, ChatConfig, ChatResponse } from './AIProvider.interface';
import { logger } from '../../utils/logger';

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  isAvailable(): boolean {
    return true;
  }

  async chat(messages: Message[], config: ChatConfig = {}): Promise<ChatResponse> {
    logger.info('🤖 MockAIProvider received request');

    // Default mock response text
    let content = 'This is a mock AI response.';

    // Check if there is a system prompt or specific task indicators
    const fullText = messages.map(m => m.content).join('\n');

    if (fullText.includes('resume_extraction') || fullText.includes('ResumeAnalysis') || fullText.includes('extractedData') || fullText.includes('skills')) {
      // Mock Resume Extraction
      content = JSON.stringify({
        scores: {
          atsScore: 85,
          qualityScore: 82,
          technicalDepth: 88,
          projectImpact: 78,
          overallScore: 83
        },
        skills: {
          technical: ["React", "Node.js", "TypeScript", "Express", "PostgreSQL", "MongoDB", "Git", "Docker", "AWS", "Python"],
          soft: ["Communication", "Problem Solving", "Teamwork", "Agile"]
        },
        experience: [
          {
            role: "Software Engineer",
            company: "Acme Corporation",
            duration: "2 years",
            description: "Developed and maintained full-stack web applications. Optimized database queries, reducing response times by 30%. Led frontend migration from Angular to React."
          }
        ],
        education: [
          {
            degree: "Bachelor of Science in Computer Science",
            school: "Tech University",
            year: "2023"
          }
        ],
        projects: [
          {
            name: "Mock Interview Ecosystem",
            description: "Built a collaborative AI interview practice environment with real-time feedback."
          }
        ],
        certifications: ["AWS Certified Developer - Associate"],
        achievements: ["Dean's List 2020-2023", "Hackathon Winner - Best UX Design"],
        missingSections: ["Professional Summary", "LinkedIn Profile URL"],
        improvedBullets: [
          {
            original: "Built features using React and Node.",
            improved: "Developed full-stack features using React and Node.js, increasing daily active user count by 15%."
          },
          {
            original: "Deployed projects manually.",
            improved: "Automated deployment workflows using GitHub Actions, cutting manual releases by 50%."
          }
        ],
        atsRecommendations: [
          "Include a clear summary section at the top of the resume with target job keywords.",
          "Quantify achievements more explicitly in the work experience bullet points."
        ],
        overallFeedback: "Strong overall profile with solid experience in modern technologies. Add more metrics and business impact to make it stand out even more."
      }, null, 2);
    } else if (fullText.includes('jd_matching') || fullText.includes('Job Description') || fullText.includes('matchPercent')) {
      // Mock JD Matching
      content = JSON.stringify({
        matchPercent: 78,
        overlapSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Git"],
        missingSkills: ["GraphQL", "Docker", "AWS ECS", "TailwindCSS"],
        roleAlignment: "Strong candidate matching 78% of the core requirements. Very aligned with backend/fullstack Node components.",
        strengths: [
          "Strong experience in relational databases (PostgreSQL)",
          "Proficient in building backend APIs with Express/Node.js"
        ],
        gaps: [
          "Lacks professional experience with container deployment (Docker/AWS ECS)",
          "No specific experience with GraphQL schema design"
        ],
        recommendations: [
          "Study Docker basics and containerize a Node.js project.",
          "Learn TailwindCSS syntax for simpler custom styling integrations."
        ]
      }, null, 2);
    } else if (fullText.includes('roadmap_generation') || fullText.includes('timelineWeeks') || fullText.includes('SkillRoadmap')) {
      // Mock Roadmap Generation
      content = JSON.stringify({
        weeks: [
          {
            weekNumber: 1,
            topic: "TypeScript Deep Dive & Advanced React Patterns",
            milestone: "Understand generics, utility types, and advanced state management.",
            tasks: [
              "Complete TypeScript Generics workshop",
              "Refactor an existing component to use advanced render props or hooks",
              "Build a minor TypeScript utility library"
            ],
            resources: [
              "TypeScript Handbook",
              "React Design Patterns on Frontend Masters"
            ]
          },
          {
            weekNumber: 2,
            topic: "Database Design & Prisma Integration",
            milestone: "Create database migrations, indexing, and complex queries.",
            tasks: [
              "Review SQL indexes and execution plans",
              "Set up a local PostgreSQL container and run Prisma migrations",
              "Implement custom repository patterns with Prisma client"
            ],
            resources: [
              "Prisma Docs: Relations & Migrations",
              "Use The Index, Luke! - PostgreSQL Tuning"
            ]
          },
          {
            weekNumber: 3,
            topic: "System Design, Microservices & Docker",
            milestone: "Containerize a multi-service app and design high-scale systems.",
            tasks: [
              "Write a Dockerfile and docker-compose.yml for web + api + db",
              "Study vertical/horizontal scaling, load balancers, and CDN caching",
              "Draw a system design diagram for a real-time messaging server"
            ],
            resources: [
              "Docker Deep Dive course",
              "ByteByteGo System Design Primer"
            ]
          },
          {
            weekNumber: 4,
            topic: "CI/CD & Cloud Deployment",
            milestone: "Automate build, test, and release pipelines to AWS/Vercel.",
            tasks: [
              "Create a GitHub Action pipeline that runs linter and tests",
              "Deploy backend API to AWS ECS/App Runner and Next.js to Vercel",
              "Integrate Sentry error tracking and health-check alerts"
            ],
            resources: [
              "GitHub Actions Quickstart Guide",
              "Deploying Express to AWS App Runner Tutorial"
            ]
          }
        ]
      }, null, 2);
    } else if (fullText.includes('coding_review') || fullText.includes('LeetCode reviewer') || fullText.includes('improvedCode')) {
      // Mock Coding Review
      content = JSON.stringify({
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
        isOptimal: true,
        codeSmells: [
          "Variable names are a bit cryptic (e.g. 'n', 't'). Better to use 'numbersCount' and 'targetTotal'.",
          "Lack of explicit boundary checks for empty array input."
        ],
        refactoringSuggestions: [
          "Check if input array length is less than 2 immediately at the beginning.",
          "Rename internal map variable to 'numberIndexMap' for better readability."
        ],
        improvedCode: `function solution(nums, target) {
  if (!nums || nums.length < 2) return [];
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`
      }, null, 2);
    } else if (fullText.includes('buildInterviewSystemPrompt') || fullText.includes('interview_qa') || fullText.includes('evaluationRubric')) {
      // Mock Interview Question Generation
      content = JSON.stringify({
        question: "Can you explain the difference between processes and threads, and how they relate to the Event Loop in Node.js?",
        questionType: "technical",
        isFollowup: false,
        difficultyAdjustment: "maintain",
        internalNote: "Evaluating basic operating system understanding and Node.js concurrency model.",
        evaluationRubric: [
          "Defines process as separate memory space and thread as shared execution context within process",
          "Explains that Node.js runs JS execution in a single thread",
          "Mentions worker threads or cluster module for CPU-intensive tasks",
          "Correctly explains Event Loop handles asynchronous I/O offloading to libuv threads"
        ]
      }, null, 2);
    } else if (fullText.includes('buildEvaluationPrompt') || fullText.includes('behavioral_eval') || fullText.includes('coachingTip')) {
      // Mock Candidate Answer Evaluation
      content = JSON.stringify({
        score: 82,
        technicalAccuracy: 85,
        communicationClarity: 80,
        completeness: 80,
        keywordsMatched: ["process", "thread", "single thread", "event loop", "libuv"],
        fillerWords: ["um", "like", "basically"],
        strengths: [
          "Accurately described the difference between processes and threads.",
          "Demonstrated solid knowledge of libuv and async I/O in Node.js."
        ],
        weaknesses: [
          "Briefly hesitated before explaining how the Event Loop relates to single-threaded execution.",
          "Used some filler words during pauses."
        ],
        idealAnswer: "A process is an executing instance of a program with its own isolated memory, while a thread is a subset of a process sharing memory. Node.js executes user JavaScript code in a single thread, but leverages a thread pool via libuv to handle heavy operations like I/O. The Event Loop coordinates execution of these async callbacks back onto the main thread.",
        coachingTip: "Excellent definition of process vs. thread. To make this answer outstanding, speak slightly slower when transitioning to Node-specific execution to avoid filler words.",
        starComponents: {
          situation: true,
          task: true,
          action: true,
          result: true
        }
      }, null, 2);
    } else if (fullText.includes('buildFinalReportPrompt') || fullText.includes('report_generation') || fullText.includes('hireRecommendation')) {
      // Mock Final Report Generation
      content = JSON.stringify({
        summary: "The candidate demonstrated strong foundational knowledge of full-stack engineering, databases, and async runtime internals. Commendable communication, with minor room for optimization in structured pacing under pressure.",
        technicalSummary: "Strong technical accuracy across Node.js architecture, TypeScript types, and database index tuning. Solved the JavaScript vm test case correctly.",
        behavioralSummary: "Structured thoughts well, showing good self-reflection and coaching receptivity. Managed pressure mode successfully.",
        overallScore: 84,
        technicalScore: 86,
        communicationScore: 82,
        behavioralScore: 84,
        strengths: [
          "Deep technical understanding of concurrency and async code flow",
          "Solid knowledge of indexing and schema modeling in databases",
          "Responsive to feedback and capable of rapid self-correction"
        ],
        weaknesses: [
          "Minor overuse of filler words during high-pressure questions",
          "Could make architectural explanations more concise by leading with high-level summaries"
        ],
        improvementPlan: [
          "Practice timed interview responses to reduce filler words.",
          "Read on complex database query planning (explain analysis) to support deep scaling reviews."
        ],
        hireRecommendation: "Hire",
        hireProbability: 88,
        nextSteps: [
          "Proceed to final round technical review with the engineering director.",
          "Prepare system design mock interview focused on high availability."
        ]
      }, null, 2);
    } else if (fullText.includes('reflectionPrompt') || fullText.includes('reflection feedback') || fullText.includes('wentWell')) {
      // Mock Journal Reflection Feedback
      content = "Excellent self-reflection! Acknowledging the pressure and filler words is the first step to conquering them. Your technical skills are clearly highly solid—focus on pacing your speech and mapping out your answers in high-level blocks before jumping into details. Keep practicing!";
    } else {
      // General fallback
      content = "Based on your prompt, here is the AI feedback. The system is currently running in fallback resilient mode. Please set up appropriate API keys in .env to experience live AI responses.";
    }

    return {
      content,
      model: 'mock-ai-model',
      usage: {
        promptTokens: 100,
        completionTokens: 100,
        totalTokens: 200,
      },
      estimatedCostUsd: 0.0,
    };
  }
}
