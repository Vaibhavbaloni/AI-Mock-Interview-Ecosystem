// apps/api/src/modules/coding/coding.routes.ts
import { Router } from 'express';
import { codingController } from './coding.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { codeLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticate);

router.get('/problems', codingController.listProblems);
router.get('/problems/:id', codingController.getProblemDetails);
router.post('/problems/:id/submit', codeLimiter, codingController.submitCode);

export default router;
