import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Question } from "../entities/Question";
import { QuestionOption } from "../entities/QuestionOption";
import { UserAnswer } from "../entities/UserAnswer";
import { AuthRequest } from "../middleware/auth";
import { In } from "typeorm";

const questionRepository = AppDataSource.getRepository(Question);
const optionRepository = AppDataSource.getRepository(QuestionOption);
// const userAnswerRepository = AppDataSource.getRepository(UserAnswer);

export class QuestionController {
  static async createQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const question = questionRepository.create({
        text: req.body.text,
        imageUrl: req.body.imageUrl,
        examId: req.body.examId,
        subjectId: req.body.subjectId,
        subjectValue: req.body.subjectValue,
        examPart: req.body.examPart,
        parentId: req.body.parentId,
        displayText: req.body.displayText,
        description: req.body.description,
        orderNumber: req.body.orderNumber,
        points: req.body.points ?? 1,
        isActive: req.body.isActive ?? true,
        isComplex: req.body.isComplex ?? false,
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
        relations: ["options", "subject"],
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
        relations: ["options", "subject"],
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
        relations: ["options", "subject"],
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
        const trxUserAnswerRepo = manager.getRepository(UserAnswer);

        const existing = await trxQuestionRepo.findOne({
          where: { id: req.params.id },
        });

        if (!existing) {
          return { notFound: true } as any;
        }

        trxQuestionRepo.merge(existing, questionData);
        const saved = await trxQuestionRepo.save(existing);

        if (Array.isArray(incomingOptions)) {
          // Fetch existing options for this question
          const existingOptions = await trxOptionRepo.find({
            where: { questionId: saved.id },
          });

          // Create a map of existing options by optionLetter
          const existingOptionsMap = new Map(
            existingOptions.map((opt) => [opt.optionLetter, opt])
          );

          // Track which option IDs are in the incoming list
          const incomingOptionLetters = new Set(
            incomingOptions.map((opt: any) => opt.optionLetter)
          );

          // Update or create options
          const optionPromises = incomingOptions.map(
            async (incomingOption: any) => {
              const existingOption = existingOptionsMap.get(
                incomingOption.optionLetter
              );

              if (existingOption) {
                // Update existing option
                trxOptionRepo.merge(existingOption, {
                  text: incomingOption.text,
                  imageUrl: incomingOption.imageUrl,
                  isCorrect: incomingOption.isCorrect,
                });
                return await trxOptionRepo.save(existingOption);
              } else {
                // Create new option
                const newOption = trxOptionRepo.create({
                  text: incomingOption.text,
                  imageUrl: incomingOption.imageUrl,
                  questionId: saved.id,
                  optionLetter: incomingOption.optionLetter,
                  isCorrect: incomingOption.isCorrect,
                });
                return await trxOptionRepo.save(newOption);
              }
            }
          );

          await Promise.all(optionPromises);

          // Find options that should be deleted (not in incoming list)
          const optionsToDelete = existingOptions.filter(
            (opt) => !incomingOptionLetters.has(opt.optionLetter)
          );

          if (optionsToDelete.length > 0) {
            const optionIdsToDelete = optionsToDelete.map((opt) => opt.id);

            // Check which options are referenced by user_answers
            const referencedOptions = await trxUserAnswerRepo.find({
              where: { selectedOptionId: In(optionIdsToDelete) },
              select: ["selectedOptionId"],
            });

            const referencedOptionIds = new Set(
              referencedOptions.map((answer) => answer.selectedOptionId)
            );

            // Only delete options that are not referenced by user_answers
            const safeToDeleteIds = optionIdsToDelete.filter(
              (id) => !referencedOptionIds.has(id)
            );

            if (safeToDeleteIds.length > 0) {
              await trxOptionRepo.delete({ id: In(safeToDeleteIds) });
            }
          }
        }

        const reloaded = await trxQuestionRepo.findOne({
          where: { id: saved.id },
          relations: ["options", "subject"],
        });

        return { entity: reloaded };
      });

      if ((result as any).notFound) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      res.json((result as any).entity);
    } catch (error) {
      console.error("Failed to update question:", error);
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

      await AppDataSource.transaction(async (manager) => {
        const trxUserAnswerRepo = manager.getRepository(UserAnswer);
        const trxOptionRepo = manager.getRepository(QuestionOption);
        const trxQuestionRepo = manager.getRepository(Question);

        // First, delete all user answers for this question
        await trxUserAnswerRepo.delete({ questionId: question.id });

        // Then delete all options for this question
        await trxOptionRepo.delete({ questionId: question.id });

        // Finally, delete the question itself
        await trxQuestionRepo.delete({ id: question.id });
      });

      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  }

  static async getQuestionsBySubject(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { examId, subjectId } = req.params;

      const questions = await questionRepository.find({
        where: { examId, subjectId, isActive: true },
        relations: ["options", "subject"],
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
        relations: ["options", "subject"],
        order: { orderNumber: "ASC" },
      });

      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get questions by exam part" });
    }
  }
}
