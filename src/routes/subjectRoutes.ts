import { Router } from 'express';
import { SubjectController } from '../controllers/SubjectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', SubjectController.getAllSubjects);
router.get('/sector/:sectorId', SubjectController.getSubjectsBySectorId);
router.get('/:id', SubjectController.getSubjectById);
router.post('/', authenticateToken, SubjectController.createSubject);
router.put('/:id', authenticateToken, SubjectController.updateSubject);
router.delete('/:id', authenticateToken, SubjectController.deleteSubject);

export default router;

