# Database Migration Guide

## 🔄 **How Database Migrations Work**

### **Development Mode (Automatic)**
When `NODE_ENV=development`, TypeORM automatically:
- ✅ Creates new tables for new entities
- ✅ Adds new columns to existing tables
- ✅ Updates column types and constraints
- ✅ **WARNING**: This can cause data loss!

### **Production Mode (Manual)**
When `NODE_ENV=production`, TypeORM:
- ❌ Ignores entity changes
- ✅ Only runs existing migrations
- ✅ Preserves data integrity

## 🚀 **Migration Workflow**

### **1. Make Entity Changes**
Edit your entity files (add/remove columns, change types, etc.)

### **2. Generate Migration**
```bash
npm run migration:generate -- src/migrations/AddNewField
```

### **3. Review Migration**
Check the generated migration file in `src/migrations/`

### **4. Run Migration**
```bash
npm run migration:run
```

### **5. Deploy**
The migration runs automatically in production

## 📝 **Example: Adding a New Field**

### **Step 1: Update Entity**
```typescript
// src/entities/User.ts
@Entity('users')
export class User {
    // ... existing fields
    
    @Column({ nullable: true })
    phoneNumber: string; // NEW FIELD
}
```

### **Step 2: Generate Migration**
```bash
npm run migration:generate -- src/migrations/AddPhoneNumberToUser
```

### **Step 3: Generated Migration File**
```typescript
// src/migrations/1234567890-AddPhoneNumberToUser.ts
export class AddPhoneNumberToUser1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
    }
}
```

### **Step 4: Run Migration**
```bash
npm run migration:run
```

## 🛠 **Available Commands**

```bash
# Generate new migration
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Drop entire schema (DANGEROUS!)
npm run schema:drop
```

## ⚠️ **Important Notes**

### **Data Safety**
- **Development**: `synchronize: true` - Automatic, risky
- **Production**: `synchronize: false` - Manual, safe

### **Migration Best Practices**
1. **Always backup** before running migrations
2. **Test migrations** in development first
3. **Review generated SQL** before running
4. **Use descriptive names** for migrations
5. **Never edit** generated migration files manually

### **Common Scenarios**

#### **Adding New Entity**
```bash
# 1. Create entity file
# 2. Add to database.ts entities array
# 3. Generate migration
npm run migration:generate -- src/migrations/CreateNewEntity
# 4. Run migration
npm run migration:run
```

#### **Modifying Existing Entity**
```bash
# 1. Update entity file
# 2. Generate migration
npm run migration:generate -- src/migrations/ModifyEntity
# 3. Run migration
npm run migration:run
```

#### **Removing Entity/Field**
```bash
# 1. Remove from entity file
# 2. Generate migration
npm run migration:generate -- src/migrations/RemoveEntity
# 3. Run migration
npm run migration:run
```

## 🔍 **Troubleshooting**

### **Migration Fails**
```bash
# Check migration status
npm run typeorm migration:show -- -d src/config/database.ts

# Revert last migration
npm run migration:revert

# Check database logs
# Verify entity syntax
```

### **Schema Out of Sync**
```bash
# In development only:
npm run schema:drop
npm run dev  # This will recreate everything
```

### **Production Issues**
- Check migration logs
- Verify database permissions
- Ensure migrations run in correct order
- Test migrations in staging environment first

## 📚 **Migration File Structure**

```typescript
export class MigrationName1234567890 implements MigrationInterface {
    name = 'MigrationName1234567890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Changes to apply
        await queryRunner.query(`SQL STATEMENT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // How to reverse changes
        await queryRunner.query(`REVERSE SQL STATEMENT`);
    }
}
```

## 🎯 **Summary**

- **Development**: Use `synchronize: true` for quick prototyping
- **Production**: Always use migrations for schema changes
- **Workflow**: Entity change → Generate migration → Review → Run → Deploy
- **Safety**: Migrations preserve data, synchronize can destroy it
