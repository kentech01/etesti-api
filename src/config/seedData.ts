import { AppDataSource } from "./database";
import { Sector } from "../entities/Sector";
import { Subject } from "../entities/Subject";

export const seedSectors = async (): Promise<void> => {
  try {
    const sectorRepository = AppDataSource.getRepository(Sector);

    const existingSectors = await sectorRepository.find();
    if (existingSectors.length > 0) {
      console.log("Sectors already exist, skipping seed");
      return;
    }

    const sectors = [
      {
        name: "KLASA_9",
        displayName: "Klasa 9",
        isActive: true,
      },
      {
        name: "KLASA_12",
        displayName: "Klasa 12",
        isActive: true,
      },
    ];

    for (const sectorData of sectors) {
      const sector = sectorRepository.create(sectorData);
      await sectorRepository.save(sector);
    }

    console.log("Sectors seeded successfully");
  } catch (error) {
    console.error("Failed to seed sectors:", error);
  }
};

const SUBJECTS_6_9 = [
  { label: "Gjuhë Shqipe", value: "gjuhe_shqipe" },
  { label: "Letërsi", value: "leteri" },
  { label: "Gjuhë Angleze", value: "gjuhe_angleze" },
  {
    label: "Gjuhë e dytë e huaj (zakonisht Gjermanisht)",
    value: "gjuhe_e_dyte_e_huaj",
  },
  { label: "Matematikë", value: "matematike" },
  { label: "Fizikë", value: "fizike" },
  { label: "Kimi", value: "kimi" },
  { label: "Biologji", value: "biologji" },
  { label: "Histori", value: "histori" },
  { label: "Gjeografi", value: "gjeografi" },
  { label: "Edukatë Qytetare", value: "edukate_qytetare" },
  { label: "Edukatë Muzikore", value: "edukate_muzikore" },
  { label: "Edukatë Figurative", value: "edukate_figurative" },
  { label: "Edukatë Fizike", value: "edukate_fizike" },
  { label: "Teknologji / Teknikë", value: "teknologji_tekinke" },
];

const SUBJECTS_10_12 = [
  { label: "Gjuhë Shqipe", value: "gjuhe_shqipe" },
  { label: "Matematikë", value: "matematike" },
  { label: "Anglisht", value: "anglisht" },
  { label: "Fizikë", value: "fizike" },
  { label: "Kimi", value: "kimi" },
  { label: "Biologji", value: "biologji" },
  { label: "Histori", value: "histori" },
  { label: "Gjeografi", value: "gjeografi" },
  { label: "Ekonomi", value: "ekonomi" },
  { label: "Informatikë", value: "informatike" },
  { label: "Lëndë profesionale", value: "lende_profesionale" },
];

export const seedSubjects = async (): Promise<void> => {
  try {
    const subjectRepository = AppDataSource.getRepository(Subject);
    const sectorRepository = AppDataSource.getRepository(Sector);

    const existingSubjects = await subjectRepository.find();
    if (existingSubjects.length > 0) {
      console.log("Subjects already exist, skipping seed");
      return;
    }

    // Get sectors
    const klasa9Sector = await sectorRepository.findOne({
      where: { name: "KLASA_9" },
    });
    const klasa12Sector = await sectorRepository.findOne({
      where: { name: "KLASA_12" },
    });

    if (!klasa9Sector || !klasa12Sector) {
      console.error("Sectors not found. Please seed sectors first.");
      return;
    }

    // Combine all unique subjects from both lists
    const allSubjectsMap = new Map<
      string,
      { label: string; value: string; sectors: Sector[] }
    >();

    // Add subjects from KLASA_9
    for (const subjectData of SUBJECTS_6_9) {
      if (!allSubjectsMap.has(subjectData.value)) {
        allSubjectsMap.set(subjectData.value, {
          label: subjectData.label,
          value: subjectData.value,
          sectors: [klasa9Sector],
        });
      } else {
        // Subject already exists, add this sector to it
        const existing = allSubjectsMap.get(subjectData.value)!;
        if (!existing.sectors.find((s) => s.id === klasa9Sector.id)) {
          existing.sectors.push(klasa9Sector);
        }
      }
    }

    // Add subjects from KLASA_12
    for (const subjectData of SUBJECTS_10_12) {
      if (!allSubjectsMap.has(subjectData.value)) {
        allSubjectsMap.set(subjectData.value, {
          label: subjectData.label,
          value: subjectData.value,
          sectors: [klasa12Sector],
        });
      } else {
        // Subject already exists, add this sector to it
        const existing = allSubjectsMap.get(subjectData.value)!;
        if (!existing.sectors.find((s) => s.id === klasa12Sector.id)) {
          existing.sectors.push(klasa12Sector);
        }
      }
    }

    // Create unique subjects with their associated sectors
    for (const subjectData of allSubjectsMap.values()) {
      const subject = subjectRepository.create({
        label: subjectData.label,
        value: subjectData.value,
        sectors: subjectData.sectors,
        isActive: true,
      });
      await subjectRepository.save(subject);
    }

    console.log("Subjects seeded successfully");
  } catch (error) {
    console.error("Failed to seed subjects:", error);
  }
};

export const runSeeds = async (): Promise<void> => {
  await seedSectors();
  await seedSubjects();
};
