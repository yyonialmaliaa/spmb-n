-- CreateTable
CREATE TABLE "MutasiPendaftar" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "dariJenjang" TEXT NOT NULL,
    "dariJurusan" TEXT,
    "dariKelas" TEXT,
    "keJenjang" TEXT NOT NULL,
    "keJurusan" TEXT,
    "keKelas" TEXT NOT NULL,
    "noPendaftaranLama" TEXT,
    "noPendaftaranBaru" TEXT NOT NULL,
    "tagihanLama" INTEGER,
    "tagihanBaru" INTEGER NOT NULL,
    "dibayarSaatMutasi" INTEGER NOT NULL,
    "alasan" TEXT NOT NULL,
    "diprosesOlehId" TEXT,
    "diprosesOlehNama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MutasiPendaftar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MutasiPendaftar_pendaftaranId_createdAt_idx" ON "MutasiPendaftar"("pendaftaranId", "createdAt");

-- CreateIndex
CREATE INDEX "MutasiPendaftar_noPendaftaranLama_idx" ON "MutasiPendaftar"("noPendaftaranLama");

-- AddForeignKey
ALTER TABLE "MutasiPendaftar" ADD CONSTRAINT "MutasiPendaftar_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "Pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

