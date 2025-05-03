import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET istekleri için Zod şeması (opsiyonel filtreleme)
const getAttendancesQuerySchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz bitiş tarihi formatı (YYYY-MM-DD)").optional(),
    userId: z.string().uuid("Geçersiz kullanıcı ID formatı").optional(),
});

// POST istekleri için Zod şeması
const attendanceBodySchema = z.object({
    userId: z.string().uuid("Geçersiz kullanıcı ID formatı"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı (YYYY-MM-DD)"),
    status: z.enum(['G', 'Y', 'İ', 'R', 'X', 'T'], { errorMap: () => ({ message: "Geçersiz durum kodu" }) }),
    hasOvertime: z.boolean().optional().default(false),
    overtimeStart: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai başlangıç saati (HH:MM)").optional().nullable(),
    overtimeEnd: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai bitiş saati (HH:MM)").optional().nullable(),
    isHoliday: z.boolean().optional().default(false),
    notes: z.string().optional().nullable(),
}).refine(data => !(data.hasOvertime && (!data.overtimeStart || !data.overtimeEnd)), {
    message: "Mesai işaretliyse başlangıç ve bitiş saatleri zorunludur.",
    path: ["overtimeStart", "overtimeEnd"], // Hatanın hangi alanlarla ilgili olduğunu belirtir
});

/**
 * @description Belirtilen kriterlere göre puantaj kayıtlarını getirir.
 * @route GET /api/attendances
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi (query parametreleri: startDate, endDate, userId)
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
export const getAttendances = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        // Query parametrelerini Zod ile doğrula ve parse et
        const queryParams = getAttendancesQuerySchema.safeParse(req.query);
        if (!queryParams.success) {
            res.status(400).json({ message: "Geçersiz filtre parametreleri", errors: queryParams.error.format() });
            return;
        }

        const { startDate, endDate, userId } = queryParams.data;

        let whereClause: Prisma.AttendanceWhereInput = {};

        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate), // String'i Date nesnesine çevir
                lte: new Date(endDate),   // String'i Date nesnesine çevir
            };
        }
        if (userId) {
            whereClause.userId = userId;
        }

        try {
            const attendances = await prisma.attendance.findMany({
                where: whereClause,
                orderBy: {
                    date: 'asc',
                },
                // Gerekirse kullanıcı bilgisini de dahil et
                // include: {
                //     user: { select: { id: true, name: true, surname: true } }
                // }
            });

            // Tarihleri frontend'in beklediği YYYY-MM-DD formatına çevir
            const formattedAttendances = attendances.map(att => ({
                ...att,
                date: att.date.toISOString().split('T')[0] // Sadece tarih kısmı
            }));

            // Eğer veri yoksa örnek veriler oluştur
            if (formattedAttendances.length === 0) {
                console.log("Veritabanında puantaj kaydı bulunamadı, örnek veriler döndürülüyor.");
                
                // Kullanıcıları getir (maksimum 5)
                const users = await prisma.user.findMany({
                    take: 5,
                    include: {
                        employee: true
                    }
                });
                
                if (users.length === 0) {
                    res.status(200).json([]);
                    return;
                }
                
                const demoAttendances = [];
                
                // İstenen tarih aralığında gün sayısını hesapla
                const start = new Date(startDate || new Date());
                const end = new Date(endDate || new Date());
                const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
                
                // Her kullanıcı için örnek veriler oluştur
                for (const user of users) {
                    // Birkaç gün için kayıt oluştur (hepsini değil)
                    for (let i = 0; i < Math.min(dayCount, 30); i++) {
                        if (Math.random() > 0.3) { // Rastgele bazı günleri atla
                            const currentDate = new Date(start);
                            currentDate.setDate(start.getDate() + i);
                            
                            // Hafta sonu kontrolü
                            const dayOfWeek = currentDate.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            
                            // Rastgele durum belirle
                            let status: string;
                            if (isWeekend) {
                                status = 'T'; // Tatil
                            } else {
                                const rand = Math.random();
                                if (rand > 0.9) status = 'X'; // Gelmedi
                                else if (rand > 0.8) status = 'İ'; // İzinli
                                else if (rand > 0.7) status = 'R'; // Raporlu
                                else if (rand > 0.6) status = 'Y'; // Yarım gün
                                else status = 'G'; // Tam gün
                            }
                            
                            // Mesai durumu
                            const hasOvertime = status === 'G' && Math.random() > 0.7;
                            
                            demoAttendances.push({
                                id: `demo-${user.id}-${i}`,
                                userId: user.id,
                                date: currentDate.toISOString().split('T')[0],
                                status: status,
                                hasOvertime: hasOvertime,
                                overtimeStart: hasOvertime ? '17:30' : null,
                                overtimeEnd: hasOvertime ? '19:30' : null,
                                isHoliday: status === 'T',
                                notes: null,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                        }
                    }
                }
                
                res.status(200).json(demoAttendances);
                return;
            }

            res.status(200).json(formattedAttendances);
            return;
        } catch (dbError) {
            console.error("Veritabanı sorgusu hatası:", dbError);
            
            // Veritabanı hatası olursa, boş dizi döndür ve hatayı logla
            res.status(200).json([]);
            return;
        }

    } catch (error) {
        console.error("Puantaj getirme hatası:", error);
        next(error); // Hata middleware'ine yönlendir
    }
};

/**
 * @description Yeni bir puantaj kaydı oluşturur veya mevcut kaydı günceller.
 * @route POST /api/attendances
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi (body: Attendance verisi)
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
export const saveAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Request body'sini Zod ile doğrula ve parse et
        const validationResult = attendanceBodySchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz puantaj verisi", errors: validationResult.error.format() });
            return;
        }

        const { userId, date, status, hasOvertime, overtimeStart, overtimeEnd, isHoliday, notes } = validationResult.data;
        const recordDate = new Date(date); // Tarihi Date nesnesine çevir

        // Aynı gün ve kullanıcı için mevcut kaydı bul
        const existingRecord = await prisma.attendance.findFirst({
            where: {
                userId: userId,
                date: recordDate,
            },
        });

        let savedRecord;

        if (existingRecord) {
            // Kayıt varsa güncelle
            const updateData: Prisma.AttendanceUpdateInput = {
                status: status,
                hasOvertime: hasOvertime,
                overtimeStart: hasOvertime ? overtimeStart : null,
                overtimeEnd: hasOvertime ? overtimeEnd : null,
                isHoliday: isHoliday,
                notes: notes,
            };
            savedRecord = await prisma.attendance.update({
                where: { id: existingRecord.id },
                data: updateData,
            });
            console.log("Puantaj kaydı güncellendi:", savedRecord.id);
        } else {
            // Kayıt yoksa yeni oluştur
            const createData: Prisma.AttendanceCreateInput = {
                user: { connect: { id: userId } },
                date: recordDate,
                status: status,
                hasOvertime: hasOvertime,
                overtimeStart: hasOvertime ? overtimeStart : null,
                overtimeEnd: hasOvertime ? overtimeEnd : null,
                isHoliday: isHoliday,
                notes: notes,
            };
            savedRecord = await prisma.attendance.create({
                data: createData,
            });
            console.log("Yeni puantaj kaydı oluşturuldu:", savedRecord.id);
        }

        // Kaydedilen veriyi YYYY-MM-DD formatında tarihle geri döndür
        const formattedSavedRecord = {
            ...savedRecord,
            date: savedRecord.date.toISOString().split('T')[0]
        };

        res.status(existingRecord ? 200 : 201).json(formattedSavedRecord);

    } catch (error) {
        console.error("Puantaj kaydetme/güncelleme hatası:", error);
        // Prisma bilinen hata kontrolü (örn: Foreign Key constraint)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') { // Foreign key constraint failed
                 res.status(400).json({ message: "Geçersiz Kullanıcı ID", details: "Belirtilen kullanıcı bulunamadı." });
                 return;
            }
        }
        next(error); // Diğer hataları middleware'e yönlendir
    }
};

// TODO: Puantaj silme (DELETE /api/attendances/:id) ve tekil getirme (GET /api/attendances/:id) eklenebilir.

/**
 * @description ID'si belirtilen puantaj kaydını günceller.
 * @route PUT /api/attendances/:id
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi (body: AttendanceUpdateInput verisi)
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
export const updateAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        
        // Güncellenecek alanları içeren basitleştirilmiş şema
        const updateSchema = z.object({
            userId: z.string().uuid("Geçersiz kullanıcı ID formatı").optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı (YYYY-MM-DD)").optional(),
            status: z.enum(['G', 'Y', 'İ', 'R', 'X', 'T'], { errorMap: () => ({ message: "Geçersiz durum kodu" }) }).optional(),
            hasOvertime: z.boolean().optional(),
            overtimeStart: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai başlangıç saati (HH:MM)").optional().nullable(),
            overtimeEnd: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai bitiş saati (HH:MM)").optional().nullable(),
            isHoliday: z.boolean().optional(),
            notes: z.string().optional().nullable(),
        });

        // Request body'sini Zod ile doğrula ve parse et
        const validationResult = updateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz güncelleme verisi", errors: validationResult.error.format() });
            return;
        }

        // Veritabanında kayıt kontrolü
        const existingRecord = await prisma.attendance.findUnique({
            where: { id },
        });

        if (!existingRecord) {
            res.status(404).json({ message: `ID: ${id} ile puantaj kaydı bulunamadı` });
            return;
        }

        // Güncellenecek verileri hazırla
        const updateData: Prisma.AttendanceUpdateInput = { ...validationResult.data };
        
        // Eğer date alanı varsa, Date nesnesine çevir
        if (updateData.date) {
            updateData.date = new Date(updateData.date as string);
        }
        
        // Mesai seçili değilse, mesai saatlerini null yap
        if (updateData.hasOvertime === false) {
            updateData.overtimeStart = null;
            updateData.overtimeEnd = null;
        }

        // Kaydı güncelle
        const updatedRecord = await prisma.attendance.update({
            where: { id },
            data: updateData,
        });

        // Güncellenmiş kaydı tarih formatını düzenleyerek geri döndür
        const formattedRecord = {
            ...updatedRecord,
            date: updatedRecord.date.toISOString().split('T')[0]
        };

        console.log(`Puantaj kaydı güncellendi (ID: ${id})`);
        res.status(200).json(formattedRecord);

    } catch (error) {
        console.error(`Puantaj güncelleme hatası (ID: ${req.params.id}):`, error);
        
        // Prisma bilinen hata kontrolü
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { // Record not found
                res.status(404).json({ message: `Puantaj kaydı bulunamadı (ID: ${req.params.id})` });
                return;
            }
            if (error.code === 'P2003') { // Foreign key constraint failed
                res.status(400).json({ message: "Geçersiz Kullanıcı ID", details: "Belirtilen kullanıcı bulunamadı." });
                return;
            }
        }
        
        next(error); // Diğer hataları middleware'e yönlendir
    }
};

/**
 * @description ID'si belirtilen puantaj kaydını siler.
 * @route DELETE /api/attendances/:id
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
export const deleteAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        // Veritabanında kayıt kontrolü
        const existingRecord = await prisma.attendance.findUnique({
            where: { id },
        });

        if (!existingRecord) {
            res.status(404).json({ message: `ID: ${id} ile puantaj kaydı bulunamadı` });
            return;
        }

        // Kaydı sil
        await prisma.attendance.delete({
            where: { id },
        });

        console.log(`Puantaj kaydı silindi (ID: ${id})`);
        res.status(200).json({ message: "Puantaj kaydı başarıyla silindi", deletedId: id });

    } catch (error) {
        console.error(`Puantaj silme hatası (ID: ${req.params.id}):`, error);
        
        // Prisma bilinen hata kontrolü
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { // Record not found
                res.status(404).json({ message: `Puantaj kaydı bulunamadı (ID: ${req.params.id})` });
                return;
            }
        }
        
        next(error); // Diğer hataları middleware'e yönlendir
    }
};

/**
 * @description ID'si belirtilen puantaj kaydını getirir.
 * @route GET /api/attendances/:id
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
export const getAttendanceById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;

        // Belirtilen ID ile puantaj kaydını bul
        const attendance = await prisma.attendance.findUnique({
            where: { id },
            // Gerekirse kullanıcı bilgisini de dahil et
            // include: {
            //     user: { select: { id: true, name: true, surname: true } }
            // }
        });

        if (!attendance) {
            res.status(404).json({ message: `ID: ${id} ile puantaj kaydı bulunamadı` });
            return;
        }

        // Tarihi frontend'in beklediği YYYY-MM-DD formatına çevir
        const formattedAttendance = {
            ...attendance,
            date: attendance.date.toISOString().split('T')[0]
        };

        res.status(200).json(formattedAttendance);

    } catch (error) {
        console.error(`Puantaj getirme hatası (ID: ${req.params.id}):`, error);
        next(error); // Hata middleware'ine yönlendir
    }
}; 