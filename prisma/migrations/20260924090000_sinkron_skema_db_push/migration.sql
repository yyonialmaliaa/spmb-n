-- AlterTable
ALTER TABLE "Pendaftaran" ADD COLUMN     "noPendaftaran" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "tanggalLunas" TIMESTAMP(3),
ADD COLUMN     "validasiBerkas" JSONB;

-- CreateTable
CREATE TABLE "NomorUrutCounter" (
    "id" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "nilaiTerakhir" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NomorUrutCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NomorUrutCounter_tahunAjaranId_jenjang_key" ON "NomorUrutCounter"("tahunAjaranId", "jenjang");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftaran_noPendaftaran_key" ON "Pendaftaran"("noPendaftaran");

