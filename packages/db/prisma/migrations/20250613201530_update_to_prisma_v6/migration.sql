-- AlterTable
ALTER TABLE "_builders" ADD CONSTRAINT "_builders_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_builders_AB_unique";

-- AlterTable
ALTER TABLE "_members" ADD CONSTRAINT "_members_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_members_AB_unique";
