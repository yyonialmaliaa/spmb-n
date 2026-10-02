-- Pas foto boleh berlatar merah atau biru.
UPDATE "DokumenPersyaratan"
SET "nama" = REPLACE("nama", '(Kode Warna #0000FF)', '(Kode Warna #FF0000 atau #0000FF)')
WHERE "nama" LIKE '%(Kode Warna #0000FF)%';
