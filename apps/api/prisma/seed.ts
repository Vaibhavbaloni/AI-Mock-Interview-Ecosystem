// apps/api/prisma/seed.ts
import { PrismaClient, UserRole, AuthProvider, DifficultyLevel, SkillLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data
  await prisma.userBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.codingSubmission.deleteMany({});
  await prisma.codingProblem.deleteMany({});
  await prisma.userGamification.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  const student = await prisma.user.create({
    data: {
      email: 'student@interviewverse.ai',
      passwordHash,
      role: UserRole.STUDENT,
      isVerified: true,
      profile: {
        create: {
          fullName: 'John Doe',
          headline: 'Aspiring Full Stack Engineer',
          bio: 'Final year computer science student looking for placements.',
          targetRoles: ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer'],
          dreamCompanies: ['Google', 'Stripe', 'Linear'],
          yearsExp: 0,
        },
      },
      skills: {
        create: [
          { name: 'JavaScript', category: 'Programming Language', level: SkillLevel.ADVANCED, source: 'manual' },
          { name: 'TypeScript', category: 'Programming Language', level: SkillLevel.INTERMEDIATE, source: 'manual' },
          { name: 'Node.js', category: 'Backend Framework', level: SkillLevel.INTERMEDIATE, source: 'manual' },
          { name: 'React', category: 'Frontend Framework', level: SkillLevel.ADVANCED, source: 'manual' },
        ],
      },
      gamification: {
        create: {
          xpTotal: 250,
          level: 1,
          streakCurrent: 3,
          streakBest: 5,
        },
      },
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@interviewverse.ai',
      passwordHash,
      role: UserRole.RECRUITER,
      isVerified: true,
      profile: {
        create: {
          fullName: 'Alice Smith',
          headline: 'Technical Recruiter at Vercel',
          bio: 'Helping students find opportunities at Vercel.',
          yearsExp: 5,
        },
      },
    },
  });

  console.log(`✅ Created users: student (${student.email}), recruiter (${recruiter.email})`);

  // 3. Create Gamification Badges
  const badges = [
    {
      name: 'DSA Warrior',
      description: 'Solve 10 data structures and algorithms coding problems.',
      xpReward: 100,
      criteria: { type: 'coding_count', threshold: 10 },
    },
    {
      name: 'Interview Master',
      description: 'Complete 5 adaptive AI mock interviews.',
      xpReward: 250,
      criteria: { type: 'interview_count', threshold: 5 },
    },
    {
      name: 'Backend Ninja',
      description: 'Score 85% or higher on a Node.js-based interview.',
      xpReward: 150,
      criteria: { type: 'interview_score', category: 'Backend', minScore: 85 },
    },
    {
      name: 'Consistent Preparedness',
      description: 'Maintain a 7-day interview preparation streak.',
      xpReward: 200,
      criteria: { type: 'streak_count', threshold: 7 },
    },
  ];

  for (const b of badges) {
    await prisma.badge.create({ data: b });
  }
  console.log(`✅ Seeded ${badges.length} badges`);

  // 4. Create Coding Problems
  const codingProblems = [
    {
      title: 'Two Sum',
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.`,
      difficulty: DifficultyLevel.EASY,
      tags: ['Array', 'Hash Table'],
      companies: ['Google', 'Meta', 'Amazon'],
      constraints: `2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.`,
      starterCode: {
        javascript: `function twoSum(nums, target) {
  // Write your code here
  return [];
}`,
        python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass`,
        cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {};
    }
};`,
      },
      testCases: [
        { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
        { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] },
        { input: { nums: [3, 3], target: 6 }, output: [0, 1] },
      ],
      hiddenCases: [
        { input: { nums: [1, 5, 8, 10, 14], target: 18 }, output: [2, 3] },
      ],
    },
    {
      title: 'Valid Parentheses',
      description: `Given a string \`s\` containing just the characters \`('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.
An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      difficulty: DifficultyLevel.EASY,
      tags: ['String', 'Stack'],
      companies: ['Microsoft', 'Amazon', 'Meta'],
      constraints: `1 <= s.length <= 10^4
s consists of parentheses only '()[]{}'.`,
      starterCode: {
        javascript: `function isValid(s) {
  // Write your code here
  return false;
}`,
        python: `class Solution:
    def isValid(self, s: str) -> bool:
        pass`,
        cpp: `class Solution {
public:
    bool isValid(string s) {
        return false;
    }
};`,
      },
      testCases: [
        { input: { s: '()' }, output: true },
        { input: { s: '()[]{}' }, output: true },
        { input: { s: '(]' }, output: false },
      ],
      hiddenCases: [
        { input: { s: '{[]}' }, output: true },
      ],
    },
    {
      title: 'Design LRU Cache',
      description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.
Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if the key exists, otherwise return -1.
- \`void put(int key, int value)\` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.`,
      difficulty: DifficultyLevel.HARD,
      tags: ['Design', 'Hash Table', 'Linked List', 'Doubly-Linked List'],
      companies: ['Stripe', 'Google', 'Amazon'],
      constraints: `1 <= capacity <= 3000
0 <= key <= 10^4
0 <= value <= 10^5
At most 2 * 10^5 calls will be made to get and put.`,
      starterCode: {
        javascript: `class LRUCache {
  constructor(capacity) {
    // Write your constructor code
  }
  
  get(key) {
    // Write your code here
    return -1;
  }
  
  put(key, value) {
    // Write your code here
  }
}`,
        python: `class LRUCache:
    def __init__(self, capacity: int):
        pass

    def get(self, key: int) -> int:
        return -1

    def put(self, key: int, value: int) -> None:
        pass`,
      },
      testCases: [
        {
          input: {
            operations: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'],
            params: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]],
          },
          output: [null, null, null, 1, null, -1, null, -1, 3, 4],
        },
      ],
    },
  ];

  for (const cp of codingProblems) {
    await prisma.codingProblem.create({
      data: {
        title: cp.title,
        description: cp.description,
        difficulty: cp.difficulty,
        tags: cp.tags,
        companies: cp.companies,
        constraints: cp.constraints,
        starterCode: cp.starterCode as any,
        testCases: cp.testCases as any,
        hiddenCases: cp.hiddenCases as any,
      },
    });
  }

  console.log(`✅ Seeded ${codingProblems.length} coding problems`);
  console.log('🌱 Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
