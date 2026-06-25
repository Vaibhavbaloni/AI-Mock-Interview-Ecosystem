// src/models/InterviewSession.ts
import mongoose, { Schema, Document } from 'mongoose';
import { createMongooseModelProxy } from '../config/mockMongoose';

export interface IMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  persona?: string;
  audioUrl?: string;
  evaluation?: {
    score: number;
    keywordsMatched: string[];
    fillerWords: string[];
    sentiment: string;
    starComponents?: {
      situation: boolean;
      task: boolean;
      action: boolean;
      result: boolean;
    };
  };
}

export interface IReplayEvent {
  timeOffsetSeconds: number;
  event: 'STRONG_ANSWER' | 'WEAK_ANSWER' | 'EYE_CONTACT_DROP' | 'FILLER_WORD' | 'PACE_ALERT' | 'GOOD_POSTURE' | 'NERVOUS_GESTURE';
  note: string;
  severity: 'positive' | 'warning' | 'negative';
}

export interface IVideoAnalysis {
  eyeContactScore: number;
  smileFrequency: number;
  headPostureScore: number;
  speakingPaceWpm: number;
  confidenceScore: number;
  nervousnessIndicators: string[];
}

export interface IAIReport {
  summary: string;
  technicalSummary?: string;
  behavioralSummary?: string;
  strengths: string[];
  weaknesses: string[];
  improvementPlan: string[];
  hireRecommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'No Hire';
  nextSteps: string[];
}

export interface IInterviewSession extends Document {
  interviewId: string;
  userId: string;
  messages: IMessage[];
  replayTimeline: IReplayEvent[];
  videoAnalysis?: IVideoAnalysis;
  aiReport?: IAIReport;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
    estimatedCostUsd: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['interviewer', 'candidate'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  persona: String,
  audioUrl: String,
  evaluation: {
    score: Number,
    keywordsMatched: [String],
    fillerWords: [String],
    sentiment: String,
    starComponents: {
      situation: Boolean,
      task: Boolean,
      action: Boolean,
      result: Boolean,
    },
  },
});

const ReplayEventSchema = new Schema<IReplayEvent>({
  timeOffsetSeconds: { type: Number, required: true },
  event: { type: String, required: true },
  note: { type: String, required: true },
  severity: { type: String, enum: ['positive', 'warning', 'negative'], required: true },
});

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    interviewId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messages: [MessageSchema],
    replayTimeline: [ReplayEventSchema],
    videoAnalysis: {
      eyeContactScore: Number,
      smileFrequency: Number,
      headPostureScore: Number,
      speakingPaceWpm: Number,
      confidenceScore: Number,
      nervousnessIndicators: [String],
    },
    aiReport: {
      summary: String,
      technicalSummary: String,
      behavioralSummary: String,
      strengths: [String],
      weaknesses: [String],
      improvementPlan: [String],
      hireRecommendation: String,
      nextSteps: [String],
    },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      model: String,
      estimatedCostUsd: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const ActualInterviewSession = mongoose.model<IInterviewSession>(
  'InterviewSession',
  InterviewSessionSchema
);

export const InterviewSession = createMongooseModelProxy(ActualInterviewSession, 'InterviewSession');

