-- PostgreSQL enum type: use snake_case name in the database (Prisma `@@map("user_role")`).
ALTER TYPE "Role" RENAME TO user_role;
