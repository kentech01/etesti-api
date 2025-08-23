import { Router } from 'express';
import { UserAnswerController } from '../controllers/UserAnswerController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/submit', authenticateToken, UserAnswerController.submitAnswer);
router.get('/', authenticateToken, UserAnswerController.getUserAnswers);
router.get('/results/:examId', authenticateToken, UserAnswerController.getExamResults);
router.put('/:id', authenticateToken, UserAnswerController.updateAnswer);

export default router;
