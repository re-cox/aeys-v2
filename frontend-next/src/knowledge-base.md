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

## Hakediş Detay Sayfası 500 Hatası

Çözüm: Hakediş API detay endpoint'i (GET /api/progress-payments/:id) 500 hata döndürdüğünde aşağıdaki çözüm adımlarını uygulayın:

1. Prisma modellerinde ilişki sorunu olabilir. Hakediş ve belge modelleri arasındaki ilişkileri kontrol edin.
2. `HakedisDocument` modeli için kullanıcı ilişkisini (`User` modeli ile) doğru tanımlayın. 
3. Prisma şemasında User modelinde karşılık gelen bir ilişki tanımlanmalıdır: 
   ```
   yukledigiHakedisler   HakedisDocument[]  @relation("YukleyenKullanici")
   ```
4. Controller'da HakedisDocument'e doğrudan erişemiyorsak, geçici olarak boş belge dizisi döndürün.
5. Prisma şemasını güncelledikten sonra `npx prisma db push` ile değişiklikleri veritabanına yansıtın. 

## Hakediş Durum Güncelleme Hatası

Çözüm: Hakediş durum güncellemesi sırasında "Hakediş durumu güncellenemedi" hatası alındığında:

1. Frontend'den backend'e gönderilen durum değeri `status` anahtarı ile gönderildiğinden emin olun.
2. Frontend durum kodları (DRAFT, PENDING, APPROVED) ile backend durum kodları (TASLAK, ONAY_BEKLIYOR, ONAYLANDI) arasındaki çeviri işlemini kontrol edin.
3. Özellikle "SUBMITTED" (Gönderildi) ve "PARTIALLY_PAID" (Kısmi Ödendi) durumları için, backend'de uygun Türkçe karşılıklarının tanımlandığından emin olun:
   ```javascript
   const statusMap = {
     'DRAFT': 'TASLAK',
     'SUBMITTED': 'GONDERILDI',
     'PENDING': 'ONAY_BEKLIYOR',
     'APPROVED': 'ONAYLANDI',
     'PAID': 'ODENDI',
     'PARTIALLY_PAID': 'KISMI_ODENDI',
     'REJECTED': 'REDDEDILDI'
   };
   ```
4. Backend'deki progressPayment.controller.ts dosyasında, Prisma veritabanı modelinin güncel olduğundan ve belirtilen alanların (örn. gondermeTarihi) veritabanında bulunduğundan emin olun.
5. Eğer veritabanında eksik alan varsa, `npx prisma db push` komutu ile şemayı güncelleyin.
6. Loglama ve hata yakalama mekanizmalarını ekleyerek hataların kök nedenini tespit edin.
7. Sunucu çalışmıyorsa veya bağlantı problemi varsa, backend'de `npm run dev` ile yeniden başlatın. 

## Hakediş Durum Güncelleme GONDERILDI ve KISMI_ODENDI Hatası

Çözüm: "Hakediş durumu güncellenirken bir sunucu hatası oluştu" ve "Invalid value for argument `durum`. Expected HakedisDurum." hatası alındığında:

1. Bu hata, Prisma şemasındaki HakedisDurum enum değerlerinde "GONDERILDI" ve "KISMI_ODENDI" değerlerinin bulunmadığını gösterir.
2. Prisma şemasında (backend/prisma/schema.prisma) HakedisDurum enum'una bu değerleri eklememiz gerekir:
   ```prisma
   enum HakedisDurum {
     TASLAK
     GONDERILDI  // Eklenmeli
     ONAY_BEKLIYOR
     ONAYLANDI
     ODENDI
     KISMI_ODENDI  // Eklenmeli
     REDDEDILDI
     IPTAL_EDILDI
   }
   ```
3. Değişiklikleri veritabanına yansıtmak için `npx prisma db push` komutunu çalıştırın.
4. Backend sunucusunu yeniden başlatın: `npm run dev`.
5. Bu işlemlerden sonra sorun çözülecektir.

## Hakediş Durum Güncelleme gondermeTarihi Hatası

Çözüm: "Veritabanı güncelleme hatası: Unknown argument `gondermeTarihi`. Did you mean `odemeTarihi`?" hatası alındığında:

1. Bu hata, progressPayment.controller.ts dosyasında, "GONDERILDI" durumu için `gondermeTarihi` alanı kullanılmaya çalışılırken ortaya çıkar.
2. Sorun, Hakedis modelinde böyle bir alanın tanımlı olmamasıdır.
3. Çözüm adımları:
   - Controller dosyasında `gondermeTarihi` kullanımını kaldırın
   - Sadece `durum` ve `updatedAt` alanlarını güncelleyin
   - Diğer durumlar için (ör. KISMI_ODENDI) doğru alanları kullanın
4. `hakedis.update()` işlemi sadece şemada tanımlı alanları içerebilir.
5. Prisma şemasında yeni bir alan eklemek isterseniz, schema.prisma dosyasını güncelleyip `npx prisma db push` komutu ile veritabanını güncelleyin. 