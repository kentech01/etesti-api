import { AppDataSource } from './database';
import { Sector } from '../entities/Sector';

export const seedSectors = async (): Promise<void> => {
    try {
        const sectorRepository = AppDataSource.getRepository(Sector);

        const existingSectors = await sectorRepository.find();
        if (existingSectors.length > 0) {
            console.log('Sectors already exist, skipping seed');
            return;
        }

        const sectors = [
            {
                name: 'KLASA_9',
                displayName: 'Klasa 9',
                isActive: true
            },
            {
                name: 'KLASA_12',
                displayName: 'Klasa 12',
                isActive: true
            }
        ];

        for (const sectorData of sectors) {
            const sector = sectorRepository.create(sectorData);
            await sectorRepository.save(sector);
        }

        console.log('Sectors seeded successfully');
    } catch (error) {
        console.error('Failed to seed sectors:', error);
    }
};

export const runSeeds = async (): Promise<void> => {
    await seedSectors();
};
