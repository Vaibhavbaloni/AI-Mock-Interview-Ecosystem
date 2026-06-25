// apps/api/src/modules/simulation/simulation.routes.ts
import { Router } from 'express';
import { simulationController } from './simulation.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/start', simulationController.startSimulation);
router.get('/list', simulationController.listSimulations);
router.get('/:id/status', simulationController.getSimulationStatus);
router.get('/:id/oa-problem', simulationController.getOAProblem);
router.post('/:id/submit', simulationController.submitRoundDetails);

export default router;
