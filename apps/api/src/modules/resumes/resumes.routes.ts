// apps/api/src/modules/resumes/resumes.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { resumesController } from './resumes.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

router.use(authenticate);

// Upload and analyze resume
router.post(
  '/upload',
  uploadLimiter,
  upload.single('resume'),
  resumesController.uploadAndAnalyze
);

router.get('/', resumesController.listResumes);
router.get('/:id', resumesController.getResumeAnalysis);
router.post('/match-jd', resumesController.matchJobDescription);
router.post('/generate-roadmap', resumesController.generateRoadmap);
router.get('/roadmap/all', resumesController.getRoadmaps);

export default router;
