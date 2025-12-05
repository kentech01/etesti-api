import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToExams1764922816000 implements MigrationInterface {
  name = "AddSoftDeleteToExams1764922816000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exams" ADD "deletedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "deletedAt"`);
  }
}
