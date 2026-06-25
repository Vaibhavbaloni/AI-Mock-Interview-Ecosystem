// apps/api/src/utils/pdf.ts
import pdfParse from 'pdf-parse';
import { logger } from './logger';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    logger.error('Failed to parse PDF buffer:', error);
    throw new Error('Could not parse PDF. Ensure it is a valid, unencrypted PDF file.');
  }
}
