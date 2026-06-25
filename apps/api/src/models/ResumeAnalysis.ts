// src/models/ResumeAnalysis.ts
import mongoose, { Schema, Document } from 'mongoose';
import { createMongooseModelProxy } from '../config/mockMongoose';

export interface IResumeAnalysis extends Document {
  resumeId: string;
  userId: string;
  rawExtractedText: string;
  parsedData: {
    skills: {
      technical: string[];
      soft: string[];
      tools: string[];
      languages: string[];
    };
    experience: Array<{
      company: string;
      role: string;
      duration: string;
      highlights: string[];
    }>;
    education: Array<{
      institution: string;
      degree: string;
      cgpa?: string;
      year?: string;
    }>;
    projects: Array<{
      name: string;
      tech: string[];
      impact: string;
      description: string;
    }>;
    certifications: string[];
    achievements: string[];
  };
  aiSuggestions: {
    missingSections: string[];
    improvedBullets: Array<{ original: string; improved: string }>;
    atsRecommendations: string[];
    overallFeedback: string;
  };
  createdAt: Date;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    resumeId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    rawExtractedText: { type: String, required: true },
    parsedData: {
      skills: {
        technical: [String],
        soft: [String],
        tools: [String],
        languages: [String],
      },
      experience: [
        {
          company: String,
          role: String,
          duration: String,
          highlights: [String],
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          cgpa: String,
          year: String,
        },
      ],
      projects: [
        {
          name: String,
          tech: [String],
          impact: String,
          description: String,
        },
      ],
      certifications: [String],
      achievements: [String],
    },
    aiSuggestions: {
      missingSections: [String],
      improvedBullets: [{ original: String, improved: String }],
      atsRecommendations: [String],
      overallFeedback: String,
    },
  },
  { timestamps: true }
);

const ActualResumeAnalysis = mongoose.model<IResumeAnalysis>(
  'ResumeAnalysis',
  ResumeAnalysisSchema
);

export const ResumeAnalysis = createMongooseModelProxy(ActualResumeAnalysis, 'ResumeAnalysis');

