import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertSubjectSectorToManyToMany1764925268000
  implements MigrationInterface
{
  name = "ConvertSubjectSectorToManyToMany1764925268000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create the junction table
    await queryRunner.query(
      `CREATE TABLE "subject_sectors" ("subjectId" uuid NOT NULL, "sectorId" uuid NOT NULL, CONSTRAINT "PK_subject_sectors" PRIMARY KEY ("subjectId", "sectorId"))`
    );

    // Step 2: Create foreign key constraints for the junction table
    await queryRunner.query(
      `ALTER TABLE "subject_sectors" ADD CONSTRAINT "FK_subject_sectors_subject" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_sectors" ADD CONSTRAINT "FK_subject_sectors_sector" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // Step 3: Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_subject_sectors_subject" ON "subject_sectors" ("subjectId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subject_sectors_sector" ON "subject_sectors" ("sectorId")`
    );

    // Step 4: Migrate existing data from subjects.sectorId to junction table
    await queryRunner.query(
      `INSERT INTO "subject_sectors" ("subjectId", "sectorId") 
       SELECT "id", "sectorId" FROM "subjects" WHERE "sectorId" IS NOT NULL`
    );

    // Step 5: Consolidate duplicate subjects (same value, different sectorId)
    // For each duplicate group, keep the first one and merge sector relationships
    await queryRunner.query(`
      WITH duplicates AS (
        SELECT 
          "value",
          "id",
          ROW_NUMBER() OVER (PARTITION BY "value" ORDER BY "createdAt" ASC) as rn
        FROM "subjects"
      ),
      subjects_to_keep AS (
        SELECT "id", "value" FROM duplicates WHERE rn = 1
      ),
      subjects_to_delete AS (
        SELECT d."id", d."value", stk."id" as keep_id
        FROM duplicates d
        JOIN subjects_to_keep stk ON d."value" = stk."value"
        WHERE d.rn > 1
      )
      -- Update questions to point to the kept subject
      UPDATE "questions" q
      SET "subjectId" = std.keep_id
      FROM subjects_to_delete std
      WHERE q."subjectId" = std."id"
    `);

    // Step 6: Merge sector relationships for duplicates (add sectors from deleted subjects to kept subjects)
    await queryRunner.query(`
      WITH duplicates AS (
        SELECT 
          "value",
          "id",
          ROW_NUMBER() OVER (PARTITION BY "value" ORDER BY "createdAt" ASC) as rn
        FROM "subjects"
      ),
      subjects_to_keep AS (
        SELECT "id", "value" FROM duplicates WHERE rn = 1
      ),
      subjects_to_delete AS (
        SELECT d."id", d."value", stk."id" as keep_id
        FROM duplicates d
        JOIN subjects_to_keep stk ON d."value" = stk."value"
        WHERE d.rn > 1
      )
      -- Insert sectors from deleted subjects into kept subjects (avoid duplicates)
      INSERT INTO "subject_sectors" ("subjectId", "sectorId")
      SELECT DISTINCT std.keep_id, ss."sectorId"
      FROM subjects_to_delete std
      JOIN "subject_sectors" ss ON ss."subjectId" = std."id"
      WHERE NOT EXISTS (
        SELECT 1 FROM "subject_sectors" existing
        WHERE existing."subjectId" = std.keep_id
        AND existing."sectorId" = ss."sectorId"
      )
    `);

    // Step 7: Delete duplicate subjects (keep only the first one for each value)
    await queryRunner.query(`
      WITH duplicates AS (
        SELECT 
          "id",
          ROW_NUMBER() OVER (PARTITION BY "value" ORDER BY "createdAt" ASC) as rn
        FROM "subjects"
      )
      DELETE FROM "subjects"
      WHERE "id" IN (
        SELECT "id" FROM duplicates WHERE rn > 1
      )
    `);

    // Step 8: Drop the old foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "FK_subjects_sector"`
    );

    // Step 9: Drop the old unique constraint on (value, sectorId)
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "UQ_subjects_value_sectorId"`
    );

    // Step 10: Drop the sectorId column
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP COLUMN IF EXISTS "sectorId"`
    );

    // Step 11: Add unique constraint on value only
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD CONSTRAINT "UQ_subjects_value" UNIQUE ("value")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add back the sectorId column
    await queryRunner.query(`ALTER TABLE "subjects" ADD "sectorId" uuid`);

    // Step 2: Migrate data back from junction table (take first sector for each subject)
    await queryRunner.query(
      `UPDATE "subjects" s
       SET "sectorId" = (
         SELECT "sectorId" 
         FROM "subject_sectors" ss 
         WHERE ss."subjectId" = s."id" 
         LIMIT 1
       )`
    );

    // Step 3: Add back foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD CONSTRAINT "FK_subjects_sector" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    // Step 4: Add back unique constraint on (value, sectorId)
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD CONSTRAINT "UQ_subjects_value_sectorId" UNIQUE ("value", "sectorId")`
    );

    // Step 5: Drop unique constraint on value only
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "UQ_subjects_value"`
    );

    // Step 6: Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_subject_sectors_sector"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_subject_sectors_subject"`
    );

    // Step 7: Drop foreign key constraints from junction table
    await queryRunner.query(
      `ALTER TABLE "subject_sectors" DROP CONSTRAINT IF EXISTS "FK_subject_sectors_sector"`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_sectors" DROP CONSTRAINT IF EXISTS "FK_subject_sectors_subject"`
    );

    // Step 8: Drop the junction table
    await queryRunner.query(`DROP TABLE "subject_sectors"`);
  }
}
