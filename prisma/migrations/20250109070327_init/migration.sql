/*
  Warnings:

  - You are about to drop the column `shiftEndDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `shiftStartDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ShiftNotification` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ShiftNotification] DROP CONSTRAINT [ShiftNotification_attendantId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[ShiftNotification] DROP CONSTRAINT [ShiftNotification_supervisorId_fkey];

-- AlterTable
ALTER TABLE [dbo].[User] DROP COLUMN [shiftEndDate],
[shiftStartDate];

-- DropTable
DROP TABLE [dbo].[ShiftNotification];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
