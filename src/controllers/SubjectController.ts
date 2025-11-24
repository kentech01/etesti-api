import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Subject } from "../entities/Subject";
import { AuthRequest } from "../middleware/auth";

const subjectRepository = AppDataSource.getRepository(Subject);

export class SubjectController {
  static async getAllSubjects(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const subjects = await subjectRepository.find({
        where: { isActive: true },
        relations: ["sector"],
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

      const subjects = await subjectRepository.find({
        where: { sectorId, isActive: true },
        relations: ["sector"],
        order: { label: "ASC" },
      });

      res.json(subjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subjects by sector" });
    }
  }

  static async getSubjectById(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const subject = await subjectRepository.findOne({
        where: { id: req.params.id },
        relations: ["sector"],
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
      const subject = subjectRepository.create({
        label: req.body.label,
        value: req.body.value,
        sectorId: req.body.sectorId,
        isActive: req.body.isActive ?? true,
      });

      const savedSubject = await subjectRepository.save(subject);
      res.status(201).json(savedSubject);
    } catch (error) {
      res.status(500).json({ error: "Failed to create subject" });
    }
  }

  static async updateSubject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const subject = await subjectRepository.findOne({
        where: { id: req.params.id },
      });

      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }

      subjectRepository.merge(subject, req.body);
      const updatedSubject = await subjectRepository.save(subject);
      res.json(updatedSubject);
    } catch (error) {
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

