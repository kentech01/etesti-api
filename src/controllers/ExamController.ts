import { Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { Exam } from "../entities/Exam";
import { Question } from "../entities/Question";
import { QuestionOption } from "../entities/QuestionOption";
import { UserAnswer } from "../entities/UserAnswer";
import { getOrCreateUser } from "./UserController";
import { AuthRequest } from "../middleware/auth";

const examRepository = AppDataSource.getRepository(Exam);
const questionRepository = AppDataSource.getRepository(Question);
const optionRepository = AppDataSource.getRepository(QuestionOption);
const userAnswerRepository = AppDataSource.getRepository(UserAnswer);

export class ExamController {
  static async createExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const exam = examRepository.create({
        title: req.body.title,
        description: req.body.description,
        sectorId: req.body.sectorId,
        isActive: req.body.isActive ?? false,
        totalQuestions: req.body.totalQuestions,
        passingScore: req.body.passingScore,
      });

      const savedExam = await examRepository.save(exam);
      res.status(201).json(savedExam);
    } catch (error) {
      res.status(500).json({ error: "Failed to create exam" });
    }
  }

  static async createCompleteExam(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        title,
        description,
        sectorId,
        isActive,
        totalQuestions,
        passingScore,
        questions,
      } = req.body;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        res
          .status(400)
          .json({ error: "Questions array is required and must not be empty" });
        return;
      }

      const exam = examRepository.create({
        title,
        description,
        sectorId,
        isActive: isActive ?? false,
        totalQuestions: totalQuestions ?? questions.length,
        passingScore: passingScore ?? 0,
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
          description: questionData.description,
          orderNumber: questionData.orderNumber,
          points: questionData.points ?? 1,
          isActive: questionData.isActive ?? true,
        });

        const savedQuestion = await questionRepository.save(question);

        if (questionData.options && Array.isArray(questionData.options)) {
          const options = questionData.options.map((option: any) => ({
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

        createdQuestions.push(questionWithOptions);
      }

      const completeExam = await examRepository.findOne({
        where: { id: savedExam.id },
        relations: ["sector", "questions", "questions.options"],
      });

      res.status(201).json({
        exam: completeExam,
        questionsCreated: createdQuestions.length,
        message: "Complete exam created successfully",
      });
    } catch (error) {
      console.error("Failed to create complete exam:", error);
      res.status(500).json({ error: "Failed to create complete exam" });
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
        relations: ["sector"],
        order: { createdAt: "DESC" },
      });

      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get exams" });
    }
  }

  static async getExamById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const exam = await examRepository.findOne({
        where: { id: req.params.id },
        relations: ["sector", "questions", "questions.options"],
      });

      if (!exam) {
        res.status(404).json({ error: "Exam not found" });
        return;
      }

      res.json(exam);
    } catch (error) {
      res.status(500).json({ error: "Failed to get exam" });
    }
  }

  static async updateExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const exam = await examRepository.findOne({
        where: { id: req.params.id },
      });

      if (!exam) {
        res.status(404).json({ error: "Exam not found" });
        return;
      }

      examRepository.merge(exam, req.body);
      const updatedExam = await examRepository.save(exam);
      res.json(updatedExam);
    } catch (error) {
      res.status(500).json({ error: "Failed to update exam" });
    }
  }

  static async deleteExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const exam = await examRepository.findOne({
        where: { id: req.params.id },
      });

      if (!exam) {
        res.status(404).json({ error: "Exam not found" });
        return;
      }

      await AppDataSource.transaction(async (manager) => {
        const trxExamRepo = manager.getRepository(Exam);
        const trxQuestionRepo = manager.getRepository(Question);
        const trxOptionRepo = manager.getRepository(QuestionOption);
        const trxUserAnswerRepo = manager.getRepository(UserAnswer);

        // Get all questions for this exam
        const questions = await trxQuestionRepo.find({
          where: { examId: exam.id },
        });

        const questionIds = questions.map((q) => q.id);

        // Delete user answers for this exam (they have examId directly)
        await trxUserAnswerRepo.delete({ examId: exam.id });

        // Delete question options for all questions in this exam
        if (questionIds.length > 0) {
          await trxOptionRepo.delete({ questionId: In(questionIds) });
        }

        // Delete all questions for this exam
        if (questionIds.length > 0) {
          await trxQuestionRepo.delete({ examId: exam.id });
        }

        // Finally delete the exam
        await trxExamRepo.delete({ id: exam.id });
      });

      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete exam:", error);
      res.status(500).json({ error: "Failed to delete exam" });
    }
  }

  static async getExamsBySector(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { sectorId } = req.params;

      const exams = await examRepository.find({
        where: { sectorId, isActive: true },
        relations: ["sector"],
        order: { createdAt: "DESC" },
      });

      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get exams by sector" });
    }
  }

  static async completeExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const { id } = req.params;

      const exam = await examRepository.findOne({
        where: { id },
      });

      if (!exam) {
        res.status(404).json({ error: "Exam not found" });
        return;
      }

      // Mark exam as completed
      exam.isCompleted = true;
      const updatedExam = await examRepository.save(exam);

      res.json(updatedExam);
    } catch (error) {
      console.error("Failed to complete exam:", error);
      res.status(500).json({ error: "Failed to complete exam" });
    }
  }

  static async resetExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const { id } = req.params;

      const exam = await examRepository.findOne({
        where: { id },
      });

      if (!exam) {
        res.status(404).json({ error: "Exam not found" });
        return;
      }

      // Get current user
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email,
        req.user.name,
        req.user.picture
      );

      // Delete this user's answers for this exam
      await userAnswerRepository.delete({
        userId: user.id,
        examId: exam.id,
      });

      // Reset global exam flags
      exam.isCompleted = false;
      exam.hasPassed = false;
      const updatedExam = await examRepository.save(exam);

      res.json({
        message: "Exam reset successfully",
        exam: updatedExam,
      });
    } catch (error) {
      console.error("Failed to reset exam:", error);
      res.status(500).json({ error: "Failed to reset exam" });
    }
  }
}
