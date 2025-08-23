import { Router } from 'express';
import { SectorController } from '../controllers/SectorController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', SectorController.getAllSectors);
router.get('/:id', SectorController.getSectorById);
router.post('/', authenticateToken, SectorController.createSector);
router.put('/:id', authenticateToken, SectorController.updateSector);
router.delete('/:id', authenticateToken, SectorController.deleteSector);

export default router;
