import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Exam } from '../entities/Exam';
import { Question } from '../entities/Question';
import { QuestionOption } from '../entities/QuestionOption';
import { User } from '../entities/User';
import { AuthRequest } from '../middleware/auth';

const examRepository = AppDataSource.getRepository(Exam);
const questionRepository = AppDataSource.getRepository(Question);
const optionRepository = AppDataSource.getRepository(QuestionOption);
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

    static async createCompleteExam(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { title, description, sectorId, isActive, totalQuestions, passingScore, questions } = req.body;

            if (!questions || !Array.isArray(questions) || questions.length === 0) {
                res.status(400).json({ error: 'Questions array is required and must not be empty' });
                return;
            }

            const exam = examRepository.create({
                title,
                description,
                sectorId,
                isActive: isActive ?? false,
                totalQuestions: totalQuestions ?? questions.length,
                passingScore: passingScore ?? 0
            });

            const savedExam = await examRepository.save(exam);

            const createdQuestions = [];

            for (const questionData of questions) {
                const question = questionRepository.create({
                    text: questionData.text,
                    imageUrl: questionData.imageUrl,
                    examId: savedExam.id,
                    subject: questionData.subject,
                    examPart: questionData.examPart,
                    parentId: questionData.parentId,
                    displayText: questionData.displayText,
                    orderNumber: questionData.orderNumber,
                    points: questionData.points ?? 1,
                    isActive: questionData.isActive ?? true
                });

                const savedQuestion = await questionRepository.save(question);

                if (questionData.options && Array.isArray(questionData.options)) {
                    const options = questionData.options.map((option: any) => ({
                        text: option.text,
                        imageUrl: option.imageUrl,
                        questionId: savedQuestion.id,
                        optionLetter: option.optionLetter,
                        isCorrect: option.isCorrect
                    }));

                    await optionRepository.save(options);
                }

                const questionWithOptions = await questionRepository.findOne({
                    where: { id: savedQuestion.id },
                    relations: ['options']
                });

                createdQuestions.push(questionWithOptions);
            }

            const completeExam = await examRepository.findOne({
                where: { id: savedExam.id },
                relations: ['sector', 'questions', 'questions.options']
            });

            res.status(201).json({
                exam: completeExam,
                questionsCreated: createdQuestions.length,
                message: 'Complete exam created successfully'
            });

        } catch (error) {
            console.error('Failed to create complete exam:', error);
            res.status(500).json({ error: 'Failed to create complete exam' });
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
