# Knowledge Base

## [Marketing modülünde foreign key constraint "MarketingActivity_employeeId_fkey" hatası]

Çözüm: 
1. Bu hata, pazarlama aktivitesi oluştururken veya güncellerken, seçilen çalışan ID'sinin (employeeId) veritabanında mevcut olmamasından kaynaklanıyor.
2. Frontend tarafında formun submit edilmesinde otomatik olarak geçerli bir employeeId seçilmesi için kod ekleyelim:
   - Eğer kullanıcı bir çalışan seçmezse, ilk çalışan ID'sini otomatik olarak atama
   - Hiç çalışan yoksa uyarı gösterme
3. Kalıcı çözüm için:
   - `npx prisma migrate reset` ile veritabanını sıfırlayıp yeniden kurun (veriler kaybolur)
   - Veya `npx prisma db pull` ile mevcut veritabanı şemasını Prisma modeline yansıtın

## [CustomerStatus.ACTIVE hatası]

Çözüm: Veritabanındaki CustomerStatus enum değerleri ile frontend'deki değerler uyumsuz. 
1. `CustomerStatus` enum'unu schema.prisma dosyasında ve typescript tarafında aynı değerlere ayarlayın.
2. Özellikle, PROSPECT ve ARCHIVED değerleri kaldırılıp, LEAD ve POTENTIAL değerleri eklenmiş.
3. `npx prisma generate` komutuyla Prisma client'ı yeniden oluşturun. 