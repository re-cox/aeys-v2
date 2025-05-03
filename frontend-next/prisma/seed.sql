-- Employee tablosunda userId alanını güncelleme
UPDATE "Employee" 
SET "userId" = id 
WHERE "userId" IS NULL;

-- Bu sorgu tüm çalışanların userId alanını kendi ID'leri ile doldurur
-- Böylece token'da id veya userId olarak gelen değer, Employee tablosundaki id veya userId ile eşleşecek 