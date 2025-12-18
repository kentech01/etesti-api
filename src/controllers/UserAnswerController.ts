import { Response } from "express";
import { AppDataSource } from "../config/database";
import { UserAnswer } from "../entities/UserAnswer";
import { Exam } from "../entities/Exam";
import { QuestionOption } from "../entities/QuestionOption";
import { Question } from "../entities/Question";
import { AuthRequest } from "../middleware/auth";
import { getOrCreateUser } from "./UserController";

const userAnswerRepository = AppDataSource.getRepository(UserAnswer);
const optionRepository = AppDataSource.getRepository(QuestionOption);
const questionRepository = AppDataSource.getRepository(Question);
const examRepository = AppDataSource.getRepository(Exam);

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

      // Check for existing answer for THIS SPECIFIC option
      // This allows multiple options to be selected for the same question
      const existingAnswer = await userAnswerRepository.findOne({
        where: {
          userId: user.id,
          examId: req.body.examId,
          questionId: req.body.questionId,
          selectedOptionId: req.body.selectedOptionId,
        },
      });

      let savedAnswer;

      if (existingAnswer) {
        // Update existing answer for this specific option
        userAnswerRepository.merge(existingAnswer, {
          isCorrect: selectedOption.isCorrect,
          pointsEarned: selectedOption.isCorrect ? req.body.points || 1 : 0,
          timeSpentSeconds: req.body.timeSpentSeconds || 0,
        });

        savedAnswer = await userAnswerRepository.save(existingAnswer);
        res.status(200).json(savedAnswer);
      } else {
        // Create new answer for this option
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

      // Get total number of questions in the exam
      const totalQuestions = await questionRepository.count({
        where: { examId, isActive: true },
      });

      // Get all user answers for this exam
      const userAnswers = await userAnswerRepository.find({
        where: { userId: user.id, examId },
        relations: ["question", "selectedOption"],
      });

      // Get all questions with their correct options
      const questions = await questionRepository.find({
        where: { examId, isActive: true },
        relations: ["options"],
      });

      // Create a map of questionId -> correct option IDs
      const correctOptionsByQuestion = new Map<string, Set<string>>();
      questions.forEach((question) => {
        const correctOptionIds = new Set(
          question.options
            .filter((option) => option.isCorrect)
            .map((option) => option.id)
        );
        correctOptionsByQuestion.set(question.id, correctOptionIds);
      });

      // Group user answers by questionId
      const answersByQuestion = new Map<string, UserAnswer[]>();
      userAnswers.forEach((answer) => {
        const questionId = answer.questionId;
        if (!answersByQuestion.has(questionId)) {
          answersByQuestion.set(questionId, []);
        }
        answersByQuestion.get(questionId)!.push(answer);
      });

      // Evaluate each question
      let correctAnswers = 0;
      const totalPoints = userAnswers.reduce(
        (sum, answer) => sum + answer.pointsEarned,
        0
      );
      const totalTimeSpent = userAnswers.reduce(
        (sum, answer) => sum + answer.timeSpentSeconds,
        0
      );

      questions.forEach((question) => {
        const correctOptionIds = correctOptionsByQuestion.get(question.id);
        const userAnswersForQuestion = answersByQuestion.get(question.id) || [];

        if (!correctOptionIds || correctOptionIds.size === 0) {
          // No correct options defined, skip this question
          return;
        }

        // Get the option IDs selected by the user for this question
        const selectedOptionIds = new Set(
          userAnswersForQuestion.map((answer) => answer.selectedOptionId)
        );

        // Check if user selected ALL correct options
        const hasAllCorrectOptions = Array.from(correctOptionIds).every(
          (correctOptionId) => selectedOptionIds.has(correctOptionId)
        );

        // Check if user selected NO incorrect options
        // (i.e., all selected options are correct)
        const hasNoIncorrectOptions = Array.from(selectedOptionIds).every(
          (selectedOptionId) => correctOptionIds.has(selectedOptionId)
        );

        // Question is correct only if both conditions are met
        if (hasAllCorrectOptions && hasNoIncorrectOptions) {
          correctAnswers++;
        }
      });

      const incorrectAnswers = totalQuestions - correctAnswers;
      const accuracy =
        totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      const results = {
        examId,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        accuracy,
        // Per-user pass flag (do NOT persist on the Exam entity so it doesn’t leak across users)
        hasPassed: accuracy >= 40,
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
