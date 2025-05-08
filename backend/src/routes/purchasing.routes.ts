import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma'; // Prisma client import
import { Prisma, PrismaClient } from '@prisma/client'; // Prisma tipleri

// Kimlik doğrulama middleware'i
import { authenticateToken } from '../middlewares/auth.middleware'; // Yorumdan çıkarıldı

const router = express.Router();

// --- Middleware (Tüm Rotalar İçin Kimlik Doğrulama) ---
router.use(authenticateToken); // Yorumdan çıkarıldı - Tüm /purchasing rotaları kimlik doğrulaması gerektirir

// --- Helper Functions ---

// Benzersiz Talep Numarası Üretme Fonksiyonu
async function generateRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const lastRequest = await prisma.purchaseRequest.findFirst({
    where: {
      requestNumber: {
        startsWith: `PR-${currentYear}-`
      }
    },
    orderBy: {
      requestNumber: 'desc'
    },
    select: { requestNumber: true }
  });

  let nextNumber = 1;
  if (lastRequest?.requestNumber) {
    try {
      const lastNumberStr = lastRequest.requestNumber.split('-')[2];
      const lastNumber = parseInt(lastNumberStr);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    } catch (e) {
      console.error("Error parsing last request number:", e);
      // Hata durumunda veya beklenmedik formatta fallback
      const count = await prisma.purchaseRequest.count({
        where: { requestNumber: { startsWith: `PR-${currentYear}-` } }
      });
      nextNumber = count + 1;
    }
  }
  return `PR-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
}


// --- Rotalar ---

// GET: Tüm Satın Alma Taleplerini Listele
// router.get('/requests', authenticateToken, async (req: Request, res: Response) => { // router.use kullandığımız için burada tekrar gerek yok
router.get('/requests', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id; // Middleware sayesinde req.user kullanılabilir
  // TODO: Yetkilendirme ekle (örn: sadece kullanıcının departmanı veya tümü)
  console.log(`[Purchasing API] Kullanıcı ${userId} tüm talepleri listeliyor...`);
  try {
    const purchaseRequests = await prisma.purchaseRequest.findMany({
      include: {
        department: { select: { id: true, name: true } },
        requester: { // Employee ilişkisi
          select: {
            id: true, // Employee ID
            user: { // Employee içindeki User ilişkisi
              select: {
                name: true, // User'dan name
                surname: true // User'dan surname
              }
            }
          }
        },
        items: { select: { id: true, itemName: true, quantity: true, unit: true } } // Temel kalem bilgileri
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`[Purchasing API] ${purchaseRequests.length} adet talep bulundu.`);
    // Yanıtı dönüştürerek requester.name ve requester.surname alanlarını ekleyebiliriz (opsiyonel)
    const formattedRequests = purchaseRequests.map(req => ({
      ...req,
      requesterName: `${req.requester?.user?.name || ''} ${req.requester?.user?.surname || ''}`.trim(),
    }));

    res.json({ success: true, data: formattedRequests }); // Dönüştürülmüş veriyi gönder
  } catch (error: any) {
    console.error("[Purchasing API] Talepler listelenirken hata:", error);
    res.status(500).json({ success: false, message: "Talepler listelenirken bir hata oluştu.", error: error.message });
  }
});

// POST: Yeni Satın Alma Talebi Oluştur
// router.post('/requests', authenticateToken, async (req: Request, res: Response) => { // router.use kullandığımız için burada tekrar gerek yok
router.post('/requests', async (req: Request, res: Response) => {
  // Kimlik doğrulama middleware'i sayesinde req.user kesinlikle tanımlı olmalı
  const requesterId = req.user!.id; // Middleware eklendiği için ! (non-null assertion) kullanılabilir
  console.log(`[Purchasing API] Kullanıcı ${requesterId} yeni talep oluşturuyor:`, req.body);
  
  // if (!requesterId) { ... } kontrolü artık gereksiz çünkü middleware bunu zaten yapıyor.

  try {
    const { departmentId, projectId, reason, requiredDate, notes, items } = req.body;
    console.log("[Purchasing API] Yeni talep oluşturma isteği alındı:", req.body);

    // --- Temel Validasyon ---
    if (!departmentId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Departman ID ve en az bir malzeme kalemi zorunludur." });
    }
    for (const item of items) {
        if (!item.itemName || !item.quantity || !item.unit || isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
            return res.status(400).json({ success: false, message: "Her malzeme kalemi için itemName, quantity (pozitif sayı) ve unit zorunludur." });
        }
        if (item.estimatedPrice && isNaN(parseFloat(item.estimatedPrice))) {
             return res.status(400).json({ success: false, message: "Tahmini fiyat geçerli bir sayı olmalıdır." });
        }
    }
    // --- /Validasyon ---

    // İlişkili kayıtların varlığını kontrol et (Departman, Proje, İstek Sahibi)
    const employeeExists = await prisma.employee.findUnique({ where: { id: requesterId } });
    const departmentExists = await prisma.department.findUnique({ where: { id: departmentId } });
    let projectExists = true; // Varsayılan olarak true, eğer projectId varsa kontrol edilecek
    const specialProjectIds = ["CENTRAL_OFFICE", "OTHER"]; // Özel ID'ler

    if (projectId && !specialProjectIds.includes(projectId)) {
       projectExists = !!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }));
    }

    if (!employeeExists || !departmentExists || !projectExists) {
        let missing = [];
        if (!employeeExists) missing.push("İstek Sahibi");
        if (!departmentExists) missing.push("Departman");
        if (!projectExists) missing.push("Proje");
         return res.status(404).json({ success: false, message: `İlişkili kayıt bulunamadı: ${missing.join(', ')}` });
    }

    // Talep Numarası Üret
    const requestNumber = await generateRequestNumber();
    console.log('[Purchasing API] Üretilen talep numarası:', requestNumber);

    // Veritabanı İşlemi (Transaction)
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      const request = await tx.purchaseRequest.create({
        data: {
          requestNumber,
          requesterId: requesterId,
          departmentId: departmentId,
          projectId: specialProjectIds.includes(projectId) ? null : projectId, // Özel ID'ler için null kaydet
          reason: reason || null,
          requiredDate: requiredDate ? new Date(requiredDate) : null,
          notes: notes || null,
          status: 'PENDING', // Varsayılan durum
        },
      });

      console.log('[Purchasing API] Talep oluşturuldu:', request.id);

      const itemCreations = items.map((item: any) =>
        tx.purchaseRequestItem.create({
          data: {
            purchaseRequestId: request.id,
            itemName: item.itemName,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            estimatedPrice: item.estimatedPrice ? parseFloat(item.estimatedPrice) : null,
            notes: item.notes || null,
          },
        })
      );

      const createdItems = await Promise.all(itemCreations);
      console.log(`[Purchasing API] ${createdItems.length} adet malzeme kalemi oluşturuldu.`);

      return { request, items: createdItems };
    });

    res.status(201).json({
      success: true,
      message: "Satın alma talebi başarıyla oluşturuldu.",
      data: result, // Oluşturulan talep ve kalemleri döndür
    });

  } catch (error: any) {
    console.error("[Purchasing API] Talep oluşturulurken hata:", error);
     // Prisma unique constraint hatası (örn: requestNumber zaten varsa - pek olası değil ama kontrol edilebilir)
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'Benzersiz alan çakışması.',
            error: `Alan(lar): ${(error.meta?.target as string[])?.join(', ')}`
        });
    }
    res.status(500).json({ success: false, message: "Talep oluşturulurken bir sunucu hatası oluştu.", error: error.message });
  }
});

// GET: Tek Bir Satın Alma Talebini Getir
// router.get('/requests/:id', authenticateToken, async (req: Request, res: Response) => {
router.get('/requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  console.log(`[Purchasing API] Kullanıcı ${userId}, ID: ${id} talep detayını istiyor...`);
  try {
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        requester: { select: { id: true, user: { select: { name: true, surname: true, email: true } } } },
        statusChangedBy: { select: { id: true, user: { select: { name: true, surname: true } } } },
        items: true, // Tüm kalem detayları
      },
    });

    if (!purchaseRequest) {
      return res.status(404).json({ success: false, message: "Satın alma talebi bulunamadı." });
    }

    // TODO: Yetkilendirme ekle (örn: sadece kendi talebi veya departman yöneticisi görebilir)

    console.log(`[Purchasing API] ID: ${id} talebi başarıyla bulundu.`);
    res.json({ success: true, data: purchaseRequest });

  } catch (error: any) {
    console.error(`[Purchasing API] ID: ${id} talebi getirilirken hata:`, error);
    res.status(500).json({ success: false, message: "Talep detayları getirilirken bir hata oluştu.", error: error.message });
  }
});

// DELETE: Satın Alma Talebini Sil
// router.delete('/requests/:id', authenticateToken, async (req: Request, res: Response) => {
router.delete('/requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  console.log(`[Purchasing API] Kullanıcı ${userId}, ID: ${id} talebini silme isteği...`);

  // if (!userId) { ... } kontrolü gereksiz

  try {
    // Talebi bul ve silme yetkisini kontrol et (örn: sadece talep sahibi veya admin silebilir)
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      select: { id: true, requesterId: true, status: true } // Sadece gerekli alanları seç
    });

    if (!purchaseRequest) {
      return res.status(404).json({ success: false, message: "Silinecek talep bulunamadı." });
    }

    // Yetkilendirme Kontrolü (Örnek: Sadece talep sahibi ve PENDING durumundayken silebilir)
    // TODO: Rol bazlı yetkilendirme ekle (Admin vb.)
    if (purchaseRequest.requesterId !== userId && purchaseRequest.status !== 'PENDING') {
        return res.status(403).json({ success: false, message: "Bu talebi silme yetkiniz yok veya talep durumu silmeye uygun değil." });
    }

    // İlişkili kalemleri sil (Prisma schema'da cascade tanımlı değilse)
    await prisma.purchaseRequestItem.deleteMany({
        where: { purchaseRequestId: id }
    });

    // Talebi sil
    await prisma.purchaseRequest.delete({
      where: { id },
    });

    console.log(`[Purchasing API] ID: ${id} talebi başarıyla silindi.`);
    res.status(204).send(); // Başarılı silme yanıtı

  } catch (error: any) {
    console.error(`[Purchasing API] ID: ${id} talebi silinirken hata:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Silinecek talep bulunamadı.' });
    }
    res.status(500).json({ success: false, message: "Talep silinirken bir sunucu hatası oluştu.", error: error.message });
  }
});

// PUT: Satın Alma Talebi Durumunu Güncelle
// router.put('/requests/:id/status', authenticateToken, async (req: Request, res: Response) => {
router.put('/requests/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user!.id; // Durumu değiştiren kullanıcı
    console.log(`[Purchasing API] Kullanıcı ${userId}, ID: ${id} talebinin durumunu güncelliyor -> ${status}`);

    // if (!userId) { ... } kontrolü gereksiz

    if (!status || !['APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(status)) {
         return res.status(400).json({ success: false, message: "Geçersiz veya eksik 'status' değeri. ('APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')" });
    }
    if (status === 'REJECTED' && !rejectionReason) {
        return res.status(400).json({ success: false, message: "Reddedilen talepler için 'rejectionReason' zorunludur." });
    }

    try {
        // Yetkilendirme kontrolü (örn: sadece belirli roller durumu değiştirebilir)
        // TODO: Gerçek rol bazlı yetkilendirme eklenmeli
        const canUpdateStatus = true; // Şimdilik herkes güncelleyebilir varsayalım
        if (!canUpdateStatus) {
             return res.status(403).json({ success: false, message: "Talep durumunu güncelleme yetkiniz yok." });
        }

        // Talebi bul
        const purchaseRequest = await prisma.purchaseRequest.findUnique({ where: { id } });
        if (!purchaseRequest) {
             return res.status(404).json({ success: false, message: "Güncellenecek talep bulunamadı." });
        }

        // Durumu güncelle
        const updatedRequest = await prisma.purchaseRequest.update({
            where: { id },
            data: {
                status: status,
                statusChangedById: userId,
                statusChangedAt: new Date(),
                rejectionReason: status === 'REJECTED' ? rejectionReason : null,
            },
            include: { // Güncellenmiş talebi döndür
                department: { select: { id: true, name: true } },
                requester: { select: { id: true, user: { select: { name: true, surname: true } } } },
                statusChangedBy: { select: { id: true, user: { select: { name: true, surname: true } } } },
            }
        });

        console.log(`[Purchasing API] ID: ${id} talebinin durumu başarıyla güncellendi.`);
        res.json({ success: true, message: "Talep durumu başarıyla güncellendi.", data: updatedRequest });

    } catch (error: any) {
        console.error(`[Purchasing API] ID: ${id} talebinin durumu güncellenirken hata:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Güncellenecek talep bulunamadı.' });
        }
        res.status(500).json({ success: false, message: "Talep durumu güncellenirken bir sunucu hatası oluştu.", error: error.message });
    }
});


export default router; 