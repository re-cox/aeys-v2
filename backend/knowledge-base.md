## The column `Employee.departmentId` does not exist in the current database

Çözüm:
1. Bu hata, frontend ve backend arasındaki Prisma şemalarının senkronize olmamasından kaynaklanır.
2. Her iki şemayı karşılaştırarak farklılıkları belirleyin.
3. Backend tarafında şemayı güncelledikten sonra `npx prisma generate` komutunu çalıştırın.
4. Ardından `npx prisma db push` komutu ile veritabanını güncelleyin.
5. Eğer tablo veya sütun isimleri farklıysa, şemaların her ikisini de aynı isimlendirme standardına göre düzenlemeyi düşünün.
6. Sorun devam ederse, backend'in node_modules/.prisma ve node_modules/@prisma/client klasörlerini silip prisma generate işlemini tekrarlayın. 