// apps/api/src/modules/coach/coach.routes.ts
import { Router } from 'express';
import { coachController } from './coach.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/insights', coachController.getInsights);
router.post('/compile', coachController.compileWeeklyReport);

export default router;
