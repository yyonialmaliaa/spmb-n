-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "namaLengkap" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "scopeJenjang" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT,
    "ringkasan" TEXT NOT NULL,
    "sebelum" JSONB,
    "sesudah" JSONB,
    "jenjang" TEXT,
    "tahunAjaranId" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TahunAjaran" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TahunAjaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Harga" (
    "id" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "jurusan" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Harga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diskon" (
    "id" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "tipeNominal" TEXT NOT NULL DEFAULT 'rupiah',
    "nominal" INTEGER NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Diskon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PengaturanKeuangan" (
    "id" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "minimalPembayaranAwal" INTEGER NOT NULL DEFAULT 200000,
    "minimalCicilan" INTEGER NOT NULL DEFAULT 100000,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PengaturanKeuangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gelombang" (
    "id" TEXT NOT NULL,
    "tahunAjaranId" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "untukAlumni" BOOLEAN NOT NULL DEFAULT false,
    "nama" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "tanggalMulai" TIMESTAMP(3),
    "tanggalSelesai" TIMESTAMP(3),
    "diskonPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gelombang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendaftaran" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tahunAjaranId" TEXT NOT NULL,
    "namaLengkap" TEXT,
    "namaPanggilan" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TEXT,
    "ttl" TEXT,
    "jenisKelamin" TEXT,
    "agama" TEXT,
    "anakKe" TEXT,
    "alamat" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "kelurahan" TEXT,
    "kecamatan" TEXT,
    "kabupaten" TEXT,
    "beratBadan" TEXT,
    "tinggiBadan" TEXT,
    "golonganDarah" TEXT,
    "nisn" TEXT,
    "nik" TEXT,
    "noPribadi" TEXT,
    "ukuranSeragam" TEXT,
    "namaPemberiReferensi" TEXT,
    "noHpReferensi" TEXT,
    "asalSD" TEXT,
    "asalSMP" TEXT,
    "asalSekolah" TEXT,
    "jurusan" TEXT,
    "jenjang" TEXT NOT NULL DEFAULT 'smk',
    "kelas" TEXT,
    "tipePendaftaran" TEXT NOT NULL DEFAULT 'baru',
    "kelasMasuk" TEXT,
    "sumberDaftar" TEXT NOT NULL DEFAULT 'online',
    "alumniSmpCitraNegara" BOOLEAN,
    "namaAyah" TEXT,
    "ttlAyah" TEXT,
    "pendidikanAyah" TEXT,
    "pekerjaanAyah" TEXT,
    "penghasilanAyah" TEXT,
    "noHpAyah" TEXT,
    "alamatAyah" TEXT,
    "namaIbu" TEXT,
    "ttlIbu" TEXT,
    "pendidikanIbu" TEXT,
    "pekerjaanIbu" TEXT,
    "penghasilanIbu" TEXT,
    "noHpIbu" TEXT,
    "alamatIbu" TEXT,
    "namaWali" TEXT,
    "ttlWali" TEXT,
    "pendidikanWali" TEXT,
    "pekerjaanWali" TEXT,
    "penghasilanWali" TEXT,
    "noHpWali" TEXT,
    "alamatWali" TEXT,
    "namaOrtu" TEXT,
    "noOrtu" TEXT,
    "jenisIjazah" TEXT,
    "fileIjazah" TEXT,
    "fileAkte" TEXT,
    "fileKK" TEXT,
    "fileKtpOrtu" TEXT,
    "fileKip" TEXT,
    "fileFoto" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "nilaiSeleksi" DOUBLE PRECISION,
    "catatan" TEXT,
    "alasanPenolakan" TEXT,
    "waVerified" BOOLEAN NOT NULL DEFAULT false,
    "hargaId" TEXT,
    "hargaPokok" INTEGER,
    "gelombangId" TEXT,
    "gelombang" TEXT,
    "gelombangDiskonNominal" INTEGER NOT NULL DEFAULT 0,
    "diskonId" TEXT,
    "diskonNominal" INTEGER NOT NULL DEFAULT 0,
    "totalTagihan" INTEGER,
    "totalTagihanLocked" BOOLEAN NOT NULL DEFAULT false,
    "metodePembayaran" TEXT,
    "buktiPembayaran" TEXT,
    "statusPembayaran" TEXT NOT NULL DEFAULT 'belum_bayar',
    "catatanPembayaran" TEXT,
    "tanggalBayar" TIMESTAMP(3),
    "revisiCount" INTEGER NOT NULL DEFAULT 0,
    "lastRevisiAt" TIMESTAMP(3),
    "pesanPengumuman" TEXT,
    "sudahDaftarUlang" BOOLEAN NOT NULL DEFAULT false,
    "tanggalDaftarUlang" TIMESTAMP(3),
    "catatanDaftarUlang" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diskonNama" TEXT,
    "lastStep" INTEGER,
    CONSTRAINT "Pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'bayar',
    "angsuranKe" INTEGER NOT NULL,
    "nominal" INTEGER NOT NULL,
    "metodePembayaran" TEXT NOT NULL,
    "buktiPembayaran" TEXT,
    "bankPengirim" TEXT,
    "namaPengirim" TEXT,
    "alasanRefund" TEXT,
    "status" TEXT NOT NULL DEFAULT 'menunggu_verifikasi',
    "catatanAdmin" TEXT,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalVerifikasi" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kategoriAlokasi" TEXT,
    CONSTRAINT "Pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id" TEXT NOT NULL,
    "pendaftaranId" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "dibaca" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DokumenPersyaratan" (
    "id" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'daftar_ulang',
    "jenis" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "fieldKey" TEXT,
    "wajib" BOOLEAN NOT NULL DEFAULT true,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT,
    "namaFile" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tahunAjaranId" TEXT NOT NULL,
    CONSTRAINT "DokumenPersyaratan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifikasiAdmin" (
    "id" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "peran" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tautan" TEXT,
    "jenjang" TEXT,
    "tahunAjaranId" TEXT,
    "entitas" TEXT,
    "entitasId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotifikasiAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifikasiAdminDibaca" (
    "id" TEXT NOT NULL,
    "notifikasiId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dibacaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotifikasiAdminDibaca_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "AuditLog_entitas_entitasId_createdAt_idx" ON "AuditLog"("entitas", "entitasId", "createdAt");
CREATE INDEX "AuditLog_tahunAjaranId_createdAt_idx" ON "AuditLog"("tahunAjaranId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE UNIQUE INDEX "TahunAjaran_nama_key" ON "TahunAjaran"("nama");
CREATE INDEX "Harga_tahunAjaranId_jenjang_idx" ON "Harga"("tahunAjaranId", "jenjang");
CREATE UNIQUE INDEX "Harga_tahunAjaranId_jenjang_jurusan_kelas_key" ON "Harga"("tahunAjaranId", "jenjang", "jurusan", "kelas");
CREATE INDEX "Diskon_tahunAjaranId_idx" ON "Diskon"("tahunAjaranId");
CREATE UNIQUE INDEX "PengaturanKeuangan_tahunAjaranId_key" ON "PengaturanKeuangan"("tahunAjaranId");
CREATE INDEX "Gelombang_tahunAjaranId_jenjang_untukAlumni_idx" ON "Gelombang"("tahunAjaranId", "jenjang", "untukAlumni");
CREATE UNIQUE INDEX "Pendaftaran_userId_key" ON "Pendaftaran"("userId");
CREATE INDEX "Pendaftaran_tahunAjaranId_jenjang_idx" ON "Pendaftaran"("tahunAjaranId", "jenjang");
CREATE INDEX "Notifikasi_pendaftaranId_createdAt_idx" ON "Notifikasi"("pendaftaranId", "createdAt");
CREATE INDEX "DokumenPersyaratan_tahunAjaranId_jenjang_kategori_aktif_idx" ON "DokumenPersyaratan"("tahunAjaranId", "jenjang", "kategori", "aktif");
CREATE UNIQUE INDEX "DokumenPersyaratan_tahunAjaranId_jenjang_kategori_jenis_key" ON "DokumenPersyaratan"("tahunAjaranId", "jenjang", "kategori", "jenis");
CREATE INDEX "NotifikasiAdmin_peran_createdAt_idx" ON "NotifikasiAdmin"("peran", "createdAt");
CREATE INDEX "NotifikasiAdmin_createdAt_idx" ON "NotifikasiAdmin"("createdAt");
CREATE INDEX "NotifikasiAdminDibaca_userId_idx" ON "NotifikasiAdminDibaca"("userId");
CREATE UNIQUE INDEX "NotifikasiAdminDibaca_notifikasiId_userId_key" ON "NotifikasiAdminDibaca"("notifikasiId", "userId");

ALTER TABLE "Harga" ADD CONSTRAINT "Harga_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Diskon" ADD CONSTRAINT "Diskon_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PengaturanKeuangan" ADD CONSTRAINT "PengaturanKeuangan_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Gelombang" ADD CONSTRAINT "Gelombang_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_diskonId_fkey" FOREIGN KEY ("diskonId") REFERENCES "Diskon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_gelombangId_fkey" FOREIGN KEY ("gelombangId") REFERENCES "Gelombang"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_hargaId_fkey" FOREIGN KEY ("hargaId") REFERENCES "Harga"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pendaftaran" ADD CONSTRAINT "Pendaftaran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "Pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_pendaftaranId_fkey" FOREIGN KEY ("pendaftaranId") REFERENCES "Pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DokumenPersyaratan" ADD CONSTRAINT "DokumenPersyaratan_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotifikasiAdminDibaca" ADD CONSTRAINT "NotifikasiAdminDibaca_notifikasiId_fkey" FOREIGN KEY ("notifikasiId") REFERENCES "NotifikasiAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
