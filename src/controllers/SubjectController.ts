import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Subject } from "../entities/Subject";
import { Sector } from "../entities/Sector";
import { AuthRequest } from "../middleware/auth";
import { In } from "typeorm";

const subjectRepository = AppDataSource.getRepository(Subject);
const sectorRepository = AppDataSource.getRepository(Sector);

export class SubjectController {
  static async getAllSubjects(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const subjects = await subjectRepository.find({
        where: { isActive: true },
        relations: ["sectors"],
        order: { label: "ASC" },
      });
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subjects" });
    }
  }

  static async getSubjectsBySectorId(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { sectorId } = req.params;

      const subjects = await subjectRepository
        .createQueryBuilder("subject")
        .leftJoinAndSelect("subject.sectors", "sector")
        .where("sector.id = :sectorId", { sectorId })
        .andWhere("subject.isActive = :isActive", { isActive: true })
        .orderBy("subject.label", "ASC")
        .getMany();

      res.json(subjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subjects by sector" });
    }
  }

  static async getSubjectById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subject = await subjectRepository.findOne({
        where: { id: req.params.id },
        relations: ["sectors"],
      });

      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }

      res.json(subject);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subject" });
    }
  }

  static async createSubject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { label, value, sectorIds, isActive } = req.body;

      // Get sectors if sectorIds are provided
      let sectors: Sector[] = [];
      if (sectorIds && Array.isArray(sectorIds) && sectorIds.length > 0) {
        sectors = await sectorRepository.find({
          where: { id: In(sectorIds) },
        });
      }

      const subject = subjectRepository.create({
        label,
        value,
        sectors,
        isActive: isActive ?? true,
      });

      const savedSubject = await subjectRepository.save(subject);

      // Reload with relations
      const subjectWithSectors = await subjectRepository.findOne({
        where: { id: savedSubject.id },
        relations: ["sectors"],
      });

      res.status(201).json(subjectWithSectors);
    } catch (error) {
      console.error("Failed to create subject:", error);
      res.status(500).json({ error: "Failed to create subject" });
    }
  }

  static async updateSubject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subject = await subjectRepository.findOne({
        where: { id: req.params.id },
        relations: ["sectors"],
      });

      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }

      const { sectorIds, ...otherFields } = req.body;

      // Update sectors if sectorIds are provided
      if (sectorIds !== undefined) {
        if (Array.isArray(sectorIds) && sectorIds.length > 0) {
          const sectors = await sectorRepository.find({
            where: { id: In(sectorIds) },
          });
          subject.sectors = sectors;
        } else {
          subject.sectors = [];
        }
      }

      // Update other fields
      subjectRepository.merge(subject, otherFields);
      const updatedSubject = await subjectRepository.save(subject);

      // Reload with relations
      const subjectWithSectors = await subjectRepository.findOne({
        where: { id: updatedSubject.id },
        relations: ["sectors"],
      });

      res.json(subjectWithSectors);
    } catch (error) {
      console.error("Failed to update subject:", error);
      res.status(500).json({ error: "Failed to update subject" });
    }
  }

  static async deleteSubject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subject = await subjectRepository.findOne({
        where: { id: req.params.id },
      });

      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }

      await subjectRepository.remove(subject);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subject" });
    }
  }
}
