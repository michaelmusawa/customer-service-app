/*
  Warnings:

  - Added the required column `ticket` to the `Record` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `Record` required. This step will fail if there are existing NULL values in that column.
  - Made the column `invoice` on table `Record` required. This step will fail if there are existing NULL values in that column.
  - Made the column `counter` on table `Record` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shift` on table `Record` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Record" ADD COLUMN     "ticket" TEXT NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "invoice" SET NOT NULL,
ALTER COLUMN "counter" SET NOT NULL,
ALTER COLUMN "shift" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
