/*
  Warnings:

  - You are about to drop the `CalendarEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_buildTeamId_fkey";

-- AlterTable
ALTER TABLE "BuildTeam" ADD COLUMN     "supportsBedrock" BOOLEAN DEFAULT false;

-- DropTable
DROP TABLE "CalendarEvent";
