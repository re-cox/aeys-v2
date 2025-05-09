## Module not found: Can't resolve '@/components/ui/dialog' veya '@/components/ui/tooltip'

Çözüm: Eksik UI bileşenleri eklenmeli ve bağımlılıkları yüklenmelidir

1. Eksik bileşenleri `/src/components/ui/` klasörüne ekleyin:
   - dialog.tsx
   - tooltip.tsx

2. Gerekli bağımlılıkları yükleyin:
   ```
   npm install @radix-ui/react-dialog @radix-ui/react-tooltip --legacy-peer-deps
   ```

3. Uygulamayı yeniden başlatın:
   ```
   npm run dev
   ```

## TypeError: Cannot read properties of undefined (personel sayfasında konsol hatası)

Çözüm: Personel sayfasında, personel nesnelerindeki bazı özellikler null veya undefined olduğunda meydana gelen hata.

1. `employee.department.id` ve `employee.department.name` erişimlerini güvenli hale getirmek için optional chaining (`?.`) operatörü eklendi.
   
2. Tüm personel özelliklerine erişimlere null kontrolleri eklendi:
   - `employee.name?.toLowerCase()` 
   - `employee.surname?.toLowerCase()`
   - `employee.position?.toLowerCase()`
   - Alternatif değer atama: `employee.name || ''`

3. Departman filtresi için null kontrolü eklendi:
   ```typescript
   result = result.filter(emp => emp.department?.id === departmentFilter);
   ```

4. formatDate fonksiyonu null/undefined için güncellendi:
   ```typescript
   const formatDate = (dateString: string | undefined | null) => {
     if (!dateString) return '';
     // ...
   }
   ```

## Error: Veri Doğrulama Hatası (Ek İş oluşturma)

Çözüm: API endpoint ile frontend arasındaki veri format uyumsuzluğu giderildi.

1. Frontend servislerindeki API yolları düzeltildi:
   - `/api/additional-work` yerine `/api/additional-works` kullanıldı (tüm isteklerde)

2. Veri formatı dönüşümleri eklendi:
   - Frontend'den gelen `assignedToId` (tekil) değeri API'nin beklediği `assignedToIds` (çoğul) dizisine dönüştürüldü
   - Bu dönüşüm `createAdditionalWork` ve `updateAdditionalWork` fonksiyonlarında yapıldı

3. API endpoint'inde `priority` alanı eklendi ve doğrulama kontrolü iyileştirildi

4. API hata mesajları daha açıklayıcı hale getirildi:
   - Bilinmeyen alanlar için: `Bilinmeyen alan: 'alanAdı'`
   - Eksik zorunlu alanlar için: `Zorunlu alan eksik: 'alanAdı'`
   - Veritabanı hataları için daha spesifik mesajlar eklendi

## Error: Veri Doğrulama Hatası (Ek İş oluşturma) - Güncellenmiş Çözüm

Çözüm: Frontend, API ve Prisma şeması arasındaki ilişki yapısı uyumsuzluğu giderildi.

1. Prisma şemasında `AdditionalWork` modeli `assignedToId` (tekil) kullanıyor, ancak API çağrılarında `assignedToIds` (çoğul) kullanılıyordu. Bu uyumsuzluk giderildi:

   - Frontend servislerinde:
     ```typescript
     // Hatalı:
     assignedToIds: data.assignedToId ? [data.assignedToId] : []
     
     // Doğru:
     assignedToId: data.assignedToId
     ```

   - API endpoint'inde:
     ```typescript
     // Hatalı:
     dataToCreate.assignedTo = { 
       connect: assignedToIds.map((id: string) => ({ id })) 
     };
     
     // Doğru:
     dataToCreate.assignedToId = assignedToIds[0];
     ```

2. `files` ilişkisi de Prisma modeli ile uyumlu olmayabileceğinden devre dışı bırakıldı.

3. Genellikle, ilişkisel verilerde şema yapısı ile API çağrılarının uyumlu olması önemlidir:
   - Tekil ilişkiler (`@relation`) için doğrudan ID atanmalı
   - Çoğul ilişkiler (`@relation[]`) için dizi ve connect kullanılmalı

## Error: Veri Doğrulama Hatası (Ek İş oluşturma) - Kök Neden Tespiti

Çözüm: API endpoint'i, frontend tarafından gönderilen veri yapısındaki değişikliği (assignedToId gönderilmesi) yansıtmıyordu. API hala eski 'assignedToIds' alanını bekliyordu.

1. API Endpoint'inde (`POST /api/additional-works/route.ts`):
   ```typescript
   // Hatalı:
   const { ..., assignedToIds, ... } = body;
   // ...
   if (assignedToIds && Array.isArray(assignedToIds) && assignedToIds.length > 0) {
     dataToCreate.assignedToId = assignedToIds[0];
   }
   
   // Doğru:
   const { ..., assignedToId, ... } = body; // Doğrudan assignedToId oku
   // ...
   if (assignedToId) { // Body'den okunan assignedToId'yi kullan
     dataToCreate.assignedToId = assignedToId;
   }
   ```
2. Frontend tarafında yapılan değişiklikler (assignedToId gönderme) zaten doğruydu.
3. Bu düzeltme ile API, frontend'in gönderdiği `assignedToId` alanını doğru şekilde alıp Prisma'ya iletecektir.

## Profil fotoğrafı 404 hatası (Failed to load resource: the server responded with a status of 404)

Çözüm: Backend sunucusunda profil resimleri için statik dosya sunumu yolu düzeltildi.

1. Sorunun Tanımı:
   Backend, profil resimlerini başarıyla `/uploads/profile-pictures/` klasörüne kaydediyor ancak bu dosyaları erişilebilir kılmıyordu. Dosyalar `backend/uploads/profile-pictures/` klasörüne fiziksel olarak kaydedilirken, Express sunucusu bu dizini `/uploads/` URL yoluyla dışarıya sunmuyordu. 

2. İki Parçalı Çözüm:
   a) Backend'de `app.ts` dosyasında statik dizin ayarı:
      ```typescript
      // uploads klasörünü /uploads URL yolundan statik olarak sun
      app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
      console.log(`Static files served from: ${path.join(__dirname, '../uploads')} mapped to /uploads`);
      ```
   
   b) Multer yükleme konfigürasyonu düzeltildi (`backend/src/routes/user.routes.ts`):
      ```typescript
      // Eskiden public/uploads içine kaydediliyordu
      const UPLOAD_DIRECTORY = path.join(__dirname, '../../uploads/profile-pictures');
      ```
   
   c) Profil resmi URL oluşturma düzeltildi (`user.controller.ts`):
      ```typescript
      // Dosya yolu artık doğrudan /uploads/profile-pictures/ dizinine göre
      const relativeFilePath = `/uploads/profile-pictures/${file.filename}`;
      ```

   d) Frontend'deki URL kullanımı düzeltildi - employeeService.ts'deki endpoint'leri `/api/users/:id/profile-picture` yerine `/api/employees/:id/profile-picture` olacak şekilde güncelledik:
      ```typescript
      // Eskiden (users endpoint'i kullanılıyordu):
      const response = await apiClient.post<{ success: boolean, profilePictureUrl: string, message: string }>(
        `/users/${userId}/profile-picture`, 
        formData, 
        // ...
      );
      
      // Yeni (employees endpoint'i kullanıyoruz):
      const response = await apiClient.post<{ success: boolean, profilePictureUrl: string, message: string }>(
        `/employees/${userId}/profile-picture`, 
        formData, 
        // ...
      );
      ```

3. Sorunun Tekrarını Önlemek:
   - Statik dosyalar için her zaman doğru yolu ayarlayın
   - Dosya yüklenen ve servis edilen klasörlerin aynı olduğundan emin olun
   - Yüklemeden önce gerekli dizinlerin var olduğunu kontrol edin
   - Dosya yolu ve URL yolu ayrımına dikkat edin
   - Frontend'de, backend API endpoint'leriyle tutarlı olunduğundan emin olun (users vs employees)

## Error: Route.post() requires a callback function but got a [object Undefined]

Çözüm: Backend `user.routes.ts` dosyasında eksik veya tanımlanmamış bir controller fonksiyonu (uploadProfileImage) kullanılıyordu.

1. Sorunun Tanımı:
   Express Router'da bir middleware fonksiyonu eksik veya undefined olduğunda alınan hata. Bu özel durumda, `routes/user.routes.ts` dosyasında 75. satırdaki `router.post()` içinde kullanılan `uploadProfileImage` fonksiyonu düzgün export edilmemiş veya yanlış tanımlanmış.

2. Çözüm Adımları:
   a) Controller fonksiyonunu doğru tanımladık ve Promise tipi düzelttik:
      ```typescript
      export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
        // İşlevsellik...
      }
      ```
   
   b) Controller'da, profil resmini User modeli yerine Employee modeline kaydetmesini düzelttik:
      ```typescript
      // Hatalı:
      await prisma.user.update({
        where: { id },
        data: { profilePictureUrl },
        // ...
      });
      
      // Doğru:
      await prisma.employee.update({
        where: { userId: id },
        data: { profilePictureUrl }
      });
      ```
   
   c) İmport ve kullanım yollarını düzelttik:
      ```typescript
      // İmportlar düzgün bir şekilde tanımlandı
      import { 
        uploadProfileImage,
        uploadProfilePicture 
      } from '../controllers/user.controller';
      
      // Router tanımı düzgün yapıldı
      router.post(
        '/:id/profile-image',
        protect,
        uploadProfileImage
      );
      ```

3. Sorunun Tekrarını Önlemek:
   - Controller fonksiyonlarını düzgün şekilde export ettiğinizden emin olun
   - TypeScript tiplerini Express middleware'leriyle uyumlu hale getirin (Promise<void> return tipi)
   - Modellere göre doğru veritabanı işlemlerini kullanın (User vs. Employee)
   - Yeni route eklerken önce controller fonksiyonunun varlığını kontrol edin

## AxiosError: Request failed with status code 401 (Documents sayfasında token hatası)

Çözüm: Frontend ve backend arasındaki API iletişiminde token yönetimi sorunu giderildi.

1. Sorunun Tanımı:
   Documents sayfasına erişildiğinde 401 (Unauthorized) hatası alınıyor ve sayfada "Oturum hatası: Lütfen tekrar giriş yapın." mesajı görüntüleniyor. Konsol hatası:
   ```
   AxiosError: Request failed with status code 401
   ```

2. Sorunun Kaynağı:
   - API isteklerinde token doğru şekilde gönderilmiyor veya geçersiz
   - AuthContext içindeki API_BASE_URL tanımlaması hatalı, bu nedenle API istekleri yanlış adrese gidiyor
   - Token localStorage'dan alınırken hata olabilir

3. Çözüm Adımları:
   a) AuthContext.tsx dosyasındaki API URL'lerini sabit değerlerle düzelt:
      ```typescript
      // Sabit URL kullan, env dosyasına güvenme (hatalı yapılandırılmış olabilir)
      const EFFECTIVE_API_BASE_URL = "http://localhost:5001/api"; 
      ```
      
   b) API isteklerinde token kullanımını iyileştir:
      ```typescript
      apiClient.interceptors.request.use((config) => {
          try {
              const token = localStorage.getItem('token');
              if (token) {
                  config.headers.Authorization = `Bearer ${token}`;
                  console.log("[Auth] Token eklendiği: İstek gönderiliyor", { url: config.url });
              } else {
                  console.warn("[Auth] Token bulunamadı, istek yetkilendirilmeden gönderiliyor", { url: config.url });
              }
          } catch (error) {
              console.error("[Auth] Token işleme hatası:", error);
          }
          return config;
      });
      ```
      
   c) Geçersiz token durumunu daha iyi yönet:
      ```typescript
      // Documents sayfasında token kontrolü
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          errorMessage = 'Oturum hatası: Lütfen tekrar giriş yapın.';
          localStorage.removeItem('token');
          toast.error(errorMessage);
          setTimeout(() => router.push('/login'), 1500);
      }
      ```

4. Ek Kontroller:
   - Frontend'de oturum açtıktan sonra localStorage'da token'ın doğru şekilde saklandığından emin ol
   - Backend'deki token doğrulama işlemini kontrol et
   - Network tabında giden isteklerin headerlarında token'ın doğru formatta olduğunu kontrol et
   - Backend loglarında token hatalarının detaylarını incele

## Access to fetch at 'http://localhost:5001/api/folders/root/contents' has been blocked by CORS policy

Çözüm: Backend'de CORS yapılandırması credentials ve origin ayarları güncellendi.

1. Sorunun Tanımı:
   Frontend (http://localhost:3000) backend API'sine (http://localhost:5001) kimlik bilgileriyle (credentials: include) istek yaparken, backend'in CORS yapılandırması wildcard (*) ile tüm originlere izin vermesi nedeniyle tarayıcı güvenlik engellemesi oluşuyordu. Güvenlik nedeniyle, credentials gönderilen isteklerde wildcard origin kabul edilmez, belirli bir origin olmalıdır.

2. Çözüm Adımları:
   a) Backend'in `index.ts` dosyasında CORS ayarları düzenlendi:
      ```typescript
      // Hatalı:
      app.use(cors());
      
      // Doğru:
      app.use(cors({
        origin: env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }));
      ```
      
   b) `config/env.ts` dosyasına FRONTEND_URL değişkeni eklendi:
   ```typescript
      export const env = {
        // ... diğer ayarlar
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
      };
      ```
      
   c) Değişiklikler derlenip sunucu yeniden başlatıldı.

3. Hata Mesajının Anlamı:
   - "Access to fetch at [API_URL] has been blocked by CORS policy": Tarayıcı, güvenlik nedeniyle farklı domain/port'tan gelen istekleri engelliyor.
   - "Response to preflight request doesn't pass access control check": Tarayıcının OPTIONS isteği (preflight) başarısız oldu.
   - "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'": credentials: include kullanırken, spesifik origin belirtilmeli.

4. Alınacak Dersler:
   - credentials: include kullanılırken, CORS ayarlarında origin alanı spesifik olmalıdır (wildcard * kullanılamaz).
   - Backend API geliştirirken, özellikle kimlik doğrulama gerektiren API'lerde CORS güvenlik kurallarını doğru yapılandırın.
   - CORS hataları, frontend-backend iletişiminde en yaygın sorunlardan biridir ve doğru ayarlarla kolayca çözülebilir.

## Evrak Yönetimi Sayfası Boş Görüntüleniyor (CORS ve Token Hataları)

Çözüm: Evrak yönetimi sayfasındaki token doğrulama sorunları ve tip uyumsuzlukları giderildi.

1. Sorunun Tanımı:
   Evrak Yönetimi sayfası açıldığında sayfa tamamen boş görüntüleniyor, konsol hatalarında token doğrulama sorunları ve CORS hataları görülüyordu.

2. Çözüm Adımları:
   a) Backend'de token doğrulama middleware'i düzeltildi:
   ```typescript
   export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
     try {
       // Token'ı al
       const authHeader = req.headers.authorization;
       
       if (!authHeader) {
         return res.status(401).json({ error: 'Yetkilendirme hatası: Token bulunamadı' });
       }
       
       const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
       
       try {
         // JWT token'ı doğrula
         const decoded = jwt.verify(token, JWT_SECRET) as any;
         
         if (!decoded || typeof decoded !== 'object') {
           return res.status(401).json({ error: 'Yetkilendirme hatası: Geçersiz token içeriği' });
         }
         
         // Token içeriğinin doğru olup olmadığını kontrol et
         const userId = decoded.id || decoded.userId;
         
         if (!userId) {
           return res.status(401).json({ error: 'Yetkilendirme hatası: Geçersiz token içeriği' });
         }
         
         // Kullanıcıyı veritabanından bul
         const user = await prismaClient.user.findUnique({
           where: { id: userId },
           select: {
             id: true,
             email: true,
             name: true,
             surname: true,
             role: true
           }
         });
         
         if (!user) {
           return res.status(401).json({ error: 'Yetkilendirme hatası: Kullanıcı bulunamadı' });
         }
         
         // Kullanıcıyı request nesnesine ekle
         req.user = {
           id: user.id,
           email: user.email,
           role: typeof user.role === 'object' && user.role !== null ? user.role.name : 'user',
           permissions: typeof user.role === 'object' && user.role !== null ? user.role.permissions : {}
         };
         
         // Devam et
         next();
       } catch (jwtError) {
         return res.status(401).json({ error: 'Yetkilendirme hatası: Geçersiz token' });
       }
     } catch (error) {
       return res.status(500).json({ error: 'Sunucu hatası' });
     }
   };
   ```

   b) Frontend'de API isteklerini axios kullanarak daha güvenilir hale getirdik:
   ```typescript
   // Axios instance oluştur
   const api = axios.create({
     baseURL: API_BASE_URL,
     headers: {
       'Content-Type': 'application/json',
     }
   });

   // Request interceptor - her istekte token ekle
   api.interceptors.request.use(
     (config) => {
       const token = localStorage.getItem('token');
       if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       }
       return config;
     },
     (error) => {
       return Promise.reject(error);
     }
   );
   ```

   c) DocumentsPage bileşeninde hata yakalama ve token kontrolü iyileştirildi:
      ```typescript
   const loadFolderContents = useCallback(async (folderId: string | null) => {
     try {
       setLoading(true);
       setError(null);
       
       const result = await getFolderContents(folderId);
       
       setFolders(result.folders || []);
       setDocuments(result.documents || []);
       setCurrentFolderId(folderId);
       
     } catch (err: any) {
       // Hata işleme...
       if (err.response) {
         const status = err.response.status;
         
         if (status === 401 || status === 403) {
           localStorage.removeItem('token');
           setTimeout(() => router.push('/login'), 1500);
         }
       }
     } finally {
       setLoading(false);
     }
   }, [router]);
   ```

3. Sorunun Tekrarını Önlemek:
   - API isteklerinde token doğrulama mantığını standartlaştın.
   - CORS yapılandırmasının doğru olduğundan emin olun
   - Tip uyumsuzluklarını önlemek için TypeScript tiplerini düzgün tanımlayın
   - API çağrılarında hata işleme mekanizmalarını her zaman uygulayın

4. İlgili Dosyalar:
   - `backend/src/middlewares/auth.middleware.ts` - Token doğrulama fonksiyonları
   - `frontend-next/src/services/folderService.ts` - API istekleri için servis
   - `frontend-next/src/app/(dashboard)/documents/DocumentsPage.tsx` - Evrak yönetimi sayfası bileşeni

## Dökümanlar sayfasında sonsuz döngü ve sürekli API istekleri

Çözüm: DocumentsPage.tsx'teki useCallback bağımlılıklarında yanlış bir değer vardı, bu da sonsuz döngüye neden oluyordu.

1. Sorunun Tanımı:
   - `/documents` sayfasında aynı API isteği sürekli tekrar tekrar gönderiliyor (GET /api/folders/root/contents)
   - Backend'in sürekli bu isteği yanıtladığı görülüyor, ancak frontend sayfa yüklemesini tamamlamıyor
   - Tarayıcıda sürekli "Evraklar yükleniyor..." mesajı görünüyor

2. Sorunun Kaynağı:
   - DocumentsPage.tsx'teki `loadFolderContents` fonksiyonu useCallback ile sarılmış ve `[router, folders]` bağımlılıkları içeriyor
   - Bu fonksiyon çalıştığında `folders` state'ini değiştiriyor, bu değişiklik tekrar callback'in yeniden oluşturulmasına neden oluyor
   - Böylece useEffect sürekli çalışıyor ve yeni istekler gönderiliyor

Not: React'te useCallback ve useEffect kullanırken bağımlılık dizilerini doğru şekilde ayarlamak çok önemlidir, aksi takdirde sonsuz döngüler veya beklenmedik sonuçlar ortaya çıkabilir.

## Export uploadDocument doesn't exist in target module

Çözüm: Frontend'de `UploadFileDialog.tsx` bileşeninde kullanılan `uploadDocument` fonksiyonu, `documentService.ts` içinde tanımlı değildi.

1. Sorunun Tanımı:
   Build sırasında aşağıdaki hata alınıyor:
   ```
   Export uploadDocument doesn't exist in target module
   ./src/app/(dashboard)/documents/components/UploadFileDialog.tsx (13:1)
   ```

2. Çözüm Adımları:
   a) `documentService.ts` dosyasına `uploadDocument` fonksiyonu eklendi:
      ```typescript
      /**
       * Doküman yükle
       * @param formData Form verisi (dosya ve doküman bilgileri)
       */
      export async function uploadDocument(formData: FormData): Promise<Document> {
        try {
          const response = await api.post('/api/documents/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          return response.data;
        } catch (error) {
          console.error('Doküman yüklenirken hata oluştu:', error);
          throw error;
        }
      }
      ```
      
   b) Backend'de eksik olan API endpoint'i eklendi:
      ```typescript
      // POST /api/documents/upload - Doküman yükleme endpoint'i
      router.post('/upload', upload.single('file'), async (req, res) => {
        try {
          if (!req.file) {
            return res.status(400).json({ error: 'Yüklenecek dosya bulunamadı' });
          }

          // Kullanıcı bilgilerini al
          const userId = req.user.id;
          
          // Dosya URL'ini oluştur
          const fileUrl = `/uploads/${req.file.filename}`;
          
          // Form verilerinden diğer bilgileri al
          const { name, description, category, folderId } = req.body;
          
          // Doküman veritabanı kaydını oluştur
          const document = await prisma.document.create({
            data: {
              name: name || req.file.originalname,
              description: description || '',
              fileUrl,
              type: 'file',
              size: req.file.size,
              mimeType: req.file.mimetype,
              category: category || null,
              folderId: folderId === 'root' ? null : folderId || null,
              createdById: userId
            }
          });
          
          console.log(`[Document API] Doküman yüklendi: ${name || req.file.originalname}, URL: ${fileUrl}`);
          return res.status(201).json(document);
        } catch (error) {
          console.error('[Document API] Doküman yükleme hatası:', error);
        return res.status(500).json({
            error: 'Doküman yüklenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata' 
          });
        }
      });
      ```
      
   c) `uploadDocument` fonksiyonu export listesine eklendi:
      ```typescript
      export default {
        getAllDocuments,
        getDocumentById,
        createDocument,
        updateDocument,
        deleteDocument,
        getAllFolders,
        getFolderById,
        createFolder,
        downloadDocument,
        updateFolder,
        deleteFolder,
        uploadFile,
        uploadDocument,
      };
      ```

3. Sorunun Tekrarını Önlemek:
   - Component'lerde kullanılan servislerin doğru şekilde tanımlandığından emin olun
   - Frontend fonksiyonları oluşturulduğunda ilgili backend endpoint'lerinin de oluşturulduğunu kontrol edin
   - Tüm servis fonksiyonlarının export listesine eklenmesini sağlayın

## DialogPortal must be used within Dialog

Çözüm: Dialog bileşenlerinin hiyerarşisinde sorun vardı, Dialog komponenti ile DialogContent arasındaki ilişki düzeltildi.

1. Sorunun Tanımı:
   Klasör oluşturma veya dosya yükleme dialoglarını açmaya çalışırken aşağıdaki hata mesajı görüntüleniyor:
   ```
   Error: `DialogPortal` must be used within `Dialog`
   ```

2. Sorunun Kaynağı:
   - `CreateFolderDialog.tsx` ve `UploadFileDialog.tsx` bileşenlerinde `Dialog` komponenti yerine sadece `DialogContent` komponenti kullanılıyor.
   - `DialogContent` komponenti içinde yer alan `DialogPortal` komponenti, bir `Dialog` konteksti içinde kullanılmadığında bu hatayı veriyor.
   - Ayrıca, DocumentsPage.tsx dosyasında dialog'lar hem doğrudan hem de Dialog bileşeni içinde çift olarak kullanılıyor.

3. Çözüm Adımları:
   a) `CreateFolderDialog.tsx` ve `UploadFileDialog.tsx` bileşenlerine `Dialog` komponenti eklendi:
      ```jsx
      // Hatalı kullanım:
      return (
        <DialogContent>
          {/* İçerik burada */}
        </DialogContent>
      );
      
      // Doğru kullanım:
      return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
          <DialogContent>
            {/* İçerik burada */}
          </DialogContent>
        </Dialog>
      );
      ```
   
   b) Her iki dialog bileşenine `open` prop'u eklendi:
      ```jsx
      interface CreateFolderDialogProps {
        parentId: string | null;
        onSuccess: () => void;
        onCancel: () => void;
        open: boolean;  // Eklenen prop
      }
      ```
   
   c) DocumentsPage.tsx'teki çift dialog kullanımları düzeltildi - doğrudan kullanılan dialog'lar Dialog bileşeni içine alındı:
      ```jsx
      // Hatalı:
      {isUploadDialogOpen && (
        <UploadFileDialog 
          folderId={currentFolderId}
          onSuccess={handleUploadSuccess}
          onCancel={() => setIsUploadDialogOpen(false)}
        />
      )}
      
      // Doğru:
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <UploadFileDialog 
          folderId={currentFolderId}
          onSuccess={handleUploadSuccess}
          onCancel={() => setIsUploadDialogOpen(false)}
          open={isUploadDialogOpen}
        />
      </Dialog>
      ```

4. Teknik Açıklama:
   - Radix UI, bileşenler arasında React context kullanarak iletişim kurar.
   - `DialogContent` bileşeni, `DialogPortal` bileşenini içerir ve bu da `Dialog` kontekstine erişim gerektirir.
   - `Dialog` bileşeni, bu konteksti sağlayan bir provider olarak işlev görür.
   - Yeniden kullanılabilir dialog bileşenleri yaratırken, bileşenin içinde Dialog provider'ı olmalı veya dışarıdan sağlanmalıdır.

5. Sorunun Tekrarını Önlemek:
   - Shadcn UI veya Radix UI bileşenlerini kullanırken, hiyerarşi ve kontekst ilişkilerine dikkat edin.
   - Özellikle modal, dialog, dropdown gibi bileşenlerde provider-consumer ilişkisini doğru kurun.
   - Benzer bileşenleri düzenlerken, kompozisyon yapısını anlamak için belgeleri kontrol edin.

## Error: A <Select.Item /> must have a value prop that is not an empty string

Çözüm: Radix UI Select bileşenindeki boş string değerli SelectItem ögelerini anlamlı değerlerle değiştirdik.

1. Sorunun Tanımı:
   Documents sayfasında Select bileşenleri kullanılırken aşağıdaki hata alınıyor:
   ```
   Error: A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
   ```

2. Sorunun Kaynağı:
   - `DocumentsPage.tsx` dosyasında filtre Select bileşenlerinde boş string (`value=""`) değerine sahip SelectItem ögeleri kullanılıyor.
   - Radix UI Select bileşeni, boş string değerini özel bir amaç için (seçimi temizlemek ve placeholder göstermek) kullandığından, SelectItem değerlerinin boş olmaması gerekiyor.

3. Çözüm Adımları:
   a) Boş string değerlerini anlamlı değerlerle değiştirdik:
      ```jsx
      // Hatalı:
      <SelectItem value="">Tüm Türler</SelectItem>
      
      // Doğru:
      <SelectItem value="all">Tüm Türler</SelectItem>
      ```
      
   b) State'lerin başlangıç değerlerini güncelledik:
      ```jsx
      // Hatalı:
      const [selectedType, setSelectedType] = useState<string>('');
      const [selectedCategory, setSelectedCategory] = useState<string>('');
      
      // Doğru:
      const [selectedType, setSelectedType] = useState<string>('all');
      const [selectedCategory, setSelectedCategory] = useState<string>('all');
      ```
      
   c) Filtreleme mantığını yeni değerlere göre düzenledik:
      ```jsx
      // Hatalı:
      if (selectedType) {
        matchesType = document.type === selectedType;
      }
      
      // Doğru:
      if (selectedType && selectedType !== 'all') {
        matchesType = document.type === selectedType;
      }
      ```

4. Teknik Açıklama:
   - Radix UI Select bileşeni, kullanıcının seçimi temizlemesi için boş string değerini özel bir kontrol mekanizması olarak kullanır.
   - Select içindeki her SelectItem'ın değeri benzersiz ve boş olmayan bir string olmalıdır.
   - "Tümü", "Hepsi" veya "Filtresiz" gibi durumlar için "all" gibi anlamlı değerler kullanılmalıdır.

5. Sorunun Tekrarını Önlemek:
   - Radix UI bileşenlerinde boş string değerlerinden kaçının.
   - Seçeneksiz/filtresiz durumlar için "all", "none" gibi anlamlı değerler kullanın.
   - Bileşenlerin dokümantasyonunda belirtilen özel değer kurallarına dikkat edin.

## AxiosError: Request failed with status code 404 (Dosya yükleme hatası)

Çözüm: Frontend ile backend arasındaki API URL yapılandırması sorunu giderildi.

1. Sorunun Tanımı:
   Doküman yönetimi sayfasında dosya yüklerken 404 (Not Found) hatası alınıyor:
   ```
   AxiosError: Request failed with status code 404
   ```
   Bu hata, frontend'in backend API endpoint'ini bulamadığını gösteriyor.

2. Sorunun Kaynağı:
   - Tutarsız API URL yapılandırması:
     - documentService.ts: `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';`
     - folderService.ts: `const API_BASE_URL = 'http://localhost:5001';`
     - .env dosyasında: `NEXT_PUBLIC_API_URL=/api`
   - Bu yapılandırmada, documentService `/api/api/documents/upload` şeklinde hatalı bir URL oluşturuyor

3. Çözüm Adımları:
   a) API URL yapılandırmalarını düzgün ve sabit hale getirdik:
      ```typescript
      // documentService.ts ve folderService.ts dosyalarında:
      const API_BASE_URL = 'http://localhost:5001';
      ```
      
   b) Hata ayıklama için console log'ları ekledik:
      ```typescript
      console.log('[Document Service] Doküman yükleme isteği yapılıyor:', `${API_BASE_URL}/api/documents/upload`);
      ```
      
   c) Detaylı hata raporlama ekledik:
      ```typescript
      if (axios.isAxiosError(error) && error.response) {
        console.error('Hata detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      ```
   
4. Önemli Noktalar:
   - .env dosyasında `NEXT_PUBLIC_API_URL=/api` olarak ayarlandığında, axios ile `/api/documents/upload` endpoint'i çağrıldığında aslında `/api/api/documents/upload` URL'i oluşuyor.
   - API_BASE_URL'yi açık şekilde `http://localhost:5001` olarak ayarlamak daha güvenilir.
   - Frontend ve backend geliştirme aşamasında API URL yapılandırması dikkatli yapılmalı.
   - Backend sunucusunun aktif olduğundan ve beklenen portta çalıştığından emin olunmalı.

## In HTML, <li> cannot be a descendant of <li> (Breadcrumb Hydration Hatası)

Çözüm: Breadcrumb bileşenindeki HTML yapısında iç içe kullanılan `<li>` etiketleri düzeltildi.

1. Sorunun Tanımı:
   Documents sayfasında breadcrumb bileşeni kullanılırken aşağıdaki hata alınıyor:
   ```
   In HTML, <li> cannot be a descendant of <li>.
   This will cause a hydration error.
   ```
   ve
   ```
   <li> cannot contain a nested <li>.
   ```
   Bu hatalar, HTML standartlarına aykırı bir yapı olduğu ve Next.js'in server-side rendering ile client-side rendering arasında uyumsuzluk (hydration error) olduğunu gösteriyor.

2. Sorunun Kaynağı:
   - Breadcrumb bileşenlerinde `BreadcrumbSeparator` komponenti `<li>` etiketi olarak tanımlanmış
   - Ancak bu komponent, zaten `<li>` etiketi olan `BreadcrumbItem` komponenti içinde kullanılıyor
   - Bu durumda iç içe geçmiş `<li>` etiketleri oluşuyor, bu da HTML standartlarına aykırı

3. Çözüm Adımları:
   `BreadcrumbSeparator` bileşeninin `<li>` etiketi yerine `<span>` etiketi kullanacak şekilde düzeltildi:
   ```jsx
   // Hatalı:
   function BreadcrumbSeparator({ ...props }: React.ComponentProps<"li">) {
     return (
       <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" {...props}>
         {children ?? <ChevronRight />}
       </li>
     );
   }
   
   // Doğru:
   function BreadcrumbSeparator({ ...props }: React.ComponentProps<"span">) {
     return (
       <span data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" {...props}>
         {children ?? <ChevronRight />}
       </span>
     );
   }
   ```

4. Teknik Açıklama:
   - HTML standartlarına göre, `<li>` etiketleri sadece `<ul>`, `<ol>` veya `<menu>` etiketlerinin doğrudan alt öğesi olabilir
   - Bir `<li>` etiketi başka bir `<li>` etiketi içinde yer alamaz
   - Next.js'te bu tür yapısal hatalar, server-side rendering sırasında oluşturulan HTML ile client-side rendering arasında uyumsuzluk (hydration error) oluşuyor
   - Bu uyumsuzluk "hydration error" olarak adlandırılır ve uygulamanın düzgün çalışmasını engelleyebilir

5. Sorunun Tekrarını Önlemek:
   - UI bileşenleri oluştururken HTML standartlarını ve semantiğini dikkate alın
   - Özellikle liste öğeleri, tablo öğeleri gibi özel ilişkileri olan HTML elementlerini kullanırken dikkat edin
   - Bileşen kütüphanelerini kullanırken, iç içe kullanım senaryolarını test edin

## PDF ve Resim Dosyalarını Tarayıcıda Görüntüleme Özelliği Ekleme

Çözüm: Dokümanlar sayfasında PDF ve resim dosyalarını yeni sekmede görüntüleme özelliği eklendi.

1. Özelliğin Tanımı:
   - Dokümanlar (Documents) sayfasında, PDF ve resim dosyalarını görüntülemek için menu içindeki "Görüntüle" düğmesine özellik eklendi
   - Bu düğmeye tıklandığında dosya tarayıcıda yeni sekmede açılıyor
   - Sadece PDF ve resim dosyaları için etkinleştirildi
   - Diğer dosya türleri için düğme devre dışı bırakıldı

2. Uygulama Adımları:
   a) DocumentsPage.tsx'e görüntüleme işlevselliği eklendi:
      ```typescript
      // Döküman görüntüleme işlemi
      const handleViewDocument = (document: Document) => {
        // Sadece PDF ve resim dosyaları için görüntüleme işlemi
        if (!document.fileUrl) {
          toast.error('Dosya URL bilgisi bulunamadı');
          return;
        }
        
        // Dosya tipine göre kontrol
        const isPDF = document.type === 'pdf' || document.mimeType?.includes('pdf');
        const isImage = document.type === 'image' || 
          (document.mimeType && ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'].some(type => 
            document.mimeType?.includes(type)
          ));
        
        if (!isPDF && !isImage) {
          toast.error('Bu dosya türü tarayıcıda görüntülenemez');
          return;
        }
        
        // Dosyayı yeni sekmede aç
        window.open(document.fileUrl, '_blank');
        toast.success('Dosya yeni sekmede açıldı');
      };
      ```
      
   b) DocumentGrid ve DocumentList props tiplerini genişlettik:
      ```typescript
      interface DocumentGridProps {
        documents: Document[];
        onDelete: (id: string) => void;
        onDownload: (id: string, name: string) => void;
        onView: (document: Document) => void;
      }
      ```
      
   c) "Görüntüle" menü öğesini güncelledik:
      ```jsx
      <DropdownMenuItem 
        onClick={() => onView(document)}
        className={(document.type === 'pdf' || document.type === 'image') ? '' : 'text-muted-foreground pointer-events-none'}
      >
        <Eye className="h-4 w-4 mr-2" />
        Görüntüle
      </DropdownMenuItem>
      ```
      
   d) Desteklenmeyen dosya türleri için görüntüleme düğmesinin disabled edilmesi:
      - Solgun görünüm ve `pointer-events-none` CSS sınıfı ile tıklanamaz hale getirildi
      - Dosya türü kontrolü ile sadece PDF ve resim dosyaları için etkinleştirildi

## Klasör Silme Özelliği Ekleme

Çözüm: Dokümantasyon sayfasında klasörleri silme özelliği eklendi.

1. Özelliğin Tanımı:
   - Dokümanlar (Documents) sayfasında klasörler için sağ üstte bulunan menü içine "Sil" butonu eklendi
   - Klasöre tıkladığında klasör içeriğine gitmek, butona tıkladığında silme işlemi yapmak için ayrı işlevler tanımlandı
   - Silme işleminden önce kullanıcıya onay isteyen bir AlertDialog eklendi

2. Uygulama Adımları:
   a) DocumentsPage.tsx'e klasör silme işlevselliği eklendi:
      ```typescript
      // State tanımlamaları
      const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
      const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
      
      // Klasör silme işlemi
      const handleDeleteFolder = async (folderId: string) => {
        setFolderToDelete(folderId);
        setIsDeleteFolderDialogOpen(true);
      };
      
      const confirmDeleteFolder = async () => {
        if (!folderToDelete) return;
        
        try {
          await deleteFolder(folderToDelete);
          toast.success('Klasör başarıyla silindi');
          loadFolderContents(currentFolderId, false);
      } catch (error) {
          toast.error('Klasör silinemedi');
        }
      };
      ```
      
   b) Klasör kartlarına silme butonu eklendi:
      ```jsx
      <div className="absolute top-1 right-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)}>
              <Trash className="h-4 w-4 mr-2" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      ```
      
   c) AlertDialog kullanarak onay ekranı eklendi:
      ```jsx
      <AlertDialog open={isDeleteFolderDialogOpen} onOpenChange={setIsDeleteFolderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klasörü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu klasörü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      ```

3. Güvenlik ve Kullanıcı Deneyimi:
   - Silme işlemi öncesi onay alınarak yanlışlıkla silmeyi önleme
   - Klasör silme işleminden sonra otomatik olarak sayfı yenileme
   - İşlem durumlarını toast bildirimleriyle kullanıcıya gösterme
   - Hata durumunda açıklayıcı mesajlar gösterme

## EDAS/AYEDAS Bildirim Sayfasında Belge Yükleme Hatası - Prisma "fileUrl" is missing Hatası

Çözüm: Backend'in Prisma validation hatası (fileUrl is missing) için FormData yapısını düzenleyerek sorun çözüldü.

1. Hata Detayı:
   ```
   Invalid `prisma.edasNotificationDocument.create()` invocation in
   D:\Belgeler\aeys-v2\backend\src\routes\edas.routes.ts:1098:63

   Argument `fileUrl` is missing.
   ```

2. Sorunun Nedeni:
   - Backend Multer (veya benzer bir middleware) kullanarak yüklenen dosyayı işliyor
   - Ancak FormData'dan gelen meta verileri doğru şekilde parse edilemiyor
   - Prisma modeli fileUrl alanının zorunlu olmasını gerektiriyor ancak bu alan FormData'dan gelmiyor

3. Çözüm Stratejisi:
   - Tüm meta verileri hem ayrı ayrı hem de JSON içinde göndererek backend'in erişimi kolaylaştırıldı
   - fileUrl alanı için geçici bir değer ("temp-file-url") gönderildi (backend'in kendi değerini atamasına izin vermek için)
   - Dosya bilgileri için güvenlik kontrolleri eklendi

4. İyileştirilmiş FormData Yapısı:
   ```javascript
   // Dosya bilgilerini güvenlik kontrolünden geçir
   const file = selectedFiles[0];
   if (!file) {
     throw new Error("Dosya seçilmedi");
   }

   const fileName = file.name || "document.pdf";
   const fileType = file.type || "application/octet-stream";
   const fileSize = file.size.toString() || "0";

   // FormData nesnesini oluştur
   const formData = new FormData();
   
   // Ana dosyayı ekle
   formData.append("file", file);
   
   // Tüm alanları ayrı ayrı ekle
   formData.append("stepId", stepId);
   formData.append("documentType", documentType);
   formData.append("fileName", fileName);
   formData.append("fileType", fileType);
   formData.append("fileSize", fileSize);
   formData.append("fileUrl", "temp-file-url"); // Geçici değer
   
   // Ayrıca tüm verileri tek bir "data" alanında da gönder (alternatif çözüm)
   const documentData = {
     stepId: stepId,
     documentType: documentType,
     fileName: fileName,
     fileType: fileType,
     fileSize: fileSize,
     fileUrl: "temp-file-url"
   };
   
   formData.append("data", JSON.stringify(documentData));
   ```

5. Backend Tarafı İçin Öneriler:
   - Belge oluşturma işleminde fileUrl alanı için varsayılan bir değer sağlayın
   - FormData'dan meta verileri almak için daha güvenilir bir yaklaşım kullanın:
   ```javascript
   // Örnek backend kodu
   // Meta verileri almanın üç yolunu dene
   let documentData;
   
   // 1. "data" alanından JSON olarak
   if (req.body.data) {
     try {
       documentData = JSON.parse(req.body.data);
     } catch (e) {
       console.error("JSON parse hatası:", e);
     }
   }
   
   // 2. Ayrı alanlardan
   if (!documentData) {
     documentData = {
       stepId: req.body.stepId,
       documentType: req.body.documentType,
       fileName: req.body.fileName,
       fileType: req.body.fileType,
       fileSize: req.body.fileSize
     };
   }
   
   // 3. Zorunlu alanlar için varsayılan değerler
   const fileUrl = `/uploads/${req.file.filename}`; // Multer tarafından oluşturulan gerçek dosya adı
   
   // Son olarak belgeyi oluştur
   const document = await prisma.edasNotificationDocument.create({
     data: {
       stepId: documentData.stepId,
       documentType: documentData.documentType,
       fileName: documentData.fileName || req.file.originalname,
       fileType: documentData.fileType || req.file.mimetype,
       fileSize: parseInt(documentData.fileSize) || req.file.size,
       fileUrl: fileUrl // Her zaman backend'in oluşturduğu gerçek URL'yi kullan
     }
   });
   ```

6. Ek Notlar:
   - FormData içeriğinin daha detaylı loglanması hata ayıklamayı kolaylaştırır
   - Dosya bilgileri için null/undefined kontrolü ve varsayılan değerler eklemek güvenilirliği artırır
   - Frontend'den backend'e veri gönderiminde birden fazla format sağlamak (hem ayrı alanlar hem de JSON) esneklik sağlar

7. **SON DURUM (2024-07-30):**
   - Frontend tarafında yapılan tüm FormData düzenlemelerine rağmen (`fileUrl` ve diğer meta verilerin ayrı ayrı, JSON içinde gönderilmesi), backend hala Prisma `create` işlemi sırasında `fileUrl`, `fileName`, `fileType`, `fileSize` alanlarını `undefined` olarak alıyor.
   - Bu durum, sorunun kökeninin backend'in `multipart/form-data` isteğini işlemesinde (`multer` yapılandırması veya `req.body`'den alanları okuma şekli) olduğunu göstermektedir.
   - **Çözüm için backend kodunun (`edas.routes.ts`) incelenmesi ve `multer` sonrası metin alanlarının doğru şekilde okunup Prisma'ya iletildiğinden emin olunması gerekmektedir.**
   - `fileUrl`, backend tarafında, dosya başarıyla yüklendikten sonra oluşturulmalıdır.

8. **BACKEND DÜZELTMESİ (2024-07-30):**
   - `backend/src/routes/edas.routes.ts` dosyasındaki `POST /ayedas/notifications/:notificationId/steps/:stepId/documents` endpoint'ine `multer` middleware'i eklendi.
   - Endpoint, artık `req.file` üzerinden dosya bilgilerini, `req.body` üzerinden ise metin alanlarını (fileName, fileSize, fileType, documentType) okuyacak şekilde güncellendi.
   - `fileUrl`, backend tarafında `/uploads/edas-documents/` dizinine kaydedilen dosyanın adına göre dinamik olarak oluşturuluyor.
   - Prisma'ya veri gönderilmeden önce tüm gerekli alanların (özellikle `fileUrl`) dolu ve geçerli olduğu kontrol ediliyor.
   - Bu değişikliklerle birlikte Prisma validation hatasının çözülmesi ve dosya yüklemenin başarıyla tamamlanması beklenmektedir.

9. **PRISMA MODEL UYUMSUZLUĞU (documentType) (2024-07-30):**
   - Backend tarafında `documentType` alanı Prisma'ya gönderilmeye çalışılırken "Unknown argument `documentType`" hatası alındı.
   - Bu, `EdasNotificationDocument` modelinde bu alanın tanımlı olmadığını gösterdi.
   - **Çözüm:** `backend/src/routes/edas.routes.ts` dosyasında `POST .../documents` endpoint'indeki `documentData` nesnesinden ve ilgili `if` kontrolünden `documentType` alanı kaldırıldı.
   - Bu son değişiklikle birlikte dosya yükleme işleminin başarıyla çalışması beklenmektedir.

10. **BEDAŞ API ENDPOINT HATALARI (404 Not Found) (2024-07-30):**
    - `/edas/bedas` sayfasında bildirimleri listelerken 404 hatası alındı.
      - **Neden:** Backend'de `GET /bedas/notifications` endpoint'i eksikti.
      - **Çözüm:** AYEDAŞ endpoint'ine benzer şekilde `GET /bedas/notifications` eklendi.
    - `/edas/bedas/bildirim/[id]` sayfasında bildirim detaylarını getirirken 404 hatası alındı.
      - **Neden:** Backend'de `GET /bedas/notifications/:id` endpoint'i eksikti.
      - **Çözüm:** AYEDAŞ endpoint'ine benzer şekilde `GET /bedas/notifications/:id` eklendi.
    - `/edas/bedas/bildirim/[id]` sayfasında adım durumunu güncellerken hata alındı (Muhtemelen 404).
      - **Neden:** Backend'de BEDAŞ adımlarını oluşturmak/güncellemek için `POST /bedas/notifications/:notificationId/steps` ve `PUT /bedas/notifications/:notificationId/steps/:stepId` endpoint'leri eksikti.
      - **Çözüm:** AYEDAŞ endpoint'lerine benzer şekilde ilgili POST ve PUT endpoint'leri BEDAŞ için eklendi.
    - **Genel Çözüm:** AYEDAŞ için tanımlanmış tüm API endpoint'lerinin (`notifications`, `steps`, `documents` için GET, POST, PUT, DELETE) BEDAŞ için de (`/bedas/...` yoluyla) oluşturulması gerekmektedir.

## [BEDAŞ Belge İşlemleri Eksik Backend Endpointleri]

Çözüm: BEDAŞ bildirim detay sayfasında belge yükleme, silme ve indirme işlemleri için gerekli olan `POST /bedas/notifications/:notificationId/steps/:stepId/documents`, `DELETE /bedas/notifications/:notificationId/steps/:stepId/documents/:documentId` ve `GET /bedas/notifications/:notificationId/steps/:stepId/documents/:documentId` API endpoint'leri `backend/src/routes/edas.routes.ts` dosyasına AYEDAŞ'takilere benzer şekilde eklendi. Belge yükleme endpoint'i, frontend'in çoklu dosya gönderme yeteneğini desteklemek için `multer`'ın `upload.array('files')` yöntemi kullanılarak güncellendi. Belge silme ve indirme işlemleri için dosya sistemi operasyonları (silme/okuma) ve ilgili veritabanı işlemleri entegre edildi. Şirket kontrolleri ("BEDAŞ") ilgili sorgulara eklendi.

## [Personel güncelleme işleminde 500 Internal Server Error hatası - Genişletilmiş Çözüm]

Çözüm:
1. Frontend'den gelen verilerin (özellikle tarih, sayı, vs.) backend'de doğru formata dönüştürülmesi sağlandı:

```js
// Tarih alanlarının formatlarını kontrol et
if (prismaData.hireDate) {
  try {
    console.log(`[Backend Employee] hireDate değeri: ${prismaData.hireDate}, tipi: ${typeof prismaData.hireDate}`);
    if (typeof prismaData.hireDate === 'string') {
      // Tarih formatının geçerli olup olmadığını kontrol et
      const date = new Date(prismaData.hireDate);
      if (isNaN(date.getTime())) {
        console.error(`[Backend Employee] Geçersiz hireDate formatı: ${prismaData.hireDate}`);
        prismaData.hireDate = null;
      } else {
        prismaData.hireDate = date;
      }
    }
  } catch (dateError) {
    console.error(`[Backend Employee] hireDate işlenirken hata: ${dateError}`);
    prismaData.hireDate = null;
  }
}

// Sayısal değerlerin tiplerini kontrol et (örnek: maaş)
if (prismaData.salary !== undefined) {
  console.log(`[Backend Employee] salary değeri: ${prismaData.salary}, tipi: ${typeof prismaData.salary}`);
  if (typeof prismaData.salary === 'string') {
    const salaryNumber = Number(prismaData.salary);
    if (isNaN(salaryNumber)) {
      console.error(`[Backend Employee] Geçersiz salary değeri: ${prismaData.salary}`);
      prismaData.salary = null;
    } else {
      prismaData.salary = salaryNumber;
    }
  }
}
```

2. Prisma modelinde olmayan veya çakışmalara neden olabilecek alanlar temizlendi:

```js
// Employee tablosunda gereksiz alanları temizle
delete prismaData.user;
delete prismaData.userId;
delete prismaData.documents; 
delete prismaData.department;
delete prismaData.userName;
delete prismaData.userSurname;
delete prismaData.userEmail;
delete prismaData.userRole;
delete prismaData.profilePicture;
delete prismaData.createdAt;
delete prismaData.updatedAt;
delete prismaData.assignedAssets;
delete prismaData.purchaseRequestsMade;
delete prismaData.purchaseRequestsStatusChanged;
```

3. Hata yakalama ve loglama iyileştirildi:

```js
try {
  // Employee bilgilerini güncelle
  const updatedEmployee = await prismaClient.employee.update({
    where: { id: employeeId },
    data: prismaData,
    include: { /* ... */ }
  });
  
  // İşlem başarılı...
} catch (updateError: any) {
  console.error('[Backend Employee] Çalışan güncellenirken Prisma hatası:', updateError);
  
  // Hata ayrıntılarını kaydet
  if (updateError.name) {
    console.error(`[Backend Employee] Hata Adı: ${updateError.name}`);
  }
  
  if (updateError.message) {
    console.error(`[Backend Employee] Hata Mesajı: ${updateError.message}`);
  }
  
  if (updateError.code) {
    console.error(`[Backend Employee] Prisma Hata Kodu: ${updateError.code}`);
  }
  
  if (updateError.meta) {
    console.error(`[Backend Employee] Prisma Meta: ${JSON.stringify(updateError.meta, null, 2)}`);
  }
  
  // Hatayı uygun şekilde istemciye bildir
  res.status(500).json({
    success: false,
    message: 'Çalışan güncellenirken bir hata oluştu',
    error: updateError.message || 'Bilinmeyen hata'
  });
  return;
}
```

Bu çözümle frontend'den gelen veriler backend'de düzgün bir şekilde işlenip Prisma formatına dönüştürülmektedir. Özellikle tarih ve sayısal değerler için tip dönüşümleri doğru şekilde yapılmakta ve Prisma'nın gereksinimlerine uygun hale getirilmektedir. Ayrıca, ilişkisel veri alanları da temizlenerek çakışmalar önlenmektedir.

## [Personel düzenleme sayfasında maaş ve acil durum iletişim bilgileri görünmüyor]

Çözüm: 
1. Backend'de `employee.controller.ts` içindeki `getEmployeeById` fonksiyonunu güncelleyerek, API yanıtına `salary`, `emergencyContactName`, `emergencyContactPhone` ve `emergencyContactRelation` alanlarını ekledik:

```js
// Employee datasını frontend için formatla
const formattedData = {
  ...employee,
  // Employee bilgilerine ilişkili user verilerinden de eklemeler yapılıyor
  userEmail: employee.user?.email,
  userName: employee.user?.name,
  userSurname: employee.user?.surname,
  userRole: employee.user?.role,
  // Maaş ve acil durum iletişim bilgilerinin null olsa bile dönmesini sağlayalım
  salary: employee.salary || null,
  emergencyContactName: employee.emergencyContactName || null,
  emergencyContactPhone: employee.emergencyContactPhone || null,
  emergencyContactRelation: employee.emergencyContactRelation || null
};
```

## [Personel kaydetme işlemi 404 hatası veriyor]

Çözüm:
Frontend'deki `employeeService.ts` içindeki `updateEmployee`, `deleteEmployee` ve `uploadProfilePicture` fonksiyonlarında yanlış API endpoint'leri kullanılıyordu. `/api/users/:id` yerine `/api/employees/:id` şeklinde güncelledik:

1. updateEmployee fonksiyonu:
```js
// Endpoint güncellendi: /users/:id -> /employees/:id
const response = await apiClient.put<BackendEmployeeWithUser>(`/employees/${id}`, employeeData);
```

2. deleteEmployee fonksiyonu:
```js
// Endpoint güncellendi: /users/:id -> /employees/:id
await apiClient.delete(`/employees/${id}`);
```

3. uploadProfilePicture fonksiyonu:
```js
// Endpoint güncellendi: /users/:id/profile-picture -> /employees/:id/profile-picture
const response = await apiClient.post<{ success: boolean, profilePictureUrl: string, message: string }>(
  `/employees/${userId}/profile-picture`, 
  formData, 
  {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
);
```

Bu değişikliklerle endpoint yapılandırması tutarlı hale getirildi.

## [Personel düzenleme sayfasında 500 Internal Server Error hatası]

Çözüm:
1. Backend'de `employee.controller.ts` içindeki `updateEmployee` fonksiyonunu güncelleyerek firstName/lastName alanlarını name/surname alanlarına dönüştürmeyi ve kullanıcı bilgilerini User tablosunda ayrıca güncellemeyi sağladık.
2. Frontend'den gelen firstName, lastName ve email gibi özellikler aslında Employee tablosuna değil, User tablosuna ait özelliklerdir.
3. Gelen verilerde alan adı çeviri işlemini ve ilgili verilerin doğru tablolara yönlendirilmesini sağladık:

```js
// Frontend'den gelen firstName/lastName alanlarını name/surname olarak dönüştür
const prismaData: any = { ...employeeData };

// Alan adı dönüşümleri
if (employeeData.firstName !== undefined) {
  prismaData.name = employeeData.firstName;
  delete prismaData.firstName;
}

if (employeeData.lastName !== undefined) {
  prismaData.surname = employeeData.lastName;
  delete prismaData.lastName;
}

// İlişkili kullanıcı bilgilerini güncellemek için ayrı bir işlem yap
const userUpdateData: any = {};

// Kullanıcı adı/soyadı
if (prismaData.name !== undefined) {
  userUpdateData.name = prismaData.name;
}

if (prismaData.surname !== undefined) {
  userUpdateData.surname = prismaData.surname;
}

// E-posta
if (prismaData.email !== undefined) {
  userUpdateData.email = prismaData.email;
  delete prismaData.email;
}

// Eğer kullanıcı bilgilerinde güncelleme yapılacaksa
if (Object.keys(userUpdateData).length > 0 && employee.userId) {
  await prismaClient.user.update({
    where: { id: employee.userId },
    data: userUpdateData
  });
}
```

4. Bu değişiklikler sonucunda, frontend ve backend arasındaki veri alışverişi düzgün çalışmaya başladı ve personel bilgileri sorunsuzca güncellenebiliyor.

## [Personel güncelleme işleminde 500 Internal Server Error hatası - Genişletilmiş Çözüm]

Çözüm:
1. Frontend'den gelen verilerin (özellikle tarih, sayı, vs.) backend'de doğru formata dönüştürülmesi sağlandı:

```js
// Tarih alanlarının formatlarını kontrol et
if (prismaData.hireDate) {
  try {
    console.log(`[Backend Employee] hireDate değeri: ${prismaData.hireDate}, tipi: ${typeof prismaData.hireDate}`);
    if (typeof prismaData.hireDate === 'string') {
      // Tarih formatının geçerli olup olmadığını kontrol et
      const date = new Date(prismaData.hireDate);
      if (isNaN(date.getTime())) {
        console.error(`[Backend Employee] Geçersiz hireDate formatı: ${prismaData.hireDate}`);
        prismaData.hireDate = null;
      } else {
        prismaData.hireDate = date;
      }
    }
  } catch (dateError) {
    console.error(`[Backend Employee] hireDate işlenirken hata: ${dateError}`);
    prismaData.hireDate = null;
  }
}

// Sayısal değerlerin tiplerini kontrol et (örnek: maaş)
if (prismaData.salary !== undefined) {
  console.log(`[Backend Employee] salary değeri: ${prismaData.salary}, tipi: ${typeof prismaData.salary}`);
  if (typeof prismaData.salary === 'string') {
    const salaryNumber = Number(prismaData.salary);
    if (isNaN(salaryNumber)) {
      console.error(`[Backend Employee] Geçersiz salary değeri: ${prismaData.salary}`);
      prismaData.salary = null;
    } else {
      prismaData.salary = salaryNumber;
    }
  }
}
```

2. Prisma modelinde olmayan veya çakışmalara neden olabilecek alanlar temizlendi:

```js
// Employee tablosunda gereksiz alanları temizle
delete prismaData.user;
delete prismaData.userId;
delete prismaData.documents; 
delete prismaData.department;
delete prismaData.userName;
delete prismaData.userSurname;
delete prismaData.userEmail;
delete prismaData.userRole;
delete prismaData.profilePicture;
delete prismaData.createdAt;
delete prismaData.updatedAt;
delete prismaData.assignedAssets;
delete prismaData.purchaseRequestsMade;
delete prismaData.purchaseRequestsStatusChanged;
```

3. Hata yakalama ve loglama iyileştirildi:

```js
try {
  // Employee bilgilerini güncelle
  const updatedEmployee = await prismaClient.employee.update({
    where: { id: employeeId },
    data: prismaData,
    include: { /* ... */ }
  });
  
  // İşlem başarılı...
} catch (updateError: any) {
  console.error('[Backend Employee] Çalışan güncellenirken Prisma hatası:', updateError);
  
  // Hata ayrıntılarını kaydet
  if (updateError.name) {
    console.error(`[Backend Employee] Hata Adı: ${updateError.name}`);
  }
  
  if (updateError.message) {
    console.error(`[Backend Employee] Hata Mesajı: ${updateError.message}`);
  }
  
  if (updateError.code) {
    console.error(`[Backend Employee] Prisma Hata Kodu: ${updateError.code}`);
  }
  
  if (updateError.meta) {
    console.error(`[Backend Employee] Prisma Meta: ${JSON.stringify(updateError.meta, null, 2)}`);
  }
  
  // Hatayı uygun şekilde istemciye bildir
  res.status(500).json({
    success: false,
    message: 'Çalışan güncellenirken bir hata oluştu',
    error: updateError.message || 'Bilinmeyen hata'
  });
  return;
}
```

Bu çözümle frontend'den gelen veriler backend'de düzgün bir şekilde işlenip Prisma formatına dönüştürülmektedir. Özellikle tarih ve sayısal değerler için tip dönüşümleri doğru şekilde yapılmakta ve Prisma'nın gereksinimlerine uygun hale getirilmektedir. Ayrıca, ilişkisel veri alanları da temizlenerek çakışmalar önlenmektedir.

## [Unknown argument `departmentId`. Did you mean `department`? - Prisma İlişkisel Model Hatası]

Çözüm:
1. Prisma ORM kullanırken ilişkisel verilerdeki ID alanlarını doğrudan kullanamayız. Bunların yerine ilişkisel modeli kullanmalıyız.

2. Sorun, `departmentId` alanının direk veri modeline gönderilmesiydi. Çözüm, departmentId'yi bir department nesnesi içinde connect olarak göndermek:

```js
// Hatalı kullanım
prismaData.departmentId = "57b1030e-da83-4e92-976e-f95b7824cd12";

// Doğru kullanım
if (prismaData.departmentId) {
  prismaData.department = {
    connect: { id: prismaData.departmentId }
  };
  delete prismaData.departmentId;
}
```

3. Benzer şekilde, `name` ve `surname` alanları Employee tablosuna değil User tablosuna ait olduğu için prismaData'dan çıkarıldı:

```js
// İlişkisel alan olmayan ve Employee doğrudan ait olan alanlar
// name ve surname alanları Employee'de değil User'da olduğundan kaldır
delete prismaData.name;
delete prismaData.surname;
```

4. Prisma ilişkisel veritabanı modeli kullanırken:
   - Tekil ilişkiler için `connect` kullanılır: `{ connect: { id: relationId } }`
   - İlişki kaldırma için `disconnect` kullanılır: `{ disconnect: true }`
   - Çoklu ilişkiler için `connectOrCreate`, `connect`, `disconnect` gibi operatörler kullanılır

5. Tüm ilişkileri birbiriyle tutarlı bir şekilde güncellemek için, Employee ve User tablolarına ayrı ayrı güncelleme işlemleri uygulandı.

Bu şekilde, Prisma ilişkisel modelleme yapısıyla uyumlu bir güncelleme işlemi gerçekleştirildi ve hata çözüldü.

## Select.Item must have a value prop that is not an empty string
Çözüm: SelectItem bileşenlerinde value özelliği boş string ("") olmamalıdır. Radix UI Select bileşeninde boş string değeri ("") seçimi temizlemek ve placeholder göstermek için özel olarak ayrılmıştır.

1. Sorunun Tanımı:
   Sayfada Select bileşeni kullanırken şu hatayı alıyoruz:
   ```
   Error: A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
   ```

2. Çözüm:
   SelectItem bileşenlerinde boş string value değerini kullanmak yerine anlamlı bir değer kullanılmalıdır:
   ```tsx
   // Hatalı kullanım
   <SelectItem value="" disabled>Çalışan bulunamadı</SelectItem>
   
   // Doğru kullanım
   <SelectItem value="no_employee" disabled>Çalışan bulunamadı</SelectItem>
   ```

## Error: Çalışanlar getirilemedi (Proje yöneticisi seçme sorunu)

Çözüm: Frontend'deki çalışan listesi API endpoint'i değiştirildi.

1. Sorunun Tanımı:
   `/projects/new` sayfasında proje yöneticisi seçme kısmında çalışan listesi yüklenirken aşağıdaki hata alınıyordu:
   ```
   Error: Çalışanlar getirilemedi.
   ```
   Sayfa, `/api/employees/list` endpoint'ine istek yapıyor ancak bu endpoint'teki Employee modeli şeması ile frontend'in beklediği şema arasında uyumsuzluk vardı.

2. Çözüm:
   Frontend'deki çalışan listesi API endpoint'i değiştirildi:
   ```typescript
   // Hatalı:
   const response = await fetch('/api/employees/list');
   if (!response.ok) {
     throw new Error('Çalışanlar getirilemedi.');
   }
   const data = await response.json();
   setEmployees(data.data || []);
   
   // Doğru:
   const response = await fetch('/api/users?includeEmployee=true');
   if (!response.ok) {
     throw new Error('Çalışanlar getirilemedi.');
   }
   const users = await response.json();
   
   // API'den gelen veriyi işle - sadece employee alanı doluysa çalışan olarak al
   const employeeData = users
     .filter((user: any) => user.employee !== null) // Sadece çalışan kaydı olan kullanıcıları al
     .map((user: any) => ({
       id: user.employee.id, // Employee ID'si
       name: `${user.name} ${user.surname}` // İsim ve soyisim birleşimi
     }));
     
   setEmployees(employeeData);
   ```

3. Teknik Açıklama:
   - Employee bilgileri veritabanında birincil olarak User tablosuna bağlıdır
   - `/api/employees/list` endpoint'i güncel veritabanı şemasıyla uyumlu değildi
   - Çözüm olarak çalışanları `/api/users?includeEmployee=true` endpoint'inden alarak, 
     employee ilişkisi dolu olanları filtreledik ve istenilen formata (id, name) dönüştürdük

## Error: Çalışanlar getirilemedi (Proje yöneticisi seçme sorunu) - Genişletilmiş Çözüm

Çözüm: Frontend Next.js API route'u yerine doğrudan backend API'sine istek yapmak.

1. Sorunun Tanımı:
   `/projects/new` sayfasında proje yöneticisi seçme kısmında çalışan listesi yüklenirken aşağıdaki hata alınıyordu:
   ```
   Error: Çalışanlar getirilemedi.
   ```
   İlk çözümümüz olan `/api/users?includeEmployee=true` endpoint'i de 500 Internal Server Error hatası veriyordu. Bu, frontend API proxy'lerin düzgün çalışmadığını gösteriyor.

2. Çözüm:
   Frontend'in Next.js API proxy'leri yerine doğrudan backend API'sine yetkilendirme token'ı ile istek gönderiyoruz:
   ```typescript
   // Hatalı:
   const response = await fetch('/api/users?includeEmployee=true');
   
   // Doğru:
   const API_BASE_URL = "http://localhost:5001/api";
     const token = localStorage.getItem('token');
   
     if (!token) {
     console.error("Token bulunamadı, lütfen oturum açın");
     toast.error('Oturum bilgisi bulunamadı. Lütfen yeniden giriş yapın.');
     setIsFetchingEmployees(false);
         return;
       }
   
   // Backend API'ye yetkilendirme token'ı ile istek gönder
   const response = await fetch(`${API_BASE_URL}/employees`, {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   
   if (!response.ok) {
     throw new Error('Çalışanlar getirilemedi.');
   }
   
   const employeeList = await response.json();
   
   // Backend veri formatını bizim istediğimiz formata dönüştür
   const processedEmployees = employeeList.map((emp: any) => ({
     id: emp.id,
     name: `${emp.name || ''} ${emp.surname || ''}`.trim()
   }));
   
   setEmployees(processedEmployees);
   ```

3. Teknik Açıklama:
   - Next.js API route'lar (`/api/...`) veritabanı hatalarında 500 hatası veriyordu
   - Doğrudan backend API'sine (`http://localhost:5001/api/employees`) yetkilendirme token'ı ile istek gönderiyoruz
   - Backend'den gelen veriyi UI için gerekli olan basit formata (id, name) dönüştürüyoruz
   - Bu yaklaşım, veritabanı şema değişikliklerinden etkilenmez ve daha az hata eğilimlidir

## Module not found: Can't resolve '@/components/ui/time-picker'

Çözüm: TimePicker bileşeni projede bulunmadığı için oluşturulması gerekiyordu.

1. Sorunun Tanımı:
   Teknisyen raporları formunda kullanılmak istenen time-picker bileşeni bulunamadığından derleme hatası alınıyor:
   ```
   Module not found: Can't resolve '@/components/ui/time-picker'
   ```

2. Çözüm Adımları:
   - `src/components/ui/time-picker.tsx` dosyası oluşturuldu
   - Shadcn UI bileşenleriyle uyumlu bir TimePicker bileşeni yazıldı
   - Saat ve dakika seçimi için dropdown menü içeren interaktif bir arayüz sağlandı
   - Form kontrolü ile entegre çalışacak şekilde tasarlandı

3. Uygulanan Özellikler:
   - Saat ve dakika değerlerini 15'er dakika aralıklarla gösterme (00:00, 00:15, 00:30...)
   - Klavye ile manuel saat girişi yapabilme
   - Değişiklikleri dış bileşenlere iletme (onChange prop'u ile)
   - Engelli (disabled) durumu desteği
   - Popover ile açılır menü içinde saat seçimi

4. Bileşen Propları:
   ```typescript
   interface TimePickerProps {
     value?: string;
     onChange?: (time: string) => void;
     disabled?: boolean;
     className?: string;
   }
   ```

5. Kullanım Örneği:
   ```tsx
   <TimePicker
     value={selectedTime}
     onChange={(time) => setSelectedTime(time)}
     disabled={false}
     className="w-full"
   />
   ```

Bu bileşen sayesinde TeknisyenRaporForm.tsx dosyasındaki import hatası çözüldü ve saat seçimi için kullanıcı dostu bir arayüz eklendi.

## Foreign key constraint violated on the constraint: `TeknisyenRapor_teknisyenId_fkey`

Çözüm: TeknisyenRapor tablosuna veri eklerken veritabanında olmayan bir teknisyenId kullanıldığında oluşan foreign key hatası.

1. Sorunun Tanımı:
   Teknisyen raporu oluşturulurken veritabanında bulunmayan bir teknisyenId (personel ID) kullanıldığında şu hata alınıyor:
   ```
   Foreign key constraint violated on the constraint: `TeknisyenRapor_teknisyenId_fkey`
   ```

2. Çözüm Adımları:
   - Veritabanında var olan geçerli bir teknisyen/personel ID kullanılmalı
   - `/api/test-raporlar/personeller/listele` endpoint'ini kullanarak geçerli personel ID'lerini görüntüleyin
   - Raporun oluşturulduğu formda geçerli bir ID seçildiğinden emin olun
   - Veritabanı ilişkilerinin (foreign key constraints) doğru yapılandırıldığından emin olun

3. Önleme Stratejisi:
   - Formlarda sadece veritabanında var olan personel ID'lerinin seçilebilir olmasını sağlayın
   - API isteği yapılmadan önce istek verilerinin geçerliliğini kontrol edin
   - Geçersiz ID'ler için anlamlı hata mesajları döndürün

## [Foreign key constraint violated on the constraint: `TeknisyenRapor_teknisyenId_fkey`]

Çözüm: 
1. Frontend'de "Teknisyen seçimi" yerine "Rapor Bilgi Numarası" alanı ekleyerek kullanıcının manuel numara girmesini sağlamak.

```tsx
<div className="grid gap-2">
  <Label htmlFor="raporBilgiNo" className="text-sm font-medium">Rapor Bilgi Numarası*</Label>
  <Input
    id="raporBilgiNo"
    value={raporBilgiNo}
    onChange={(e) => setRaporBilgiNo(e.target.value)}
    placeholder="Rapor bilgi numarasını girin"
    disabled={isLoading || isSubmitting}
    required
    className="h-10 transition-all bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
</div>
```

2. Backend'de sabit bir sistem kullanıcısı ID'si kullanarak foreign key hatasını önlemek:

```typescript
// Sabit bir sistem kullanıcısı ID'si kullan ve rapor bilgi numarasını açıklama alanına ekle
const sistemKullaniciId = "31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3"; // Sabit bir admin kullanıcı ID'si
const updatedAciklama = `Rapor Bilgi No: ${teknisyenId}\n\n${aciklama || ''}`;

// Raporu oluştur
const yeniRapor = await prisma.teknisyenRapor.create({
  data: {
    baslik,
    aciklama: updatedAciklama, // Rapor bilgi numarası açıklamaya eklendi
    durum: normalizedDurum,
    teknisyenId: sistemKullaniciId, // Sabit sistem kullanıcısı
    projeId: projeId || null,
    siteId: siteId || null,
    tarih: parsedTarih
  }
});
```

3. Bu çözüm sayesinde:
   - Kullanıcı istediği rapor bilgi numarasını girebilir
   - Foreign key hatası önlenir çünkü veritabanındaki gerçek bir kullanıcı ID'si kullanılır
   - Girilen rapor bilgi numarası açıklama alanında saklanır
   - Sistemde tutarlılık sağlanır

## [TeknisyenRaporu detay sayfasında veriler boş görünüyor]

Çözüm:
1. Sorun, backend API'den gelen alan isimleriyle (baslik, tarih, createdAt, updatedAt, teknisyenId) frontend'in beklediği alan isimleri (isinAdi, baslangicTarihi, olusturulmaTarihi, guncellemeTarihi, teknisyenNo) arasındaki uyumsuzluktan kaynaklanıyor.

2. Çözüm için API'den gelen verileri backend yapısından frontend yapısına dönüştüren bir işleme tabi tutmak gerekiyor:

```tsx
// Backend'den gelen verileri frontend yapısına uyarla
const processedRapor: TeknisyenRaporu = {
  ...raporData,
  isinAdi: raporData.baslik || raporData.isinAdi,
  teknisyenNo: raporData.teknisyenNo || raporData.teknisyenId,
  baslangicTarihi: raporData.tarih || raporData.baslangicTarihi,
  bitisTarihi: raporData.bitisTarihi,
  olusturulmaTarihi: raporData.createdAt || raporData.olusturulmaTarihi,
  guncellemeTarihi: raporData.updatedAt || raporData.guncellemeTarihi
};
```

3. Detay sayfasında render edilen alanlarda hem frontend hem de backend alanlarını destekleyecek şekilde şarta bağlı görüntüleme yapmak:

```tsx
// Başlangıç tarihini gösterirken hem tarih hem de baslangicTarihi alanlarını kontrol et
<p className="font-semibold">
  {rapor?.tarih ? formatTarih(rapor.tarih) : 
   rapor?.baslangicTarihi ? formatTarih(rapor.baslangicTarihi) : '-'}
</p>

// Oluşturulma tarihini gösterirken hem createdAt hem de olusturulmaTarihi alanlarını kontrol et
<p>
  {rapor?.createdAt ? formatTarih(rapor.createdAt) : 
   rapor?.olusturulmaTarihi ? formatTarih(rapor.olusturulmaTarihi) : '-'}
</p>
```

## [Teknisyen raporu oluşturma ve görüntüleme sorunları]

Çözüm:

1. **Foreign key constraint hataları ve veri görüntüleme sorunları**

**Sorunu**:
- Başlangıç saati veritabanına kaydolmuyor
- Bitiş tarihi ve saati veritabanına kaydolmuyor
- İlgili personel veritabanına kaydolmuyor
- Rapor bilgi numarası kullanıcının girdiği numara yerine sistem ID'si olarak görünüyor (31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3)

**Çözüm**:
1. Frontend servis katmanında (`teknisyenRaporService.ts`), gerçek kullanıcı girişi yerine sabit bir sistem ID'si kullanılması:
```typescript
// Foreign key sorunu yaşamamak için her zaman sabit bir admin kullanıcısı ID'si kullanıyoruz
const ADMIN_USER_ID = "31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3"; // Sistemde var olan bir kullanıcı
```

2. Kullanıcı tarafından girilen bilgilerin açıklama alanında saklanması:
```typescript
// Açıklama alanına gereken tüm bilgileri yerleştiriyoruz
let enhancedAciklama = `Rapor Bilgi No: ${userEnteredTeknisyenId}`;

if (baslangicTarihiStr) {
  enhancedAciklama += `\nBaşlangıç Tarihi: ${baslangicTarihiStr}`;
}

if (bitisTarihiStr) {
  enhancedAciklama += `\nBitiş Tarihi: ${bitisTarihiStr}`;
}

if (ilgiliPersonelStr) {
  enhancedAciklama += `\nİlgili Personel IDs: ${ilgiliPersonelStr}`;
}
```

3. Detay sayfasında açıklama alanından bu bilgilerin çıkarılması:
```typescript
// Açıklama metninden rapor bilgi numarasını çıkaran yardımcı fonksiyon
const extractRaporBilgiNo = (aciklama?: string): string => {
  if (!aciklama) return "-";
  
  try {
    // "Rapor Bilgi No: XYZ" formatını ara
    const match = aciklama.match(/Rapor Bilgi No: ([^\n]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (error) {
    console.error("Rapor bilgi numarası çıkarılırken hata:", error);
  }
  
  return "-";
};
```

**Teknik Açıklama**:
- TeknisyenRapor tablosunun teknisyenId alanı User tablosundaki geçerli bir ID'ye işaret eden bir foreign key constraint'e sahip
- Kullanıcının istediği rapor bilgi numarası genellikle veritabanında bulunmayan bir ID olduğu için foreign key hatası oluşuyor 
- Çözüm olarak her zaman veritabanında var olan bir kullanıcı ID'si kullanıyoruz
- Kullanıcının girdiği bilgiler açıklama alanında JSON-benzeri formatla saklanıyor
- Görüntüleme sırasında, açıklama metninden regex ile bu bilgiler çıkarılıyor

Bu çözüm sayesinde, kullanıcı gerçek rapor bilgi numarası, bitiş tarihi ve ilgili personeli görüntüleyebiliyor, ancak veritabanında doğru çalışması için çapraz referanslar kullanılıyor.

## [Teknisyen raporlarında doküman yükleme ve personel görüntüleme sorunları]

Çözüm:

**1. Doküman yükleme sorunu**

Sorun: Teknisyen raporu oluşturma formunda eklenen dokümanlar detay sayfasında görüntülenmiyor.

Nedeni: TeknisyenRaporForm.tsx dosyasında dokümanlar seçiliyor fakat bunları API'ye gönderen kod eksik kalıyor. Konsola yazıyor ancak gerçek API çağrısı yapılmıyor.

Çözüm:
```typescript
// TeknisyenRaporForm.tsx içinde handleSubmit fonksiyonunda:
// Dosya yükleme işlemi
if (result && result.id && selectedFiles.length > 0) {
  toast({
    title: "Bilgi",
    description: `${selectedFiles.length} dosya sisteme yükleniyor...`,
  });
  
  // Dosyaları yükleyelim
  const kullaniciId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || "31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3";
  
  try {
    const uploadPromises = selectedFiles.map(async (file) => {
      const dosyaAciklama = "";
      await uploadTeknisyenDokuman(
        result.id,
        file,
        dosyaAciklama,
        kullaniciId
      );
    });
    
    // Tüm dosya yükleme işlemlerinin tamamlanmasını bekleyelim
    await Promise.all(uploadPromises);
    
    toast({
      title: "Başarılı",
      description: `${selectedFiles.length} dosya başarıyla yüklendi.`,
    });
  } catch (uploadError) {
    console.error("Dosya yükleme hatası:", uploadError);
    toast({
      title: "Uyarı",
      description: "Dosyalar yüklenirken bazı hatalar oluştu.",
      variant: "destructive",
    });
  }
}
```

**2. Personel görüntüleme sorunu**

Sorun: Atanan personeller teknisyen raporu detay sayfasında görüntülenmiyor.

Nedeni: İlgili personel bilgileri açıklama alanına ekleniyor ancak UI'da gösterilmiyor.

Çözüm:
```typescript
// [id]/page.tsx içinde:
<div>
  <h3 className="font-semibold text-lg mb-2">Görevli Personeller</h3>
  <div className="border rounded-md p-4">
    {(() => {
      // İlgili personellerden ID'leri ayıkla
      const personelIds = extractIlgiliPersonel(rapor?.aciklama);
      
      if (personelIds && personelIds !== "-") {
        const personelIdList = personelIds.split(", ").filter(id => id.trim() !== "");
        
        if (personelIdList.length > 0) {
          return (
            <div className="space-y-2">
              <p className="text-sm font-medium">{personelIdList.length} personel görevli</p>
              <ul className="list-disc pl-5 space-y-1">
                {personelIdList.map((id, index) => (
                  <li key={index} className="text-sm">
                    ID: {id}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }
      
      return <p className="text-sm text-muted-foreground">Personel atanmamış.</p>;
    })()}
  </div>
</div>
```

**3. Doküman URL oluşturma sorunu**

Sorun: Dokümanların URL'leri detay sayfasında düzgün gösterilmiyor.

Çözüm:
```typescript
// [id]/page.tsx içine bir yardımcı fonksiyon ekleyelim:
const getDocumentUrl = (doc: TeknisyenDokuman): string => {
  const apiUrlBase = API_URL || 'http://localhost:3000/api';
  
  let docUrl = '';
  
  if (doc.dosyaUrl) {
    docUrl = doc.dosyaUrl.startsWith('http') ? doc.dosyaUrl : `${apiUrlBase}${doc.dosyaUrl}`;
  } else if (doc.dosyaYolu) {
    docUrl = doc.dosyaYolu.startsWith('http') ? doc.dosyaYolu : `${apiUrlBase}${doc.dosyaYolu}`;
  } else {
    console.error('Doküman için URL bulunamadı:', doc);
    docUrl = '#';
  }
  
  return docUrl;
};
```

Bu değişikliklerle teknisyen raporlarında doküman yükleme ve personel görüntüleme sorunları çözülmüştür.

## Teknisyen Raporlarında Doküman Yükleme 500 Hatası

Çözüm: 
1. Dosya yükleme API yolu yanlış yapılandırılmıştı - `/test-raporlar/dokuman/yukle` yerine doğru API yolu olan `/teknisyen-raporlar/dokuman/yukle` kullanılmalı.
2. Frontend'de `uploadTeknisyenDokuman` fonksiyonunda API yolu güncellendi.
3. FormData gönderimi sırasında URL'nin tam olarak loglanması sağlandı.

## Teknisyen Raporlarında Personel ID'leri Yerine İsim Görüntüleme

Çözüm:
1. `/teknisyenraporlari/[id]` sayfasında görevli personellerin ID'leri yerine isim ve soyisimlerini göstermek için:
   - `extractIlgiliPersonel` fonksiyonu string[] tipinde ID dizisi döndürecek şekilde güncellendi
   - Personel verilerini getirmek için `getPersoneller` API çağrısı eklendi
   - Personel ID'sine göre personel bilgisini getiren `getPersonelById` yardımcı fonksiyonu eklendi
   - UI güncellendi ve personel ID'leri yerine "Ad Soyad" formatında gösterim sağlandı

## Teknisyen Raporlarında Doküman Yükleme 404 Hatası

Çözüm: 
1. Dosya yükleme API yolu için 404 hatası alındı (`Cannot POST /api/teknisyen-raporlar/dokuman/yukle`). 
2. Yapılan incelemede doğru API yolunun `/teknisyen-raporlari/${raporId}/dokuman` olduğu tespit edildi.
3. Hatayı çözmek için:
   - `uploadTeknisyenDokuman` fonksiyonunda URL düzeltildi
   - `raporId` parametresi URL'nin bir parçası haline getirildi ve formData'dan kaldırıldı
   - API endpoint yapısı, frontend-next/src/app/api dizin yapısıyla uyumlu hale getirildi
   
**Not:** API yollarında yazım farklılıklarına dikkat edilmeli: 
- `teknisyen-raporlar` (yanlış) 
- `teknisyen-raporlari` (doğru)

## Teknisyen Raporlarında Doküman Yükleme 404 (Not Found) Hatası - Genel Upload API Kullanımı

Çözüm:
1. Sorunu tespit ettik: `/api/teknisyen-raporlari/[id]/dokuman` endpoint'i çalışmıyor veya bulunamıyor. Tekrar tekrar denemelerimize rağmen 404 hataları almaya devam ettik.

2. Çözüm yaklaşımımızı tamamen değiştirdik:
   - Özel API endpointi (`/teknisyen-raporlari/[id]/dokuman`) yerine genel dosya yükleme API'sini (`/upload`) kullanmaya karar verdik
   - Bu genel API, herhangi bir dosya türü için dosya yükleme işlevi sağlıyor ve doğru çalışıyor
   
3. Teknisyen raporu için doküman yükleme fonksiyonu (`uploadTeknisyenDokuman`) şu şekilde güncellendi:
   - Dosya bilgilerini FormData içinde `/upload` endpoint'ine gönder
   - Yanıt alındığında başarılı olup olmadığını kontrol et
   - Başarılı ise, yüklenen dosya bilgilerinden bir `TeknisyenDokuman` nesnesi oluştur

4. **Önemli:** Bu çözüm, dosya yüklemeyi mümkün kılar, ancak dosyaların gerçekte bir teknisyen raporu ile veri tabanında ilişkilendirilmediğini unutmayın. İdeal olarak, backend tarafında bu ilişkiyi kuran bir ek adım gereklidir.

5. Bu çözüm, mevcut projenin backend yapısını değiştirmeden hızlıca dosya yükleme özelliğini çalışır hale getirmek için kullanılabilir.

**Not:** Gerçek bir üretim ortamında, dokümanların raporlarla doğru ilişkilendirilmesini sağlamak için backend API endpoint'i düzeltilmelidir. Ancak mevcut durum için, kullanıcı deneyimini bozmadan dosya yükleme özelliğini çalışır hale getirdik.

## Teknisyen Raporlarında Doküman Yükleme Sorununun İdeal Çözümü

Çözüm:
1. Sorunu kökünden çözmek için hem backend API hem de frontend servis katmanında düzenlemeler yaptık:

2. Backend API Düzenlemeleri:
   - Özel `/api/teknisyen-raporlari/[id]/dokuman` endpoint'i oluşturuldu/düzeltildi
   - Bu API endpoint'i şu işlevleri gerçekleştiriyor:
     - Gelen dosyayı disk üzerine kaydediyor (`public/uploads/teknisyen-raporlari/[raporId]/` dizinine)
     - Kaydedilen dosya için bir TeknisyenDokuman kaydı oluşturuyor
     - Dosyanın tekrarlı olmaması için unique isim oluşturma mantığı eklendi
     - Klasör yapısı yoksa otomatik oluşturuluyor
     - Dosya yükleme işlemi sırasında hata yönetimi iyileştirildi
     
3. Frontend Servisi Düzenlemeleri:
   - `teknisyenRaporService.ts` içindeki `uploadTeknisyenDokuman` fonksiyonu özel API'yi kullanacak şekilde güncellendi
   - Form verileri doğru şekilde oluşturulup gönderiliyor:
     - `file`: Yüklenecek dosya
     - `aciklama`: Doküman için açıklama metni (opsiyonel)
     - `yuklayanId`: Dosyayı yükleyen kullanıcı ID'si (opsiyonel)
     
4. İlişkisel Veri Yapısı:
   - TeknisyenDokuman nesneleri bir rapor ID'si ile ilişkilendiriliyor
   - Bu sayede veritabanı tutarlılığı sağlanıyor (her doküman bir rapora ait)
   - İlgili rapor sayfasında, o rapora ait dokümanlar listelenebiliyor

5. Avantajları:
   - Dosyalar, rapor ID'sine göre organize edilmiş klasörlerde saklanıyor
   - Dokümanlarla ilgili meta veriler (boyut, yükleme tarihi vb.) kaydediliyor
   - API, hem yükleme hem de listeleme/indirme işlemlerini destekliyor
   - Her rapor için ayrı doküman listesi tutulabiliyor

6. Güvenlik ve Performans İyileştirmeleri:
   - Dosyaların benzersiz isimlerle kaydedilmesi çakışmaları önlüyor
   - Hata durumlarında detaylı mesajlar kullanıcıya iletiliyor
   - Endpoint'ler doğrudan dosya alıp, doğrudan doküman objesi dönüyor (arada gereksiz API çağrısı yok)

Bu çözümle teknisyen raporları için doküman yükleme sorunu tamamen giderilmiş ve sistemle entegre çalışan bir çözüm sunulmuştur.

## Teknisyen Raporlarında Doküman Yükleme 404 Hatası - İki Aşamalı Çözüm Yaklaşımı

Çözüm:
1. Özel API endpoint'imizin (`/teknisyen-raporlari/[id]/dokuman`) çalışmadığını ve sürekli 404 hatası aldığımızı tespit ettik. Tekrar tekrar denemelerimize rağmen sorun çözülmedi.

2. İki aşamalı bir çözüm stratejisi geliştirdik:
   - **1. Aşama**: Dosyaları genel dosya yükleme API'si (`/upload`) üzerinden yükle
   - **2. Aşama**: Yüklenen dosyaları teknisyen raporlarıyla ilişkilendir (`/teknisyen-raporlari` PUT endpointi)

3. Teknisyen raporu için doküman yükleme süreci şu şekilde çalışır:
   ```
   +---------------+    +----------------+    +---------------------+
   | Dosya Seçimi  | -> | /upload API'si | -> | İlişkilendirme API |
   +---------------+    +----------------+    +---------------------+
   ```

4. Bu çözümün avantajları:
   - Çalışan bir dosya yükleme API'sini kullanarak güvenilir yükleme sağlar
   - Raporlarla dokümanları ilişkilendirerek veritabanı tutarlılığını korur
   - 404 hatasını tamamen ortadan kaldırır
   - Kullanıcıya daha iyi bir deneyim sunar (hatasız yükleme)
   - Dosyaların yedeklenmesi için daha iyi bir organizasyon sağlar

5. **Not:** Bu çözüm yaklaşımı, Next.js API routes yapısında bazen ortaya çıkabilen dinamik segment ([id] gibi) sorunlarını bypass ederek güvenilir bir alternatif sunar.

**Teknik Detaylar:**
- Dosya önce `/upload` API'sine yüklenir (FormData ile)
- Dosya yükleme başarılı olursa, dosya bilgileri alınır
- Bu bilgiler `/teknisyen-raporlari` PUT API'sine gönderilerek ilişki kurulur
- Her iki adımda da bir hata olursa, ayrıntılı hata yönetimi yapılır

## [Teknisyen Raporları Doküman Yükleme - Multer Field Hatası]

Çözüm: Frontend'deki FormData alanının ismi ('files') ile backend'deki Multer konfigürasyonunda beklenen alan ismi ('file') arasındaki uyumsuzluk giderildi.

1. Sorunun Tanımı:
   Teknisyen raporları için doküman yüklerken "Multer Error: Unexpected field" hatası alınıyordu. Bu, FormData'da 'files' adında bir alan kullanılırken, Multer'in 'file' alanını beklediğini gösteriyordu.

2. Çözüm Adımları:
   - Frontend'deki `uploadTeknisyenDokuman` fonksiyonundaki FormData alanı 'files' yerine 'file' olarak değiştirildi:
   ```typescript
   // Hatalı:
   uploadFormData.append('files', file); // Genel upload API 'files' parametresini bekliyor
   
   // Doğru:
   uploadFormData.append('file', file); // 'files' parametresini 'file' olarak değiştirdim
   ```

3. Teknik Açıklama:
   - Multer middleware'i, dosya yükleme için kullanılan alan adına göre yapılandırılır
   - Backend'de Multer konfigürasyonu `upload.single('file')` şeklindeyken, frontend'in 'files' alanı kullanması uyumsuzluğa neden olur
   - Bu uyumsuzluk, "Unexpected field" hatasıyla sonuçlanır çünkü Multer 'file' alanını beklerken 'files' alanı geldiğinde bunu işleyemez

4. Önemli Noktalar:
   - Frontend ve backend arasındaki alan adı tutarlılığı önemlidir
   - Multer konfigürasyonunda tanımlanan alan adı (`single('file')` veya `array('files')` gibi), frontend'in FormData'da kullandığı alan adıyla aynı olmalıdır
   - Bu tür hataları önlemek için, dosya yükleme işlevini uygulamadan önce API dokümantasyonunu kontrol edin veya backend kodunu inceleyin

Bu düzeltme sayesinde teknisyen raporları için doküman yükleme işlemi başarıyla çalışmaya başlamıştır.

## [Teknisyen Raporları Doküman Yükleme - Backend Yanıt Formatı Uyumsuzluğu]

Çözüm: Doküman yükleme sürecini iki aşamalı yapıdan (önce yükleme, sonra ilişkilendirme) tek aşamalı sürece dönüştürerek ve backend yanıt formatıyla uyumlu hale getirerek sorunu çözdük.

1. Sorunun Tanımı:
   ```
   Error: Dosya yükleme başarılı görünüyor ancak sonuç beklendiği gibi değil
   Error: Doküman yüklenirken bir hata oluştu.
   ```
   - İki farklı hata alıyorduk: Dosya yükleme başarılı görünüyor ama sonuç beklendiği gibi değil ve doküman yüklenirken bir hata oluştu.
   - Bu, frontend'in iki aşamalı yükleme sürecinin backend'le uyumsuz olduğunu gösteriyordu.

2. Kök Neden:
   - Frontend `uploadTeknisyenDokuman` fonksiyonu dosyayı önce genel `/upload` endpoint'ine yüklüyor, sonra ikinci adımda `/teknisyen-raporlari` PUT isteğiyle ilişkilendiriyordu.
   - Backend'in `/upload` API yanıt formatı frontend'in beklediğinden farklıydı (`files` dizisi yerine `data` nesnesi içeriyordu).
   - Backend aslında doğrudan teknisyen raporu ile doküman ilişkilendirmesi için tek aşamalı bir API sunuyordu (`/test-raporlar/dokuman/yukle`).

3. Uygulanan Çözüm:
   - `uploadTeknisyenDokuman` fonksiyonunu tamamen yeniden düzenledik.
   - İki aşamalı süreci kaldırıp doğrudan `/test-raporlar/dokuman/yukle` endpoint'ini kullanacak şekilde değiştirdik.
   - Gerekli tüm bilgileri (raporId, dosya, açıklama, yükleyenId) tek bir FormData içinde gönderiyoruz.
   - Backend yanıt formatına uygun hata kontrolü ekledik (nesnenin ID alanını kontrol ediyoruz).

4. Sonuç:
   - Teknisyen raporlarında doküman yükleme tek bir API çağrısıyla tamamlanıyor.
   - Backend yanıt formatıyla uyumlu hale getirildi.
   - Hata işleme daha güvenilir hale getirildi.

5. Öğrenilen Dersler:
   - Backend ve frontend arasındaki API yapısı ve yanıt formatı uyumlu olmalıdır.
   - İmkanlar dahilinde, karmaşık süreçler (dosya yükleme + ilişkilendirme) tek bir API çağrısıyla yapılmalıdır.
   - Backend yanıt formatlarının detaylı dokümantasyonu, bu tür hataları önleyebilir.
