-- Dokumen KIP/PKH/KKS/DTKS/SKTM tidak lagi menjadi persyaratan SPMB.
DELETE FROM "DokumenPersyaratan" WHERE "fieldKey" = 'fileKip' OR ("kategori" = 'pendaftaran' AND "jenis" = 'kip');

UPDATE "Pendaftaran" SET "validasiBerkas" = "validasiBerkas" - 'fileKip' WHERE ("validasiBerkas" -> 'fileKip') IS NOT NULL;

-- AlterTable
ALTER TABLE "Pendaftaran" DROP COLUMN "fileKip";
