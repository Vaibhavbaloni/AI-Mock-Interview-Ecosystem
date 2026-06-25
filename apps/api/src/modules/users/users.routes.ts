// apps/api/src/modules/users/users.routes.ts
import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Secure all user routes
router.use(authenticate);

router.get('/me', usersController.getMe);
router.put('/profile', usersController.updateProfile);

router.post('/skills', usersController.addSkill);
router.delete('/skills/:id', usersController.deleteSkill);

router.post('/education', usersController.addEducation);
router.delete('/education/:id', usersController.deleteEducation);

export default router;
