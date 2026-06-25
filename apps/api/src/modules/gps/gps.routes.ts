// apps/api/src/modules/gps/gps.routes.ts
import { Router } from 'express';
import { gpsController } from './gps.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/route', gpsController.getActiveRoute);
router.post('/complete-node', gpsController.completeNode);

export default router;
