## Module '"@prisma/client"' has no exported member 'CustomerStatus'

Çözüm: 
1. Bu hata, Prisma şemasında `CustomerStatus` enum'u eklendiğinde ancak Prisma Client'in henüz güncellenmemiş olduğunda ortaya çıkar.
2. İlk adım olarak `npx prisma generate` komutu çalıştırılarak Prisma Client'ın güncellenmesi gerekir.
3. Eğer hata devam ederse, projeyi yeniden başlatmak için Next.js development server'ı durdurup yeniden başlatın.
4. Geliştirme ortamı önbelleğini temizlemek için `.next` klasörünü silip yeniden oluşturmak da yardımcı olabilir: `rm -rf .next && npm run dev`
5. Sorun hala devam ediyorsa, `node_modules/.prisma` klasörünü ve `node_modules/@prisma/client` klasörünü silip Prisma Client'ı yeniden oluşturmayı deneyin: `rm -rf node_modules/.prisma node_modules/@prisma/client && npx prisma generate` 

## Error: filteredProposals.map is not a function

Çözüm:
1. Bu hata, `getAllProposals()` fonksiyonunun beklenen format dışında veri döndürmesinden kaynaklanır.
2. Sorun, fonksiyonun `{ proposals: Proposal[]; total: number }` formatında bir obje döndürmesi, ancak bileşenin doğrudan `Proposal[]` dizisi beklemesidir.
3. Çözüm için aşağıdaki değişiklikler yapılmalıdır:

   a. `proposalService.ts` içindeki `getAllProposals` fonksiyonunu düzenleyerek doğrudan `Proposal[]` dizisi döndürecek şekilde değiştirin:
   ```typescript
   export const getAllProposals = async (...): Promise<Proposal[]> => {
     // ...
     return mockProposals.map(mapResponseToProposal); // { proposals: ... } yerine doğrudan dizi
   }
   ```

   b. Veya teklif sayfasındaki kullanımı değiştirin:
   ```typescript
   const [proposalData, customerData] = await Promise.all([
     getAllProposals(),
     getAllCustomers()
   ]);
   setProposals(proposalData.proposals || []); // proposalData.proposals şeklinde
   ```

4. Ayrıca `proposalNumber` alanı uyumsuzluğunu kontrol edin. Backend'de `proposalNo` olarak kullanılırken, frontend'de `proposalNumber` olarak kullanılıyor olabilir. Bu durumda mapper fonksiyonunda dönüşüm yapın:
   ```typescript
   export function mapResponseToProposal(data: any): Proposal {
     return {
       ...data,
       proposalNumber: data.proposalNumber || data.proposalNo || "",
       // diğer alanlar...
     };
   }
   ```

5. Tiplerde `proposalNumber` eksikse, Proposal tipine ekleyin:
   ```typescript
   export interface Proposal {
     // Diğer alanlar...
     proposalNumber?: string;
   }
   ``` 

## Teklif detayı getirme hatası: "Teklif detayı getirilirken bir hata oluştu"

Çözüm:
1. Bu hata, teklif detay sayfasında backend API'ye yapılan çağrının başarısız olmasından kaynaklanır.
2. Backend API henüz hazır olmadığı veya bağlantı sağlanamadığı için API çağrısı hata vermektedir.
3. Çözüm için aşağıdaki adımlar uygulanmalıdır:

   a. `proposalService.ts` içindeki `getProposalById` fonksiyonunu backend API çağrısı yapmak yerine mock veri döndürecek şekilde değiştirin:
   ```typescript
   export const getProposalById = async (id: string): Promise<Proposal> => {
     try {
       // Mock veri dönelim (API'nin hazır olmaması nedeniyle)
       console.log("Mock teklif detayı kullanılıyor - ID:", id);
       
       const mockProposal = {
         id: id,
         proposalNo: "20250501-0001",
         proposalNumber: "20250501-0001",
         title: "2023 Yılı Bakım Teklifi",
         customerId: "...",
         customer: { id: "...", companyName: "Kalyon Grup" },
         status: "DRAFT",
         validUntil: new Date("2025-05-30"),
         createdAt: new Date("2025-05-01"),
         updatedAt: new Date("2025-05-01"),
         items: [/* teklif kalemleri */],
         attachments: []
       };
       
       return mapResponseToProposal(mockProposal);
       
       /* Gerçek API çağrısı (şu an aktif değil)
       const response = await fetch(`${API_BASE_URL}/${id}`, {...});
       ...
       */
     } catch (error) {
       console.error("Teklif detayı getirme hatası:", error.message);
       throw error;
     }
   };
   ```

4. Mock veri kullanırken, Proposal ve ilişkili tiplerdeki tüm gerekli alanların doğru şekilde doldurulduğundan emin olun.
5. Backend API hazır olduğunda, mock veri kısmını yorum satırına alıp gerçek API çağrısını aktif hale getirin. 

## Documents sayfasında "Klasörler yüklenirken hata oluştu: Internal Server Error" ve "Doküman verileri alınamadı" hataları

Çözüm:
1. Bu hata, backend tarafında `/api/edas/bedas/notifications` ve ilgili API endpoint'lerinin eksik veya hatalı olmasından kaynaklanmaktadır.
2. Sorun, backend'de doküman ve klasör işlemleri için gerekli API endpoint'lerinin tam olarak uygulanmamış olmasıdır.
3. Aşağıdaki adımlar izlenerek sorun çözülmüştür:

   a. Backend'deki `edas.routes.ts` dosyasına eksik API endpoint'leri eklenmiştir:
   ```typescript
   // GET: Tüm belgeleri getir 
   router.get('/bedas/notifications/:id/documents', asyncHandler(async (req: Request, res: Response) => {
     // Belgeleri getirme işlemleri
   }));

   // POST: Belge yükleme
   router.post('/bedas/notifications/:id/documents', fileUpload({...}), asyncHandler(async (req: FileUploadRequest, res: Response) => {
     // Belge yükleme işlemleri
   }));

   // GET: Belge indirme
   router.get('/bedas/notifications/:id/documents/:documentId', asyncHandler(async (req: Request, res: Response) => {
     // Belge indirme işlemleri
   }));

   // DELETE: Belge silme
   router.delete('/bedas/notifications/:id/documents/:documentId', asyncHandler(async (req: Request, res: Response) => {
     // Belge silme işlemleri
   }));
   ```

   b. Backend'e merkezi hata işleme mekanizması eklenmiştir (`error-handler.ts`):
   ```typescript
   export const errorHandler = (err: ErrorWithCode, req: Request, res: Response, next: NextFunction) => {
     // Hata işleme mantığı
   };

   export const asyncHandler = (fn: Function) => 
     (req: Request, res: Response, next: NextFunction) => {
       Promise.resolve(fn(req, res, next)).catch(next);
     };
   ```

   c. API endpoint'lerinde try-catch blokları yerine `asyncHandler` kullanılarak hata yönetimi merkezi hale getirilmiştir.

4. BEDAS notification silme işlemi geliştirilmiş, fiziksel dosyaların da silinmesi sağlanmıştır.
5. `express-fileupload` modülü için tip tanımları eklenmiştir.
6. `app.ts` dosyasına merkezi hata yönetimi eklenmiştir.

Bu değişiklikler sayesinde documents sayfasındaki API çağrıları düzgün çalışmakta ve kullanıcı arayüzünde dokümanlar ve klasörler düzgün görüntülenmektedir.

## Unknown field `notes` for select statement on model `Proposal`

Çözüm:
1. Bu hata, Proposal modelinde olmayan `notes` alanının API sorgularında kullanılmaya çalışılmasından kaynaklanmaktadır.
2. Sorun, veritabanı şemasında bulunmayan bir alanın select, create veya update işlemlerinde kullanılmasıdır.
3. Aşağıdaki adımlar izlenerek sorun çözülmüştür:
   a. API rotalarında olmayan alan referansları kaldırılmıştır (örn. `notes` alanı)
   b. Eksik alanlar (örn. `title`) eklenmiştir
   c. İlgili tip tanımları güncellenmiştir
   d. Prisma migrasyonu çalıştırılmıştır

## Proposal model şemasında title alanı eksikliği

Çözüm:
1. Bu sorun, Proposal modelinde title alanı olmadığı için tekliflerin listelenmesinde 500 hatası alınmasından kaynaklanmaktadır.
2. Prisma şemasına title alanı ekleyip migrasyon çalıştırılarak çözülmüştür:
   ```
   npx prisma migrate dev --name add_title_field_to_proposal
   ```

## Backend API/Auth login 500 hatası

Çözüm:
1. Bu hata, frontend-next ve backend arasındaki veritabanı uyuşmazlığından kaynaklanmaktadır.
2. Uygulamada iki ayrı veritabanı bulunmaktadır: Next.js tarafında Prisma ile yönetilen ve backend tarafında ayrı bir veritabanı.
3. Prisma migrate reset işlemi sadece frontend veritabanını sıfırlar, ancak API isteklerinin 5001 portunda çalışan backend'e gönderilmesi nedeniyle backend veritabanı da güncellenmelidir.
4. Aşağıdaki adımlar izlenerek sorun çözülmüştür:
   a. Backend klasörüne geçiş yapılması: `cd ../backend`
   b. Backend veritabanının da sıfırlanması: `npx prisma migrate reset`
   c. Backend uygulamasının başlatılması: `npm run start:dev`

Bu sayede hem frontend hem de backend veritabanı senkronize edilmiş ve kullanıcı giriş işlemi çalışır hale gelmiştir. 

## Cannot read properties of undefined (reading 'LOW') hatası (Tasks sayfası)

Çözüm:
1. Bu hata, backend tarafında TaskPriority enum'ının eksik olmasından kaynaklanan bir sorundur.
2. Backend'de Task modeli ve ilgili API rotaları eksikti.
3. Aşağıdaki adımlar izlenerek sorun çözülmüştür:
   a. Backend için Task modeli enum'ları doğru şekilde tanımlandı (TaskPriority yerine Priority kullanıldı)
   b. Backend'e görevlerle ilgili API rotaları eklendi (`src/routes/task.routes.ts` dosyası oluşturuldu)
   c. Backend'in index.ts dosyasına task rotaları eklendi
   d. Frontend tarafındaki TaskPriority referansları Priority ile değiştirildi

Bu değişiklikler sonucunda görevlerin listesi ve detayları backend'den düzgün bir şekilde çekilebilir hale gelmiştir. 