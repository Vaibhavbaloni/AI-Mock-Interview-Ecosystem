// apps/api/src/modules/interviews/interviews.routes.ts
import { Router } from 'express';
import { interviewsController } from './interviews.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', interviewsController.createInterview);
router.get('/', interviewsController.getInterviews);
router.get('/:id', interviewsController.getInterviewDetails);
router.post('/:id/journal', interviewsController.createJournal);

export default router;
