import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Sector } from "../entities/Sector";
import { Exam } from "../entities/Exam";
import { Question } from "../entities/Question";
import { QuestionOption } from "../entities/QuestionOption";
import { UserAnswer } from "../entities/UserAnswer";
import { runSeeds } from "./seedData";
import dotenv from "dotenv";

dotenv.config();

const isDevelopment = process.env.NODE_ENV === "development";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "password",
  database: process.env.DATABASE_NAME || "etesti_db",
  synchronize: isDevelopment,
  logging: isDevelopment,
  entities: [User, Sector, Exam, Question, QuestionOption, UserAnswer],
  subscribers: [],
  migrations: isDevelopment
    ? ["src/migrations/*.ts"]
    : ["dist/migrations/*.js"],
  migrationsTableName: "migrations",
  migrationsRun: !isDevelopment,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established");

    if (isDevelopment) {
      await runSeeds();
    }
  } catch (error) {
    console.error("Database connection failed: ", error);
    process.exit(1);
  }
};
