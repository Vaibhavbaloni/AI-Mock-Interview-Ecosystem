// src/config/database.ts
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

// ─── Local In-Memory DB Store for Prisma fallback ───────
const mockDbStore: Record<string, any[]> = {};

function getMockTable(model: string): any[] {
  const name = model.toLowerCase();
  if (!mockDbStore[name]) {
    mockDbStore[name] = [];
  }
  return mockDbStore[name];
}

// Pre-seed mock data for offline functionality
const passwordHash = bcrypt.hashSync('Password123!', 10);
mockDbStore['user'] = [
  {
    id: 'mock-student-id',
    email: 'student@interviewverse.ai',
    passwordHash: passwordHash,
    role: 'STUDENT',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-recruiter-id',
    email: 'recruiter@interviewverse.ai',
    passwordHash: passwordHash,
    role: 'RECRUITER',
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

mockDbStore['profile'] = [
  {
    id: 'mock-student-profile-id',
    userId: 'mock-student-id',
    fullName: 'John Doe',
    headline: 'Aspiring Full Stack Engineer',
    bio: 'Final year computer science student looking for placements.',
    targetRoles: ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer'],
    dreamCompanies: ['Google', 'Stripe', 'Linear'],
    yearsExp: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-recruiter-profile-id',
    userId: 'mock-recruiter-id',
    fullName: 'Alice Smith',
    headline: 'Technical Recruiter at Vercel',
    bio: 'Helping students find opportunities at Vercel.',
    yearsExp: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

mockDbStore['skill'] = [
  { id: 'skill-1', userId: 'mock-student-id', name: 'JavaScript', category: 'Programming Language', level: 'ADVANCED', source: 'manual' },
  { id: 'skill-2', userId: 'mock-student-id', name: 'TypeScript', category: 'Programming Language', level: 'INTERMEDIATE', source: 'manual' },
  { id: 'skill-3', userId: 'mock-student-id', name: 'Node.js', category: 'Backend Framework', level: 'INTERMEDIATE', source: 'manual' },
  { id: 'skill-4', userId: 'mock-student-id', name: 'React', category: 'Frontend Framework', level: 'ADVANCED', source: 'manual' }
];

mockDbStore['usergamification'] = [
  {
    id: 'mock-student-gamification-id',
    userId: 'mock-student-id',
    xpTotal: 250,
    level: 1,
    streakCurrent: 3,
    streakBest: 5,
    updatedAt: new Date()
  }
];

mockDbStore['interviewdna'] = [
  {
    id: 'mock-student-dna-id',
    userId: 'mock-student-id',
    communication: 70,
    leadership: 60,
    problemSolving: 80,
    technical: 75,
    adaptability: 65,
    confidence: 70,
    updatedAt: new Date()
  }
];

mockDbStore['badge'] = [
  { id: 'badge-1', name: 'DSA Warrior', description: 'Solve 10 data structures problems.', xpReward: 100, criteria: {} },
  { id: 'badge-2', name: 'Interview Master', description: 'Complete 5 adaptive AI mock interviews.', xpReward: 250, criteria: {} },
  { id: 'badge-3', name: 'Backend Ninja', description: 'Score 85% or higher on a Node.js-based interview.', xpReward: 150, criteria: {} },
  { id: 'badge-4', name: 'Consistent Preparedness', description: 'Maintain a 7-day interview preparation streak.', xpReward: 200, criteria: {} }
];

export const mockCodingProblems = [
  {
    id: 'prob-1',
    title: 'Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    difficulty: 'EASY',
    tags: ['Array', 'Hash Table'],
    companies: ['Google', 'Meta', 'Amazon'],
    constraints: '2 <= nums.length <= 10^4\nOnly one valid answer exists.',
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // Write your code here\n  return [];\n}',
      python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass'
    },
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] }
    ]
  },
  {
    id: 'prob-2',
    title: 'Valid Parentheses',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
    difficulty: 'EASY',
    tags: ['String', 'Stack'],
    companies: ['Microsoft', 'Amazon'],
    constraints: '1 <= s.length <= 10^4',
    starterCode: {
      javascript: 'function isValid(s) {\n  // Write your code here\n  return false;\n}',
      python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass'
    },
    testCases: [
      { input: { s: '()' }, output: true },
      { input: { s: '()[]{}' }, output: true }
    ]
  },
  {
    id: 'prob-3',
    title: 'Design LRU Cache',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
    difficulty: 'HARD',
    tags: ['Design', 'Hash Table'],
    companies: ['Stripe', 'Google'],
    constraints: '1 <= capacity <= 3000',
    starterCode: {
      javascript: 'class LRUCache {\n  constructor(capacity) {}\n  get(key) { return -1; }\n  put(key, value) {}\n}'
    },
    testCases: [
      {
        input: {
          operations: ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'],
          params: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]],
        },
        output: [null, null, null, 1, null, -1, null, -1, 3, 4],
      }
    ]
  },
  {
    id: 'prob-4',
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.',
    difficulty: 'EASY',
    tags: ['Linked List', 'Recursion'],
    companies: ['Amazon', 'Apple', 'Microsoft'],
    constraints: 'The number of nodes in both lists is in the range [0, 50].\n-100 <= Node.val <= 100',
    starterCode: {
      javascript: 'function mergeTwoLists(list1, list2) {\n  // Write your code here\n  return null;\n}'
    },
    testCases: [
      { input: { list1: [1, 2, 4], list2: [1, 3, 4] }, output: [1, 1, 2, 3, 4, 4] }
    ]
  },
  {
    id: 'prob-5',
    title: 'Reverse Linked List',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    difficulty: 'EASY',
    tags: ['Linked List', 'Recursion'],
    companies: ['Apple', 'Google', 'Adobe'],
    constraints: 'The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000',
    starterCode: {
      javascript: 'function reverseList(head) {\n  // Write your code here\n  return null;\n}'
    },
    testCases: [
      { input: { head: [1, 2, 3, 4, 5] }, output: [5, 4, 3, 2, 1] }
    ]
  },
  {
    id: 'prob-6',
    title: 'Best Time to Buy and Sell Stock',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
    difficulty: 'EASY',
    tags: ['Array', 'Dynamic Programming'],
    companies: ['Amazon', 'Microsoft', 'Goldman Sachs'],
    constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
    starterCode: {
      javascript: 'function maxProfit(prices) {\n  // Write your code here\n  return 0;\n}'
    },
    testCases: [
      { input: { prices: [7, 1, 5, 3, 6, 4] }, output: 5 },
      { input: { prices: [7, 6, 4, 3, 1] }, output: 0 }
    ]
  },
  {
    id: 'prob-7',
    title: 'Group Anagrams',
    description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    difficulty: 'MEDIUM',
    tags: ['Hash Table', 'String', 'Sorting'],
    companies: ['Amazon', 'Blackrock', 'Affirm'],
    constraints: '1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100',
    starterCode: {
      javascript: 'function groupAnagrams(strs) {\n  // Write your code here\n  return [];\n}'
    },
    testCases: [
      { input: { strs: ["eat","tea","tan","ate","nat","bat"] }, output: [["eat","tea","ate"],["tan","nat"],["bat"]] }
    ]
  },
  {
    id: 'prob-8',
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'MEDIUM',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    companies: ['Amazon', 'Bloomberg', 'Uber'],
    constraints: '0 <= s.length <= 5 * 10^4',
    starterCode: {
      javascript: 'function lengthOfLongestSubstring(s) {\n  // Write your code here\n  return 0;\n}'
    },
    testCases: [
      { input: { s: "abcabcbb" }, output: 3 },
      { input: { s: "bbbbb" }, output: 1 }
    ]
  },
  {
    id: 'prob-9',
    title: '3Sum',
    description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.',
    difficulty: 'MEDIUM',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    companies: ['Facebook', 'Microsoft', 'Salesforce'],
    constraints: '3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5',
    starterCode: {
      javascript: 'function threeSum(nums) {\n  // Write your code here\n  return [];\n}'
    },
    testCases: [
      { input: { nums: [-1, 0, 1, 2, -1, -4] }, output: [[-1, -1, 2], [-1, 0, 1]] }
    ]
  },
  {
    id: 'prob-10',
    title: 'Container With Most Water',
    description: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.',
    difficulty: 'MEDIUM',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    companies: ['Google', 'Netflix', 'Walmart'],
    constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4',
    starterCode: {
      javascript: 'function maxArea(height) {\n  // Write your code here\n  return 0;\n}'
    },
    testCases: [
      { input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, output: 49 }
    ]
  },
  {
    id: 'prob-11',
    title: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
    difficulty: 'EASY',
    tags: ['Array', 'Binary Search'],
    companies: ['Microsoft', 'Apple', 'Oracle'],
    constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.',
    starterCode: {
      javascript: 'function search(nums, target) {\n  // Write your code here\n  return -1;\n}'
    },
    testCases: [
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, output: 4 },
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 }, output: -1 }
    ]
  },
  {
    id: 'prob-12',
    title: 'Find Minimum in Rotated Sorted Array',
    description: 'Given the sorted rotated array nums of unique elements, return the minimum element of this array.',
    difficulty: 'MEDIUM',
    tags: ['Array', 'Binary Search'],
    companies: ['Facebook', 'Amazon', 'Goldman Sachs'],
    constraints: '1 <= n <= 5000\n-5000 <= nums[i] <= 5000',
    starterCode: {
      javascript: 'function findMin(nums) {\n  // Write your code here\n  return 0;\n}'
    },
    testCases: [
      { input: { nums: [3, 4, 5, 1, 2] }, output: 1 },
      { input: { nums: [4, 5, 6, 7, 0, 1, 2] }, output: 0 }
    ]
  }
];

mockDbStore['codingproblem'] = mockCodingProblems;

function matchFilter(item: any, where: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    const filterVal = where[key];
    if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if ('gte' in filterVal && item[key] < filterVal.gte) return false;
      if ('lte' in filterVal && item[key] > filterVal.lte) return false;
      if ('gt' in filterVal && item[key] <= filterVal.gt) return false;
      if ('lt' in filterVal && item[key] >= filterVal.lt) return false;
      if ('not' in filterVal && item[key] === filterVal.not) return false;
      if ('in' in filterVal && Array.isArray(filterVal.in) && !filterVal.in.includes(item[key])) return false;
    } else {
      if (item[key] !== filterVal) return false;
    }
  }
  return true;
}

function createMockHandler(modelName: string) {
  const table = getMockTable(modelName);

  return {
    findUnique: async (args: any) => {
      const item = table.find((x) => matchFilter(x, args?.where));
      return item ? { ...item } : null;
    },
    findFirst: async (args: any) => {
      const item = table.find((x) => matchFilter(x, args?.where));
      return item ? { ...item } : null;
    },
    findMany: async (args: any) => {
      let results = table.filter((x) => matchFilter(x, args?.where));
      if (args?.orderBy) {
        const orderKey = Object.keys(args.orderBy)[0];
        const orderDir = args.orderBy[orderKey];
        results.sort((a, b) => {
          if (a[orderKey] < b[orderKey]) return orderDir === 'asc' ? -1 : 1;
          if (a[orderKey] > b[orderKey]) return orderDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
      if (args?.take) {
        results = results.slice(0, args.take);
      }
      return results.map((x) => ({ ...x }));
    },
    create: async (args: any) => {
      const newId = Math.random().toString(36).substring(2, 9);
      const newRecord = {
        id: newId,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      for (const key of Object.keys(args.data)) {
        if (args.data[key] && typeof args.data[key] === 'object' && args.data[key].create) {
          const nestedData = args.data[key].create;
          const nestedModel = key;
          const nestedTable = getMockTable(nestedModel);
          const nestedRecord = {
            id: Math.random().toString(36).substring(2, 9),
            userId: newId,
            ...nestedData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          nestedTable.push(nestedRecord);
          newRecord[key] = nestedRecord;
        }
      }
      table.push(newRecord);
      return { ...newRecord };
    },
    createMany: async (args: any) => {
      const created = [];
      for (const item of args.data) {
        const newRecord = {
          id: Math.random().toString(36).substring(2, 9),
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        table.push(newRecord);
        created.push(newRecord);
      }
      return { count: created.length };
    },
    update: async (args: any) => {
      const idx = table.findIndex((x) => matchFilter(x, args?.where));
      if (idx === -1) {
        // Fallback create if not exists
        const newId = Math.random().toString(36).substring(2, 9);
        const newRecord = {
          id: newId,
          ...args.where,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        table.push(newRecord);
        return { ...newRecord };
      }
      table[idx] = {
        ...table[idx],
        ...args.data,
        updatedAt: new Date(),
      };
      return { ...table[idx] };
    },
    updateMany: async (args: any) => {
      let count = 0;
      for (let i = 0; i < table.length; i++) {
        if (matchFilter(table[i], args?.where)) {
          table[i] = {
            ...table[i],
            ...args.data,
            updatedAt: new Date(),
          };
          count++;
        }
      }
      return { count };
    },
    upsert: async (args: any) => {
      const idx = table.findIndex((x) => matchFilter(x, args?.where));
      if (idx !== -1) {
        table[idx] = {
          ...table[idx],
          ...args.update,
          updatedAt: new Date(),
        };
        return { ...table[idx] };
      } else {
        const newRecord = {
          id: Math.random().toString(36).substring(2, 9),
          ...args.create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        table.push(newRecord);
        return { ...newRecord };
      }
    },
    delete: async (args: any) => {
      const idx = table.findIndex((x) => matchFilter(x, args?.where));
      if (idx === -1) throw new Error(`Record not found in mock ${modelName}`);
      const deleted = table.splice(idx, 1)[0];
      return { ...deleted };
    },
    deleteMany: async (args: any) => {
      let count = 0;
      for (let i = table.length - 1; i >= 0; i--) {
        if (matchFilter(table[i], args?.where)) {
          table.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    count: async (args: any) => {
      const results = table.filter((x) => matchFilter(x, args?.where));
      return results.length;
    },
    groupBy: async (args: any) => {
      return [];
    }
  };
}

export let isPostgresConnected = false;

const actualPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const prismaProxy = new Proxy(actualPrisma, {
  get(target, prop, receiver) {
    if (prop === '$connect') {
      return async () => {
        try {
          await target.$connect();
          isPostgresConnected = true;
          logger.info('✅ PostgreSQL connected via Prisma');
        } catch (err) {
          logger.error('⚠️ PostgreSQL connection failed on startup. Using Mock In-Memory DB Fallback for Prisma.');
          isPostgresConnected = false;
        }
      };
    }

    if (prop === '$disconnect') {
      return async () => {
        if (isPostgresConnected) {
          await target.$disconnect();
        }
      };
    }

    if (prop === '$transaction') {
      return async (callback: any) => {
        if (isPostgresConnected) {
          return await target.$transaction(callback);
        }
        if (typeof callback === 'function') {
          return await callback(prismaProxy);
        }
        return callback;
      };
    }

    const modelName = String(prop);
    if (modelName.startsWith('$')) {
      return Reflect.get(target, prop, receiver);
    }

    if (isPostgresConnected) {
      const model = Reflect.get(target, prop, receiver);
      if (typeof model === 'object' && model !== null) {
        return new Proxy(model, {
          get(modelTarget, modelProp) {
            const originalMethod = Reflect.get(modelTarget, modelProp);
            if (typeof originalMethod === 'function') {
              return async (...args: any[]) => {
                try {
                  return await originalMethod.apply(modelTarget, args);
                } catch (err: any) {
                  const isConnectionErr = 
                    err.code?.startsWith('P10') || 
                    err.message?.includes("Can't reach database server") ||
                    err.message?.includes("connection") ||
                    err.message?.includes("timeout");
                  
                  if (isConnectionErr) {
                    logger.warn(`⚠️ PostgreSQL connection lost during ${modelName}.${String(modelProp)}. Switching to Mock DB.`);
                    isPostgresConnected = false;
                    const mockHandler = createMockHandler(modelName);
                    const mockMethod = Reflect.get(mockHandler, modelProp);
                    if (typeof mockMethod === 'function') {
                      return await mockMethod.apply(mockHandler, args);
                    }
                  }
                  throw err;
                }
              };
            }
            return originalMethod;
          }
        });
      }
      return model;
    }

    return createMockHandler(modelName);
  }
}) as any;

export const prisma = prismaProxy;

export async function connectPostgres() {
  try {
    await prisma.$connect();
  } catch (error) {
    logger.error('⚠️ PostgreSQL connection failed on startup. Server will continue booting, Prisma will use Mock DB.', error);
  }
}

// ─── MongoDB (Mongoose) ───────────────────────────────
export async function connectMongoDB(uri: string) {
  try {
    mongoose.set('strictQuery', false);
    mongoose.set('bufferCommands', false);
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000, // Reduced to 2 seconds for faster failover
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    logger.info('✅ MongoDB connected via Mongoose');
  } catch (error) {
    logger.error('⚠️ MongoDB connection failed on startup. Server will continue booting, Mongoose will use Mock DB.', error);
  }
}

