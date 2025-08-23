import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Exam } from '../entities/Exam';
import { User } from '../entities/User';
import { AuthRequest } from '../middleware/auth';

const examRepository = AppDataSource.getRepository(Exam);
const userRepository = AppDataSource.getRepository(User);

export class ExamController {
    static async createExam(req: AuthRequest, res: Response): Promise<void> {
        try {
            const exam = examRepository.create({
                title: req.body.title,
                description: req.body.description,
                sectorId: req.body.sectorId,
                isActive: req.body.isActive ?? false,
                totalQuestions: req.body.totalQuestions,
                passingScore: req.body.passingScore
            });

            const savedExam = await examRepository.save(exam);
            res.status(201).json(savedExam);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create exam' });
        }
    }

    static async getExams(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { sectorId } = req.query;
            const where: any = { isActive: true };

            if (sectorId) {
                where.sectorId = sectorId;
            }

            const exams = await examRepository.find({
                where,
                relations: ['sector'],
                order: { createdAt: 'DESC' }
            });

            res.json(exams);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get exams' });
        }
    }

    static async getExamById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const exam = await examRepository.findOne({
                where: { id: req.params.id },
                relations: ['sector', 'questions', 'questions.options']
            });

            if (!exam) {
                res.status(404).json({ error: 'Exam not found' });
                return;
            }

            res.json(exam);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get exam' });
        }
    }

    static async updateExam(req: AuthRequest, res: Response): Promise<void> {
        try {
            const exam = await examRepository.findOne({
                where: { id: req.params.id }
            });

            if (!exam) {
                res.status(404).json({ error: 'Exam not found' });
                return;
            }

            examRepository.merge(exam, req.body);
            const updatedExam = await examRepository.save(exam);
            res.json(updatedExam);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update exam' });
        }
    }

    static async deleteExam(req: AuthRequest, res: Response): Promise<void> {
        try {
            const exam = await examRepository.findOne({
                where: { id: req.params.id }
            });

            if (!exam) {
                res.status(404).json({ error: 'Exam not found' });
                return;
            }

            await examRepository.remove(exam);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete exam' });
        }
    }

    static async getExamsBySector(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { sectorId } = req.params;

            const exams = await examRepository.find({
                where: { sectorId, isActive: true },
                relations: ['sector'],
                order: { createdAt: 'DESC' }
            });

            res.json(exams);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get exams by sector' });
        }
    }
}
