import { Response } from "express";
import { AppDataSource } from "../config/database";
import { UserAnswer } from "../entities/UserAnswer";
import { User } from "../entities/User";
import { QuestionOption } from "../entities/QuestionOption";
import { AuthRequest } from "../middleware/auth";
import { getOrCreateUser } from "./UserController";

const userAnswerRepository = AppDataSource.getRepository(UserAnswer);
const userRepository = AppDataSource.getRepository(User);
const optionRepository = AppDataSource.getRepository(QuestionOption);

export class UserAnswerController {
  static async submitAnswer(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email,
        req.user.name,
        req.user.picture
      );

      const selectedOption = await optionRepository.findOne({
        where: { id: req.body.selectedOptionId },
      });

      if (!selectedOption) {
        res.status(404).json({ error: "Selected option not found" });
        return;
      }

      const existingAnswer = await userAnswerRepository.findOne({
        where: {
          userId: user.id,
          examId: req.body.examId,
          questionId: req.body.questionId,
        },
      });

      let savedAnswer;

      if (existingAnswer) {
        // Update existing answer to allow resubmission
        userAnswerRepository.merge(existingAnswer, {
          selectedOptionId: req.body.selectedOptionId,
          isCorrect: selectedOption.isCorrect,
          pointsEarned: selectedOption.isCorrect ? req.body.points || 1 : 0,
          timeSpentSeconds: req.body.timeSpentSeconds || 0,
        });

        savedAnswer = await userAnswerRepository.save(existingAnswer);
        res.status(200).json(savedAnswer);
      } else {
        // Create new answer
        const userAnswer = userAnswerRepository.create({
          userId: user.id,
          examId: req.body.examId,
          questionId: req.body.questionId,
          selectedOptionId: req.body.selectedOptionId,
          isCorrect: selectedOption.isCorrect,
          pointsEarned: selectedOption.isCorrect ? req.body.points || 1 : 0,
          timeSpentSeconds: req.body.timeSpentSeconds || 0,
        });

        savedAnswer = await userAnswerRepository.save(userAnswer);
        res.status(201).json(savedAnswer);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to submit answer" });
    }
  }

  static async getUserAnswers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email,
        req.user.name,
        req.user.picture
      );

      const { examId } = req.query;
      const where: any = { userId: user.id };

      if (examId) {
        where.examId = examId;
      }

      const userAnswers = await userAnswerRepository.find({
        where,
        relations: ["question", "selectedOption", "exam"],
        order: { createdAt: "ASC" },
      });

      res.json(userAnswers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user answers" });
    }
  }

  static async getExamResults(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email,
        req.user.name,
        req.user.picture
      );

      const { examId } = req.params;

      const userAnswers = await userAnswerRepository.find({
        where: { userId: user.id, examId },
        relations: ["question", "selectedOption"],
      });

      const totalQuestions = userAnswers.length;
      const correctAnswers = userAnswers.filter(
        (answer) => answer.isCorrect
      ).length;
      const totalPoints = userAnswers.reduce(
        (sum, answer) => sum + answer.pointsEarned,
        0
      );
      const totalTimeSpent = userAnswers.reduce(
        (sum, answer) => sum + answer.timeSpentSeconds,
        0
      );

      const results = {
        examId,
        totalQuestions,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        accuracy:
          totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        totalPoints,
        totalTimeSpent,
        answers: userAnswers,
      };

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to get exam results" });
    }
  }

  static async updateAnswer(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const userAnswer = await userAnswerRepository.findOne({
        where: { id: req.params.id },
        relations: ["user"],
      });

      if (!userAnswer) {
        res.status(404).json({ error: "Answer not found" });
        return;
      }

      if (userAnswer.user.firebaseUid !== req.user.uid) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const selectedOption = await optionRepository.findOne({
        where: { id: req.body.selectedOptionId },
      });

      if (!selectedOption) {
        res.status(404).json({ error: "Selected option not found" });
        return;
      }

      userAnswerRepository.merge(userAnswer, {
        selectedOptionId: req.body.selectedOptionId,
        isCorrect: selectedOption.isCorrect,
        pointsEarned: selectedOption.isCorrect ? req.body.points || 1 : 0,
        timeSpentSeconds:
          req.body.timeSpentSeconds || userAnswer.timeSpentSeconds,
      });

      const updatedAnswer = await userAnswerRepository.save(userAnswer);
      res.json(updatedAnswer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update answer" });
    }
  }
}
