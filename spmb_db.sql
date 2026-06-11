-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 08 Jun 2026 pada 17.29
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `spmb_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `pendaftaran`
--

CREATE TABLE `pendaftaran` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `namaLengkap` varchar(191) NOT NULL,
  `namaPanggilan` varchar(191) DEFAULT NULL,
  `ttl` varchar(191) DEFAULT NULL,
  `jenisKelamin` varchar(191) NOT NULL,
  `alamat` text NOT NULL,
  `agama` varchar(191) NOT NULL,
  `namaOrtu` varchar(191) DEFAULT NULL,
  `noOrtu` varchar(191) DEFAULT NULL,
  `noPribadi` varchar(191) DEFAULT NULL,
  `jurusan` varchar(191) NOT NULL,
  `asalSekolah` varchar(191) DEFAULT NULL,
  `nisn` varchar(191) DEFAULT NULL,
  `nik` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'pending',
  `nilaiSeleksi` double DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `alamatAyah` text DEFAULT NULL,
  `alamatIbu` text DEFAULT NULL,
  `alamatWali` text DEFAULT NULL,
  `anakKe` varchar(191) DEFAULT NULL,
  `asalSD` varchar(191) DEFAULT NULL,
  `asalSMP` varchar(191) DEFAULT NULL,
  `beratBadan` varchar(191) DEFAULT NULL,
  `golonganDarah` varchar(191) DEFAULT NULL,
  `kabupaten` varchar(191) DEFAULT NULL,
  `kecamatan` varchar(191) DEFAULT NULL,
  `kelurahan` varchar(191) DEFAULT NULL,
  `namaAyah` varchar(191) DEFAULT NULL,
  `namaIbu` varchar(191) DEFAULT NULL,
  `namaPemberiReferensi` varchar(191) DEFAULT NULL,
  `namaWali` varchar(191) DEFAULT NULL,
  `noHpAyah` varchar(191) DEFAULT NULL,
  `noHpIbu` varchar(191) DEFAULT NULL,
  `noHpReferensi` varchar(191) DEFAULT NULL,
  `noHpWali` varchar(191) DEFAULT NULL,
  `pekerjaanAyah` varchar(191) DEFAULT NULL,
  `pekerjaanIbu` varchar(191) DEFAULT NULL,
  `pekerjaanWali` varchar(191) DEFAULT NULL,
  `pendidikanAyah` varchar(191) DEFAULT NULL,
  `pendidikanIbu` varchar(191) DEFAULT NULL,
  `pendidikanWali` varchar(191) DEFAULT NULL,
  `penghasilanAyah` varchar(191) DEFAULT NULL,
  `penghasilanIbu` varchar(191) DEFAULT NULL,
  `penghasilanWali` varchar(191) DEFAULT NULL,
  `rt` varchar(191) DEFAULT NULL,
  `rw` varchar(191) DEFAULT NULL,
  `tanggalLahir` varchar(191) DEFAULT NULL,
  `tempatLahir` varchar(191) DEFAULT NULL,
  `tinggiBadan` varchar(191) DEFAULT NULL,
  `ttlAyah` varchar(191) DEFAULT NULL,
  `ttlIbu` varchar(191) DEFAULT NULL,
  `ttlWali` varchar(191) DEFAULT NULL,
  `ukuranSeragam` varchar(191) DEFAULT NULL,
  `fileAkte` varchar(191) DEFAULT NULL,
  `fileFoto` varchar(191) DEFAULT NULL,
  `fileIjazah` varchar(191) DEFAULT NULL,
  `fileKK` varchar(191) DEFAULT NULL,
  `fileKip` varchar(191) DEFAULT NULL,
  `fileKtpOrtu` varchar(191) DEFAULT NULL,
  `alasanPenolakan` text DEFAULT NULL,
  `infoTes` text DEFAULT NULL,
  `jadwalTes` varchar(191) DEFAULT NULL,
  `lastRevisiAt` datetime(3) DEFAULT NULL,
  `lokasiTes` varchar(191) DEFAULT NULL,
  `pesanPengumuman` text DEFAULT NULL,
  `revisiCount` int(11) NOT NULL DEFAULT 0,
  `catatanDaftarUlang` varchar(191) DEFAULT NULL,
  `nilaiTes` double DEFAULT NULL,
  `sudahDaftarUlang` tinyint(1) NOT NULL DEFAULT 0,
  `tanggalDaftarUlang` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'user',
  `namaLengkap` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `user`
--

INSERT INTO `user` (`id`, `email`, `password`, `role`, `namaLengkap`, `createdAt`, `updatedAt`) VALUES
('admin001', 'admin@smkcitranegara.sch.id', '$2b$10$nnmRh/cjtXmOY3HIZgwZjuviITrvyKPoh9MKziFSyJOXhAMcKvukC', 'admin', 'Administrator', '2026-05-24 11:38:36.000', '2026-05-24 11:38:36.000');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `pendaftaran`
--
ALTER TABLE `pendaftaran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Pendaftaran_userId_key` (`userId`);

--
-- Indeks untuk tabel `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `pendaftaran`
--
ALTER TABLE `pendaftaran`
  ADD CONSTRAINT `Pendaftaran_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
