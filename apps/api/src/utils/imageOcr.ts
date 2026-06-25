// apps/api/src/utils/imageOcr.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from './logger';

export async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    logger.warn('⚠️ GEMINI_API_KEY is not configured. Returning mock OCR extracted text for testing.');
    return `John Doe
Full Stack Engineer
student@interviewverse.ai

SUMMARY
Energetic software engineer with 2+ years of experience building React/Node.js web applications.

SKILLS
React, Node.js, TypeScript, Express, PostgreSQL, MongoDB, Git, Docker, AWS, Python

EXPERIENCE
Software Engineer | Acme Corporation | 2024 - Present
- Developed React/Node.js web applications, reducing DB response times by 30%.
- Integrated AWS services and containerized microservices using Docker.

EDUCATION
B.S. Computer Science | Tech University | 2023`;
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    // Use gemini-1.5-flash as it is fast and excellent at multimodal OCR tasks
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'You are a high-accuracy OCR scanner. Extract all text from this resume image. Preserve the exact layout, content, spelling, headings, and details. Do not summarize; write out all text content.';
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType,
        },
      },
    ]);

    const text = result.response.text();
    if (!text) {
      throw new Error('Gemini returned empty text response for OCR.');
    }
    return text;
  } catch (error: any) {
    logger.error('Failed to perform Gemini image OCR:', error);
    throw new Error('Could not parse resume image. Ensure it is a valid, unencrypted image file.');
  }
}
