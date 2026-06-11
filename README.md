# SPMB Online

Sistem Penerimaan Murid Baru (SPMB) berbasis web menggunakan Next.js, TypeScript, Prisma ORM, dan MySQL.

Repository:

https://github.com/yyonialmaliaa/spmb

---

## Fitur

* Landing Page SPMB
* Informasi Jurusan
* Informasi Ekstrakurikuler
* Informasi Prestasi Sekolah
* Form Pendaftaran Online
* Login Admin
* Dashboard Admin
* Kelola Data Pendaftar
* Kelola Jurusan
* Kelola Prestasi
* Kelola Ekstrakurikuler

---

## Teknologi yang Digunakan

* Next.js
* React
* TypeScript
* Prisma ORM
* MySQL
* Tailwind CSS
* Vercel

---

## Persyaratan

Pastikan perangkat sudah terinstall:

* Node.js versi 18 atau lebih baru
* Git
* XAMPP
* Visual Studio Code (disarankan)

Cek versi Node.js dan NPM:

```bash
node -v
npm -v
```

---

## Mengambil Project dari GitHub

Clone repository:

```bash
git clone https://github.com/yyonialmaliaa/spmb.git
```

Masuk ke folder project:

```bash
cd spmb
```

---

## Install Dependency

```bash
npm install
```

---

## Setup Database

Jalankan Apache dan MySQL pada XAMPP.

Buka phpMyAdmin:

```txt
http://localhost/phpmyadmin
```

Buat database baru dengan nama:

```txt
spmb_db
```

---

## Konfigurasi Environment

Buat file `.env` pada root project.

Isi dengan:

```env
DATABASE_URL="mysql://root:@localhost:3306/spmb_db"

NEXTAUTH_SECRET="isi_dengan_secret"

NEXTAUTH_URL="http://localhost:3000"
```

Sesuaikan jika username, password, atau nama database berbeda.

---

## Setup Prisma

Generate Prisma Client:

```bash
npx prisma generate
```

Sinkronkan database:

```bash
npx prisma db push
```

Jika berhasil, seluruh tabel akan dibuat secara otomatis.

---

## Menjalankan Project

```bash
npm run dev
```

Buka browser:

```txt
http://localhost:3000
```

---

## Mengambil Update Terbaru

```bash
git pull origin main
```

---

## Upload Perubahan ke GitHub

Tambahkan perubahan:

```bash
git add .
```

Commit:

```bash
git commit -m "Perubahan terbaru"
```

Push ke GitHub:

```bash
git push origin main
```

---

## Perintah Git yang Sering Digunakan

Melihat status project:

```bash
git status
```

Melihat riwayat commit:

```bash
git log --oneline
```

Melihat remote repository:

```bash
git remote -v
```

---

## Developer

XI PPLG 1

1. Chantique Putri
2. Elang Saputra
3. Indah Wardani
4. Keisya Naila
5. Yoni Al'fiani

---


```txt
admin@smkcitranegara.sch.id
```


```txt
admin123
```

---

## Catatan

Project ini dibuat untuk kebutuhan Sistem Penerimaan Murid Baru (SPMB) dan Ujian Praktik SMK Citra Negara.
