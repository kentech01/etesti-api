import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsComplexToQuestions1765362424000 implements MigrationInterface {
  name = "AddIsComplexToQuestions1765362424000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "isComplex" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "isComplex"`);
  }
}

