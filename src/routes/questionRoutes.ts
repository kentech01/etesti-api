import { Router } from 'express';
import { QuestionController } from '../controllers/QuestionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/exam/:examId', QuestionController.getQuestionsByExam);
router.get('/exam/:examId/subject/:subject', QuestionController.getQuestionsBySubject);
router.get('/exam/:examId/part/:examPart', QuestionController.getQuestionsByExamPart);
router.get('/:id', QuestionController.getQuestionById);
router.post('/', authenticateToken, QuestionController.createQuestion);
router.put('/:id', authenticateToken, QuestionController.updateQuestion);
router.delete('/:id', authenticateToken, QuestionController.deleteQuestion);

export default router;
