// apps/api/src/modules/analytics/analytics.routes.ts
import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardSummary);
router.get('/readiness-history', analyticsController.getHistoricalReadiness);

export default router;
