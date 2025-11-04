import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Question } from "../entities/Question";
import { QuestionOption } from "../entities/QuestionOption";
import { AuthRequest } from "../middleware/auth";

const questionRepository = AppDataSource.getRepository(Question);
const optionRepository = AppDataSource.getRepository(QuestionOption);

export class QuestionController {
  static async createQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const question = questionRepository.create({
        text: req.body.text,
        imageUrl: req.body.imageUrl,
        examId: req.body.examId,
        subject: req.body.subject,
        examPart: req.body.examPart,
        parentId: req.body.parentId,
        displayText: req.body.displayText,
        description: req.body.description,
        orderNumber: req.body.orderNumber,
        points: req.body.points ?? 1,
        isActive: req.body.isActive ?? true,
      });

      const savedQuestion = await questionRepository.save(question);

      if (req.body.options && Array.isArray(req.body.options)) {
        const options = req.body.options.map((option: any) => ({
          text: option.text,
          imageUrl: option.imageUrl,
          questionId: savedQuestion.id,
          optionLetter: option.optionLetter,
          isCorrect: option.isCorrect,
        }));

        await optionRepository.save(options);
      }

      const questionWithOptions = await questionRepository.findOne({
        where: { id: savedQuestion.id },
        relations: ["options"],
      });

      res.status(201).json(questionWithOptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to create question" });
    }
  }

  static async getQuestionsByExam(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { examId } = req.params;

      const questions = await questionRepository.find({
        where: { examId, isActive: true },
        relations: ["options"],
        order: { orderNumber: "ASC" },
      });

      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get questions" });
    }
  }

  static async getQuestionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const question = await questionRepository.findOne({
        where: { id: req.params.id },
        relations: ["options"],
      });

      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to get question" });
    }
  }

  static async updateQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { options: incomingOptions, ...questionData } = req.body ?? {};

      const result = await AppDataSource.transaction(async (manager) => {
        const trxQuestionRepo = manager.getRepository(Question);
        const trxOptionRepo = manager.getRepository(QuestionOption);

        const existing = await trxQuestionRepo.findOne({
          where: { id: req.params.id },
        });

        if (!existing) {
          return { notFound: true } as any;
        }

        trxQuestionRepo.merge(existing, questionData);
        const saved = await trxQuestionRepo.save(existing);

        if (Array.isArray(incomingOptions)) {
          await trxOptionRepo.delete({ questionId: saved.id });

          const newOptions = incomingOptions.map((option: any) => ({
            text: option.text,
            imageUrl: option.imageUrl,
            questionId: saved.id,
            optionLetter: option.optionLetter,
            isCorrect: option.isCorrect,
          }));

          if (newOptions.length > 0) {
            await trxOptionRepo.save(newOptions);
          }
        }

        const reloaded = await trxQuestionRepo.findOne({
          where: { id: saved.id },
          relations: ["options"],
        });

        return { entity: reloaded };
      });

      if ((result as any).notFound) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.json((result as any).entity);
    } catch (error) {
      res.status(500).json({ error: "Failed to update question" });
    }
  }

  static async deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const question = await questionRepository.findOne({
        where: { id: req.params.id },
      });

      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      await optionRepository.delete({ questionId: question.id });
      await questionRepository.remove(question);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete question" });
    }
  }

  static async getQuestionsBySubject(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { examId, subject } = req.params;

      const questions = await questionRepository.find({
        where: { examId, subject, isActive: true },
        relations: ["options"],
        order: { orderNumber: "ASC" },
      });

      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get questions by subject" });
    }
  }

  static async getQuestionsByExamPart(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { examId, examPart } = req.params;

      const questions = await questionRepository.find({
        where: { examId, examPart, isActive: true },
        relations: ["options"],
        order: { orderNumber: "ASC" },
      });

      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get questions by exam part" });
    }
  }
}
