import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, LeaveStatus, AnnualLeave, User, Employee } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET istekleri için Zod şeması (opsiyonel filtreleme)
const getAnnualLeavesQuerySchema = z.object({
    userId: z.string().uuid("Geçersiz kullanıcı ID formatı").optional(),
    status: z.nativeEnum(LeaveStatus).optional(), // Enum'a göre filtreleme
    year: z.string().regex(/^\d{4}$/, "Geçersiz yıl formatı (YYYY)").optional(), // Yıla göre filtreleme (opsiyonel)
});

// POST istekleri için Zod şeması
const createLeaveBodySchema = z.object({
    userId: z.string().uuid("Geçersiz kullanıcı ID formatı"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz bitiş tarihi formatı (YYYY-MM-DD)"),
    reason: z.string().min(1, "İzin nedeni boş olamaz").optional(), // Sebep zorunlu olabilir, isteğe bağlı bırakıldı
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    path: ["endDate"],
});

// PUT (Update Status) istekleri için Zod şeması
const updateLeaveStatusBodySchema = z.object({
    status: z.nativeEnum(LeaveStatus, { errorMap: () => ({ message: "Geçersiz durum kodu" }) }),
    // Onaylayan kişi bilgisi (auth middleware'den alınabilir)
    // approvedById: z.string().uuid().optional(), 
});

// PUT (Update Leave Details) istekleri için Zod şeması
const updateLeaveBodySchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz bitiş tarihi formatı (YYYY-MM-DD)").optional(),
    reason: z.string().min(1, "İzin nedeni boş olamaz").optional(),
}).refine(data => {
    // Eğer her iki tarih de varsa, bitiş başlangıçtan sonra olmalı
    if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true; // Sadece biri varsa veya hiçbiri yoksa kontrolü geç
}, {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    path: ["endDate"],
});

// Helper fonksiyon: İş günlerini hesapla
const calculateBusinessDays = (start: Date, end: Date): number => {
    let count = 0;
    const current = new Date(start.getTime());
    // Bitiş tarihini de dahil etmek için <= kullan
    while (current <= end) { 
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pazar (0) ve Cumartesi (6) hariç
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

/**
 * @description Belirtilen kriterlere göre yıllık izin kayıtlarını getirir.
 * @route GET /api/annual-leaves
 * @access Private (Yetkilendirme eklenecek)
 */
export const getAnnualLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const queryParams = getAnnualLeavesQuerySchema.safeParse(req.query);
        if (!queryParams.success) {
            res.status(400).json({ message: "Geçersiz filtre parametreleri", errors: queryParams.error.format() });
            return;
        }

        const { userId, status, year } = queryParams.data;

        let whereClause: Prisma.AnnualLeaveWhereInput = {};

        if (userId) whereClause.userId = userId;
        if (status) whereClause.status = status;
        if (year) {
            const yearStartDate = new Date(`${year}-01-01`);
            const yearEndDate = new Date(`${year}-12-31`);
            // Yıl içinde başlayan VEYA biten izinleri getir (veya sadece başlayanları)
            whereClause.OR = [
                { startDate: { gte: yearStartDate, lte: yearEndDate } },
                { endDate: { gte: yearStartDate, lte: yearEndDate } },
            ];
            // Sadece başlangıç tarihine göre:
            // whereClause.startDate = { gte: yearStartDate, lte: yearEndDate };
        }

        const annualLeaves = await prisma.annualLeave.findMany({
            where: whereClause,
            include: { 
                user: { 
                    select: { 
                        id: true, 
                        name: true, 
                        surname: true,
                        // Employee üzerinden departman bilgisi alınabilir, ancak bu sorguda gerekmeyebilir.
                    }
                 }, 
                approvedBy: { select: { id: true, name: true, surname: true } } 
            },
            orderBy: {
                requestedAt: 'desc',
            },
        });

        // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeaves = annualLeaves.map(leave => ({
            ...leave,
            startDate: leave.startDate.toISOString().split('T')[0],
            endDate: leave.endDate.toISOString().split('T')[0],
            requestedAt: leave.requestedAt.toISOString(),
            approvedAt: leave.approvedAt?.toISOString() ?? null,
        }));

        res.status(200).json(formattedLeaves);

    } catch (error) {
        console.error("Yıllık izin getirme hatası:", error);
        next(error); // Hata middleware'ine yönlendir
    }
};

/**
 * @description Yeni bir yıllık izin talebi oluşturur.
 * @route POST /api/annual-leaves
 * @access Private (Yetkilendirme eklenecek)
 */
export const createAnnualLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = createLeaveBodySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz izin talep verisi", errors: validationResult.error.format() });
            return;
        }

        // TODO: Kullanıcının kalan izin günü kontrolü eklenebilir.

        const { userId, startDate, endDate, reason } = validationResult.data;

        const newLeave = await prisma.annualLeave.create({
            data: {
                userId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: LeaveStatus.PENDING // Başlangıç durumu
            },
            include: { user: { select: { id: true, name: true, surname: true } } }
        });

         // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeave = {
            ...newLeave,
            startDate: newLeave.startDate.toISOString().split('T')[0],
            endDate: newLeave.endDate.toISOString().split('T')[0],
            requestedAt: newLeave.requestedAt.toISOString(),
            approvedAt: newLeave.approvedAt?.toISOString() ?? null,
        };

        res.status(201).json(formattedLeave);

    } catch (error) {
        console.error("Yıllık izin oluşturma hatası:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            res.status(400).json({ message: "Geçersiz Kullanıcı ID" });
            return;
        }
        next(error); // Hata middleware'ine yönlendir
    }
};

/**
 * @description Bir yıllık izin talebinin durumunu günceller (Onay/Red).
 * @route PUT /api/annual-leaves/:id/status
 * @access Private (Yetkilendirme eklenecek - Yönetici/Manager)
 */
export const updateAnnualLeaveStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params; // URL'den izin ID'sini al
        const validationResult = updateLeaveStatusBodySchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz durum verisi", errors: validationResult.error.format() });
            return;
        }

        const { status } = validationResult.data;
        
        // Middleware'den onaylayan kullanıcı ID'sini al (req.user'ın var olduğu varsayılır)
        // req üzerine user eklemek için Express tip genişletmesi gerekebilir
        const approverId = (req as any).user?.id;

        if (!approverId) {
             // Eğer approverId bulunamazsa (middleware çalışmadıysa veya user bilgisi yoksa) hata döndür
             return res.status(401).json({ message: "İşlemi yapan kullanıcı kimliği bulunamadı veya yetkilendirme başarısız." });
        }

        const updatedLeave = await prisma.annualLeave.update({
            where: { id },
            data: {
                status,
                approvedById: approverId, // Onaylayan kişiyi set et
                approvedAt: new Date(),   // Onay zamanını set et
            },
            include: { 
                 user: { select: { id: true, name: true, surname: true } },
                 approvedBy: { select: { id: true, name: true, surname: true } }
             }
        });

        // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeave = {
            ...updatedLeave,
            startDate: updatedLeave.startDate.toISOString().split('T')[0],
            endDate: updatedLeave.endDate.toISOString().split('T')[0],
            requestedAt: updatedLeave.requestedAt.toISOString(),
            approvedAt: updatedLeave.approvedAt?.toISOString() ?? null,
        };

        res.status(200).json(formattedLeave);

    } catch (error) {
        console.error("Yıllık izin durumu güncelleme hatası:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Kayıt bulunamadı
            res.status(404).json({ message: "İzin talebi bulunamadı" });
            return;
        }
        next(error); // Hata middleware'ine yönlendir
    }
};

/**
 * @description Mevcut bir yıllık izin talebinin detaylarını günceller.
 * Sadece 'PENDING' durumundaki izinler güncellenebilir (varsayım).
 * @route PUT /api/annual-leaves/:id
 * @access Private (Yetkilendirme eklenecek - İzin sahibi veya Yönetici)
 */
export const updateAnnualLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const validationResult = updateLeaveBodySchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz güncelleme verisi", errors: validationResult.error.format() });
            return;
        }

        const updateData: Prisma.AnnualLeaveUpdateInput = {};
        const { startDate, endDate, reason } = validationResult.data;

        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (reason) updateData.reason = reason;

        // Eğer güncellenecek alan yoksa hata ver
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ message: "Güncellenecek alan belirtilmedi" });
            return;
        }
        
        // Opsiyonel: Sadece PENDING durumundaki izinlerin güncellenmesine izin ver
        const existingLeave = await prisma.annualLeave.findUnique({
            where: { id }
        });

        if (!existingLeave) {
            res.status(404).json({ message: "İzin talebi bulunamadı" });
            return;
        }

        // TODO: Yetkilendirme kontrolü - Sadece izin sahibi veya yönetici güncelleyebilmeli
        // if (req.user.id !== existingLeave.userId && req.user.role !== 'admin') { ... }

        if (existingLeave.status !== LeaveStatus.PENDING) {
            res.status(403).json({ message: "Sadece bekleyen izin talepleri güncellenebilir" });
            return;
        }

        const updatedLeave = await prisma.annualLeave.update({
            where: { id },
            data: updateData,
            include: { 
                 user: { select: { id: true, name: true, surname: true } },
                 approvedBy: { select: { id: true, name: true, surname: true } }
             }
        });

        // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedLeave = {
            ...updatedLeave,
            startDate: updatedLeave.startDate.toISOString().split('T')[0],
            endDate: updatedLeave.endDate.toISOString().split('T')[0],
            requestedAt: updatedLeave.requestedAt.toISOString(),
            approvedAt: updatedLeave.approvedAt?.toISOString() ?? null,
        };

        res.status(200).json(formattedLeave);

    } catch (error) {
        console.error("Yıllık izin güncelleme hatası:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Kayıt bulunamadı
            res.status(404).json({ message: "İzin talebi bulunamadı" });
            return;
        }
        next(error); // Hata middleware'ine yönlendir
    }
};

/**
 * @description Tüm çalışanların yıllık izin istatistiklerini hesaplar ve döndürür.
 * @route GET /api/annual-leaves/stats
 * @access Private (Yetkilendirme eklenecek)
 */
export const getAnnualLeaveStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Artık userId parametresi beklemiyoruz.
    // const userId = req.params.userId; 
    // if (!userId) { ... }

    try {
        // Tüm kullanıcıları ve ilişkili izinlerini getir (performans için sadece gerekli alanları seç)
        const users = await prisma.user.findMany({
            // Aktif olmayan kullanıcıları filtrele? (Opsiyonel)
            // where: { isActive: true }, 
            include: {
                annualLeaves: { // User'a bağlı izinleri seç
                     where: { 
                         // Sadece onaylanmış ve bekleyen izinleri dahil et
                         status: { in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] } 
                    },
                    select: { // Sadece gerekli alanları seçelim
                        startDate: true,
                        endDate: true,
                        status: true
                    }
                },
                employee: { // Employee'den izin hakkını ve departmanı al
                    select: {
                        annualLeaveAllowance: true,
                        department: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        // Her kullanıcı için istatistikleri hesapla
        const stats = users.map(user => {
            const annualLeaveAllowance = user.employee?.annualLeaveAllowance ?? 14; // Varsayılan 14 gün
            const annualLeaves = user.annualLeaves;
            const department = user.employee?.department;

            const approvedLeaves = annualLeaves.filter(l => l.status === LeaveStatus.APPROVED);
            const pendingLeaves = annualLeaves.filter(l => l.status === LeaveStatus.PENDING);
            
            const totalDaysUsed = approvedLeaves.reduce((sum: number, leave: { startDate: Date, endDate: Date }) =>
                sum + calculateBusinessDays(leave.startDate, leave.endDate), 0
            );

            const pendingDays = pendingLeaves.reduce((sum: number, leave: { startDate: Date, endDate: Date }) =>
                sum + calculateBusinessDays(leave.startDate, leave.endDate), 0
            );

            const remainingDays = annualLeaveAllowance - totalDaysUsed;

            return {
                userId: user.id,
                employeeName: `${user.name || ''} ${user.surname || ''}`.trim() || 'İsimsiz',
                departmentName: department?.name || 'Belirtilmemiş',
                totalAnnualAllowance: annualLeaveAllowance,
                totalDaysUsed,
                pendingDays,
                remainingDays
            };
        });

        res.status(200).json(stats); // Hesaplanan istatistik dizisini döndür

    } catch (error) {
        console.error("İzin istatistikleri getirme hatası:", error);
        next(error);
    }
};

// TODO: İzin silme (DELETE /api/annual-leaves/:id) eklenebilir. 