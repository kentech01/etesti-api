import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSectorToUsers1767000000000 implements MigrationInterface {
  name = "AddSectorToUsers1767000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "sectorId" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "sectorId"`);
  }
}
