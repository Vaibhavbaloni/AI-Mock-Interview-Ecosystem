// apps/api/src/utils/docx.ts
import mammoth from 'mammoth';
import { logger } from './logger';

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: any) {
    logger.error('Failed to parse DOCX buffer:', error);
    throw new Error('Could not parse DOCX. Ensure it is a valid, unencrypted Word file.');
  }
}
