import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', ExamController.getExams);
router.get('/sector/:sectorId', ExamController.getExamsBySector);
router.get('/:id', ExamController.getExamById);
router.post('/', authenticateToken, ExamController.createExam);
router.put('/:id', authenticateToken, ExamController.updateExam);
router.delete('/:id', authenticateToken, ExamController.deleteExam);

export default router;
