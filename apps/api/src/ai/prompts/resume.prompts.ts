// src/ai/prompts/resume.prompts.ts

export function buildResumeExtractionPrompt(resumeText: string): string {
  return `You are an expert ATS system and career coach. Analyze this resume comprehensively.

RESUME TEXT:
${resumeText}

Extract all information and return ONLY valid JSON (no markdown, no explanation):
{
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["communication", "leadership"],
    "tools": ["Docker", "Git"],
    "languages": ["Python", "Java"]
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Jan 2022 - Dec 2023",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "B.Tech",
      "field": "Computer Science",
      "cgpa": "8.5",
      "year": "2024"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tech": ["React", "Node.js"],
      "impact": "Reduced load time by 40%",
      "description": "Brief description"
    }
  ],
  "certifications": ["AWS Certified", "Google Cloud"],
  "achievements": ["Hackathon winner", "Dean's list"],
  "scores": {
    "atsScore": <0-100>,
    "qualityScore": <0-100>,
    "technicalDepth": <0-100>,
    "projectImpact": <0-100>,
    "overallScore": <0-100>
  },
  "missingSections": ["Docker", "Testing", "CI/CD", "Redis"],
  "improvedBullets": [
    {
      "original": "Built a web app",
      "improved": "Engineered a scalable React web application serving 10K+ users, reducing page load time by 45% via lazy loading and code splitting"
    }
  ],
  "atsRecommendations": [
    "Add quantified metrics to all experience bullets",
    "Include relevant keywords: microservices, REST API, agile"
  ],
  "overallFeedback": "2-3 sentence overall assessment"
}

ATS Scoring Rubric:
- 90-100: Excellent keyword density, strong action verbs, quantified achievements, clean format
- 70-89: Good but missing some keywords or metrics
- 50-69: Needs significant improvement — vague descriptions, no metrics
- 30-49: Major gaps — missing sections, poor formatting
- 0-29: Critical issues — needs complete rewrite`;
}

export function buildJDMatchingPrompt(resumeData: string, jobDescription: string): string {
  return `You are an expert recruiter and ATS system. Match a resume against a job description.

RESUME SKILLS & EXPERIENCE:
${resumeData}

JOB DESCRIPTION:
${jobDescription}

Analyze the match and return JSON:
{
  "matchPercent": <0-100>,
  "overlapSkills": ["skill1", "skill2"],
  "missingSkills": ["missing1", "missing2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "roleAlignment": "Strong|Moderate|Weak",
  "tailoringSuggestions": [
    "Add 'microservices' to your skills section",
    "Rewrite your intern bullet to highlight REST API work"
  ],
  "priorityLearning": [
    { "skill": "Kubernetes", "priority": "High", "reason": "Mentioned 4 times in JD" },
    { "skill": "GraphQL", "priority": "Medium", "reason": "Nice-to-have" }
  ],
  "strengthsForRole": ["Your Python experience directly matches", "3 years of React aligns well"],
  "overallAssessment": "2-3 sentence summary"
}`;
}

export function buildRoadmapPrompt(params: {
  currentSkills: string[];
  targetRole: string;
  targetCompany?: string;
  missingSkills: string[];
  timelineWeeks: number;
}): string {
  return `You are a senior technical career coach. Generate a personalized learning roadmap.

CANDIDATE PROFILE:
- Current Skills: ${params.currentSkills.join(', ')}
- Target Role: ${params.targetRole}
${params.targetCompany ? `- Target Company: ${params.targetCompany}` : ''}
- Skill Gaps: ${params.missingSkills.join(', ')}
- Available Weeks: ${params.timelineWeeks}

Generate a week-by-week roadmap as JSON:
{
  "overview": "Brief roadmap summary",
  "weeks": [
    {
      "week": 1,
      "theme": "PostgreSQL Fundamentals",
      "skills": ["SQL", "Indexing", "Transactions"],
      "dailyPlan": [
        "Day 1-2: Learn SELECT, JOIN, subqueries",
        "Day 3-4: Indexing and query optimization",
        "Day 5-7: Transactions, ACID, practice problems"
      ],
      "resources": [
        { "name": "PostgreSQL Tutorial", "url": "https://www.postgresqltutorial.com", "type": "free" },
        { "name": "Use The Index, Luke", "url": "https://use-the-index-luke.com", "type": "free" }
      ],
      "milestone": "Build a normalized database schema with proper indexes",
      "estimatedHours": 15
    }
  ],
  "milestones": ["Week 4: Backend project ready", "Week 8: Deploy to cloud"],
  "interviewReadinessDate": "Estimated date based on ${params.timelineWeeks} weeks"
}`;
}
