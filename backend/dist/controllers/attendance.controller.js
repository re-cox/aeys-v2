"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceById = exports.deleteAttendance = exports.updateAttendance = exports.saveAttendance = exports.getAttendances = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// GET istekleri için Zod şeması (opsiyonel filtreleme)
const getAttendancesQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz başlangıç tarihi formatı (YYYY-MM-DD)").optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz bitiş tarihi formatı (YYYY-MM-DD)").optional(),
    userId: zod_1.z.string().uuid("Geçersiz kullanıcı ID formatı").optional(),
});
// POST istekleri için Zod şeması
const attendanceBodySchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Geçersiz kullanıcı ID formatı"),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı (YYYY-MM-DD)"),
    status: zod_1.z.enum(['G', 'Y', 'İ', 'R', 'X', 'T'], { errorMap: () => ({ message: "Geçersiz durum kodu" }) }),
    hasOvertime: zod_1.z.boolean().optional().default(false),
    overtimeStart: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai başlangıç saati (HH:MM)").optional().nullable(),
    overtimeEnd: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai bitiş saati (HH:MM)").optional().nullable(),
    isHoliday: zod_1.z.boolean().optional().default(false),
    notes: zod_1.z.string().optional().nullable(),
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
const getAttendances = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Query parametrelerini Zod ile doğrula ve parse et
        const queryParams = getAttendancesQuerySchema.safeParse(req.query);
        if (!queryParams.success) {
            res.status(400).json({ message: "Geçersiz filtre parametreleri", errors: queryParams.error.format() });
            return;
        }
        const { startDate, endDate, userId } = queryParams.data;
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate), // String'i Date nesnesine çevir
                lte: new Date(endDate), // String'i Date nesnesine çevir
            };
        }
        if (userId) {
            whereClause.userId = userId;
        }
        try {
            const attendances = yield prisma.attendance.findMany({
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
            const formattedAttendances = attendances.map(att => (Object.assign(Object.assign({}, att), { date: att.date.toISOString().split('T')[0] // Sadece tarih kısmı
             })));
            // Eğer veri yoksa örnek veriler oluştur
            if (formattedAttendances.length === 0) {
                console.log("Veritabanında puantaj kaydı bulunamadı, örnek veriler döndürülüyor.");
                // Kullanıcıları getir (maksimum 5)
                const users = yield prisma.user.findMany({
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
                            let status;
                            if (isWeekend) {
                                status = 'T'; // Tatil
                            }
                            else {
                                const rand = Math.random();
                                if (rand > 0.9)
                                    status = 'X'; // Gelmedi
                                else if (rand > 0.8)
                                    status = 'İ'; // İzinli
                                else if (rand > 0.7)
                                    status = 'R'; // Raporlu
                                else if (rand > 0.6)
                                    status = 'Y'; // Yarım gün
                                else
                                    status = 'G'; // Tam gün
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
        }
        catch (dbError) {
            console.error("Veritabanı sorgusu hatası:", dbError);
            // Veritabanı hatası olursa, boş dizi döndür ve hatayı logla
            res.status(200).json([]);
            return;
        }
    }
    catch (error) {
        console.error("Puantaj getirme hatası:", error);
        next(error); // Hata middleware'ine yönlendir
    }
});
exports.getAttendances = getAttendances;
/**
 * @description Yeni bir puantaj kaydı oluşturur veya mevcut kaydı günceller.
 * @route POST /api/attendances
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi (body: Attendance verisi)
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
const saveAttendance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingRecord = yield prisma.attendance.findFirst({
            where: {
                userId: userId,
                date: recordDate,
            },
        });
        let savedRecord;
        if (existingRecord) {
            // Kayıt varsa güncelle
            const updateData = {
                status: status,
                hasOvertime: hasOvertime,
                overtimeStart: hasOvertime ? overtimeStart : null,
                overtimeEnd: hasOvertime ? overtimeEnd : null,
                isHoliday: isHoliday,
                notes: notes,
            };
            savedRecord = yield prisma.attendance.update({
                where: { id: existingRecord.id },
                data: updateData,
            });
            console.log("Puantaj kaydı güncellendi:", savedRecord.id);
        }
        else {
            // Kayıt yoksa yeni oluştur
            const createData = {
                user: { connect: { id: userId } },
                date: recordDate,
                status: status,
                hasOvertime: hasOvertime,
                overtimeStart: hasOvertime ? overtimeStart : null,
                overtimeEnd: hasOvertime ? overtimeEnd : null,
                isHoliday: isHoliday,
                notes: notes,
            };
            savedRecord = yield prisma.attendance.create({
                data: createData,
            });
            console.log("Yeni puantaj kaydı oluşturuldu:", savedRecord.id);
        }
        // Kaydedilen veriyi YYYY-MM-DD formatında tarihle geri döndür
        const formattedSavedRecord = Object.assign(Object.assign({}, savedRecord), { date: savedRecord.date.toISOString().split('T')[0] });
        res.status(existingRecord ? 200 : 201).json(formattedSavedRecord);
    }
    catch (error) {
        console.error("Puantaj kaydetme/güncelleme hatası:", error);
        // Prisma bilinen hata kontrolü (örn: Foreign Key constraint)
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') { // Foreign key constraint failed
                res.status(400).json({ message: "Geçersiz Kullanıcı ID", details: "Belirtilen kullanıcı bulunamadı." });
                return;
            }
        }
        next(error); // Diğer hataları middleware'e yönlendir
    }
});
exports.saveAttendance = saveAttendance;
// TODO: Puantaj silme (DELETE /api/attendances/:id) ve tekil getirme (GET /api/attendances/:id) eklenebilir.
/**
 * @description ID'si belirtilen puantaj kaydını günceller.
 * @route PUT /api/attendances/:id
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi (body: AttendanceUpdateInput verisi)
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
const updateAttendance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Güncellenecek alanları içeren basitleştirilmiş şema
        const updateSchema = zod_1.z.object({
            userId: zod_1.z.string().uuid("Geçersiz kullanıcı ID formatı").optional(),
            date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı (YYYY-MM-DD)").optional(),
            status: zod_1.z.enum(['G', 'Y', 'İ', 'R', 'X', 'T'], { errorMap: () => ({ message: "Geçersiz durum kodu" }) }).optional(),
            hasOvertime: zod_1.z.boolean().optional(),
            overtimeStart: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai başlangıç saati (HH:MM)").optional().nullable(),
            overtimeEnd: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz mesai bitiş saati (HH:MM)").optional().nullable(),
            isHoliday: zod_1.z.boolean().optional(),
            notes: zod_1.z.string().optional().nullable(),
        });
        // Request body'sini Zod ile doğrula ve parse et
        const validationResult = updateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({ message: "Geçersiz güncelleme verisi", errors: validationResult.error.format() });
            return;
        }
        // Veritabanında kayıt kontrolü
        const existingRecord = yield prisma.attendance.findUnique({
            where: { id },
        });
        if (!existingRecord) {
            res.status(404).json({ message: `ID: ${id} ile puantaj kaydı bulunamadı` });
            return;
        }
        // Güncellenecek verileri hazırla
        const updateData = Object.assign({}, validationResult.data);
        // Eğer date alanı varsa, Date nesnesine çevir
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }
        // Mesai seçili değilse, mesai saatlerini null yap
        if (updateData.hasOvertime === false) {
            updateData.overtimeStart = null;
            updateData.overtimeEnd = null;
        }
        // Kaydı güncelle
        const updatedRecord = yield prisma.attendance.update({
            where: { id },
            data: updateData,
        });
        // Güncellenmiş kaydı tarih formatını düzenleyerek geri döndür
        const formattedRecord = Object.assign(Object.assign({}, updatedRecord), { date: updatedRecord.date.toISOString().split('T')[0] });
        console.log(`Puantaj kaydı güncellendi (ID: ${id})`);
        res.status(200).json(formattedRecord);
    }
    catch (error) {
        console.error(`Puantaj güncelleme hatası (ID: ${req.params.id}):`, error);
        // Prisma bilinen hata kontrolü
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
});
exports.updateAttendance = updateAttendance;
/**
 * @description ID'si belirtilen puantaj kaydını siler.
 * @route DELETE /api/attendances/:id
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
const deleteAttendance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Veritabanında kayıt kontrolü
        const existingRecord = yield prisma.attendance.findUnique({
            where: { id },
        });
        if (!existingRecord) {
            res.status(404).json({ message: `ID: ${id} ile puantaj kaydı bulunamadı` });
            return;
        }
        // Kaydı sil
        yield prisma.attendance.delete({
            where: { id },
        });
        console.log(`Puantaj kaydı silindi (ID: ${id})`);
        res.status(200).json({ message: "Puantaj kaydı başarıyla silindi", deletedId: id });
    }
    catch (error) {
        console.error(`Puantaj silme hatası (ID: ${req.params.id}):`, error);
        // Prisma bilinen hata kontrolü
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { // Record not found
                res.status(404).json({ message: `Puantaj kaydı bulunamadı (ID: ${req.params.id})` });
                return;
            }
        }
        next(error); // Diğer hataları middleware'e yönlendir
    }
});
exports.deleteAttendance = deleteAttendance;
/**
 * @description ID'si belirtilen puantaj kaydını getirir.
 * @route GET /api/attendances/:id
 * @access Private (Yetkilendirme eklenecek)
 * @param req Express Request nesnesi
 * @param res Express Response nesnesi
 * @param next Express NextFunction nesnesi
 */
const getAttendanceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Belirtilen ID ile puantaj kaydını bul
        const attendance = yield prisma.attendance.findUnique({
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
        const formattedAttendance = Object.assign(Object.assign({}, attendance), { date: attendance.date.toISOString().split('T')[0] });
        res.status(200).json(formattedAttendance);
    }
    catch (error) {
        console.error(`Puantaj getirme hatası (ID: ${req.params.id}):`, error);
        next(error); // Hata middleware'ine yönlendir
    }
});
exports.getAttendanceById = getAttendanceById;
