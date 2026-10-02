-- CreateTable
CREATE TABLE "PraPendaftaran" (
    "id" TEXT NOT NULL,
    "noPraPendaftaran" TEXT NOT NULL,
    "tokenAkses" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "asalSekolah" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "jurusan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'menunggu',
    "batasKedatangan" TIMESTAMP(3) NOT NULL,
    "datangAt" TIMESTAMP(3),
    "dikonfirmasiOleh" TEXT,
    "diprosesAt" TIMESTAMP(3),
    "selesaiAt" TIMESTAMP(3),
    "pendaftaranId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PraPendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PraPendaftaranCounter" (
    "id" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "nilaiTerakhir" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PraPendaftaranCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PraPendaftaran_noPraPendaftaran_key" ON "PraPendaftaran"("noPraPendaftaran");

-- CreateIndex
CREATE UNIQUE INDEX "PraPendaftaran_tokenAkses_key" ON "PraPendaftaran"("tokenAkses");

-- CreateIndex
CREATE UNIQUE INDEX "PraPendaftaran_pendaftaranId_key" ON "PraPendaftaran"("pendaftaranId");

-- CreateIndex
CREATE INDEX "PraPendaftaran_tahunAjaranId_jenjang_status_idx" ON "PraPendaftaran"("tahunAjaranId", "jenjang", "status");

-- CreateIndex
CREATE INDEX "PraPendaftaran_status_batasKedatangan_idx" ON "PraPendaftaran"("status", "batasKedatangan");

-- CreateIndex
CREATE INDEX "PraPendaftaran_ipHash_createdAt_idx" ON "PraPendaftaran"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "PraPendaftaran_noHp_idx" ON "PraPendaftaran"("noHp");

-- CreateIndex
CREATE UNIQUE INDEX "PraPendaftaranCounter_tahunAjaranId_jenjang_key" ON "PraPendaftaranCounter"("tahunAjaranId", "jenjang");

-- AddForeignKey
ALTER TABLE "PraPendaftaran" ADD CONSTRAINT "PraPendaftaran_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PraPendaftaran" ADD CONSTRAINT "PraPendaftaran_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "Pendaftaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

