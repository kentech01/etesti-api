import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sectors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "displayName" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_sectors_name" UNIQUE ("name"), CONSTRAINT "PK_sectors" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firebaseUid" character varying NOT NULL, "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "avatarUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_firebaseUid" UNIQUE ("firebaseUid"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `CREATE TABLE "exams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "sectorId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "isCompleted" boolean NOT NULL DEFAULT false, "hasPassed" boolean NOT NULL DEFAULT false, "totalQuestions" integer NOT NULL DEFAULT '0', "passingScore" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_exams" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "imageUrl" character varying, "examId" uuid NOT NULL, "subject" character(20) NOT NULL, "examPart" character(1) NOT NULL DEFAULT 'A', "parentId" uuid, "displayText" text, "description" text, "orderNumber" integer NOT NULL, "points" integer NOT NULL DEFAULT '1', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_questions" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `CREATE TABLE "question_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "imageUrl" character varying, "questionId" uuid NOT NULL, "optionLetter" character(1) NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_question_options" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `CREATE TABLE "user_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "examId" uuid NOT NULL, "questionId" uuid NOT NULL, "selectedOptionId" uuid NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "pointsEarned" integer NOT NULL DEFAULT '0', "timeSpentSeconds" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_answers" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_exams_sector" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_questions_exam" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "question_options" ADD CONSTRAINT "FK_options_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "user_answers" ADD CONSTRAINT "FK_answers_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "user_answers" ADD CONSTRAINT "FK_answers_exam" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "user_answers" ADD CONSTRAINT "FK_answers_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "user_answers" ADD CONSTRAINT "FK_answers_option" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_answers" DROP CONSTRAINT "FK_answers_option"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_answers" DROP CONSTRAINT "FK_answers_question"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_answers" DROP CONSTRAINT "FK_answers_exam"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_answers" DROP CONSTRAINT "FK_answers_user"`
    );
    await queryRunner.query(
      `ALTER TABLE "question_options" DROP CONSTRAINT "FK_options_question"`
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_questions_exam"`
    );
    await queryRunner.query(
      `ALTER TABLE "exams" DROP CONSTRAINT "FK_exams_sector"`
    );
    await queryRunner.query(`DROP TABLE "user_answers"`);
    await queryRunner.query(`DROP TABLE "question_options"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "exams"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "sectors"`);
  }
}
