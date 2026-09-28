-- AlterTable
ALTER TABLE "categories_sub" ADD COLUMN "start_date" TIMESTAMP(3) NOT NULL DEFAULT '0001-01-01 00:00:00'::timestamp,
ADD COLUMN "end_date" TIMESTAMP(3) NOT NULL DEFAULT '9999-12-31 23:59:59'::timestamp;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN "stage_id" UUID;

-- CreateTable
CREATE TABLE "category_stages" (
    "id" UUID NOT NULL,
    "sub_category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT DEFAULT '#3B82F6',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_stages_sub_category_id_sequence_idx" ON "category_stages"("sub_category_id", "sequence");

-- CreateIndex
CREATE INDEX "schedules_stage_id_idx" ON "schedules"("stage_id");

-- AddForeignKey
ALTER TABLE "category_stages" ADD CONSTRAINT "category_stages_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "categories_sub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "category_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
