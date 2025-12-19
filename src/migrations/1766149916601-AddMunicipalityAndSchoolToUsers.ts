import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMunicipalityAndSchoolToUsers1766149916601
  implements MigrationInterface
{
  name = "AddMunicipalityAndSchoolToUsers1766149916601";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "municipality" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "school" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "school"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "municipality"`);
  }
}

