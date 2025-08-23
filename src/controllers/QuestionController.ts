import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Question } from '../entities/Question';
import { QuestionOption } from '../entities/QuestionOption';
import { AuthRequest } from '../middleware/auth';

const questionRepository = AppDataSource.getRepository(Question);
const optionRepository = AppDataSource.getRepository(QuestionOption);

export class QuestionController {
    static async createQuestion(req: AuthRequest, res: Response): Promise<void> {
        try {
            const question = questionRepository.create({
                text: req.body.text,
                examId: req.body.examId,
                orderNumber: req.body.orderNumber,
                points: req.body.points ?? 1,
                isActive: req.body.isActive ?? true
            });

            const savedQuestion = await questionRepository.save(question);

            if (req.body.options && Array.isArray(req.body.options)) {
                const options = req.body.options.map((option: any) => ({
                    text: option.text,
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

            res.status(201).json(questionWithOptions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create question' });
        }
    }

    static async getQuestionsByExam(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { examId } = req.params;

            const questions = await questionRepository.find({
                where: { examId, isActive: true },
                relations: ['options'],
                order: { orderNumber: 'ASC' }
            });

            res.json(questions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get questions' });
        }
    }

    static async getQuestionById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const question = await questionRepository.findOne({
                where: { id: req.params.id },
                relations: ['options']
            });

            if (!question) {
                res.status(404).json({ error: 'Question not found' });
                return;
            }

            res.json(question);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get question' });
        }
    }

    static async updateQuestion(req: AuthRequest, res: Response): Promise<void> {
        try {
            const question = await questionRepository.findOne({
                where: { id: req.params.id }
            });

            if (!question) {
                res.status(404).json({ error: 'Question not found' });
                return;
            }

            questionRepository.merge(question, req.body);
            const updatedQuestion = await questionRepository.save(question);

            if (req.body.options && Array.isArray(req.body.options)) {
                await optionRepository.delete({ questionId: question.id });

                const options = req.body.options.map((option: any) => ({
                    text: option.text,
                    questionId: question.id,
                    optionLetter: option.optionLetter,
                    isCorrect: option.isCorrect
                }));

                await optionRepository.save(options);
            }

            const questionWithOptions = await questionRepository.findOne({
                where: { id: question.id },
                relations: ['options']
            });

            res.json(questionWithOptions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update question' });
        }
    }

    static async deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
        try {
            const question = await questionRepository.findOne({
                where: { id: req.params.id }
            });

            if (!question) {
                res.status(404).json({ error: 'Question not found' });
                return;
            }

            await optionRepository.delete({ questionId: question.id });
            await questionRepository.remove(question);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete question' });
        }
    }
}
