import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Sector } from '../entities/Sector';
import { AuthRequest } from '../middleware/auth';

const sectorRepository = AppDataSource.getRepository(Sector);

export class SectorController {
    static async getAllSectors(req: AuthRequest, res: Response): Promise<void> {
        try {
            const sectors = await sectorRepository.find({
                where: { isActive: true },
                order: { name: 'ASC' }
            });
            res.json(sectors);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get sectors' });
        }
    }

    static async getSectorById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const sector = await sectorRepository.findOne({
                where: { id: req.params.id }
            });

            if (!sector) {
                res.status(404).json({ error: 'Sector not found' });
                return;
            }

            res.json(sector);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get sector' });
        }
    }

    static async createSector(req: AuthRequest, res: Response): Promise<void> {
        try {
            const sector = sectorRepository.create({
                name: req.body.name,
                displayName: req.body.displayName,
                isActive: req.body.isActive ?? true
            });

            const savedSector = await sectorRepository.save(sector);
            res.status(201).json(savedSector);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create sector' });
        }
    }

    static async updateSector(req: AuthRequest, res: Response): Promise<void> {
        try {
            const sector = await sectorRepository.findOne({
                where: { id: req.params.id }
            });

            if (!sector) {
                res.status(404).json({ error: 'Sector not found' });
                return;
            }

            sectorRepository.merge(sector, req.body);
            const updatedSector = await sectorRepository.save(sector);
            res.json(updatedSector);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update sector' });
        }
    }

    static async deleteSector(req: AuthRequest, res: Response): Promise<void> {
        try {
            const sector = await sectorRepository.findOne({
                where: { id: req.params.id }
            });

            if (!sector) {
                res.status(404).json({ error: 'Sector not found' });
                return;
            }

            await sectorRepository.remove(sector);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete sector' });
        }
    }
}
