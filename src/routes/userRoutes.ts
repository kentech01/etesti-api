import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/profile', authenticateToken, UserController.createUser);
router.get('/profile', authenticateToken, UserController.getUserProfile);
router.put('/profile', authenticateToken, UserController.updateUser);
router.delete('/profile', authenticateToken, UserController.deleteUser);

export default router;
