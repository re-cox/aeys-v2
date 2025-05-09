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
exports.getProjectFinancialSummary = exports.updateProgressPaymentStatus = exports.deleteProgressPayment = exports.updateProgressPayment = exports.createProgressPayment = exports.getProgressPaymentById = exports.getAllProgressPayments = void 0;
const prisma_1 = require("../lib/prisma");
// const prisma = new PrismaClient(); // Yorumlandı
// Tüm hakedişleri listele
const getAllProgressPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Proje ID'si ile filtreleme
        const { projectId } = req.query;
        const whereClause = projectId ? { projeId: projectId } : {};
        const hakedisler = yield prisma_1.prisma.hakedis.findMany({
            where: whereClause,
            include: {
                proje: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                olusturan: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                    },
                },
                onaylayan: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                    },
                },
            },
            orderBy: {
                hakedisTarihi: 'desc',
            },
        });
        // Frontend'in beklediği formata dönüştür
        const progressPayments = hakedisler.map((hakedis) => {
            var _a;
            // Hakediş numarasından sayısal kısmı çıkar
            const paymentNumber = hakedis.hakedisNo.split('-')[2]
                ? parseInt(hakedis.hakedisNo.split('-')[2])
                : 0;
            // Durumu map'le
            const statusMap = {
                'TASLAK': 'DRAFT',
                'ONAY_BEKLIYOR': 'PENDING',
                'ONAYLANDI': 'APPROVED',
                'ODENDI': 'PAID',
                'REDDEDILDI': 'REJECTED',
                'IPTAL_EDILDI': 'REJECTED'
            };
            return {
                id: hakedis.id,
                projectId: hakedis.projeId,
                projectName: ((_a = hakedis.proje) === null || _a === void 0 ? void 0 : _a.name) || "",
                paymentNumber: paymentNumber,
                description: hakedis.aciklama || "",
                createdAt: hakedis.createdAt.toISOString(),
                dueDate: hakedis.hakedisTarihi.toISOString(),
                requestedAmount: hakedis.tutar,
                approvedAmount: hakedis.durum === 'ONAYLANDI' || hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
                paidAmount: hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
                status: statusMap[hakedis.durum] || 'DRAFT',
                paymentDate: hakedis.odemeTarihi ? hakedis.odemeTarihi.toISOString() : null,
                notes: null,
                documents: []
            };
        });
        return res.status(200).json({
            data: progressPayments
        });
    }
    catch (error) {
        console.error('Hakedişleri getirme hatası:', error);
        return res.status(500).json({ message: 'Hakedişler alınırken bir sunucu hatası oluştu.' });
    }
});
exports.getAllProgressPayments = getAllProgressPayments;
const getProgressPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const hakedis = yield prisma_1.prisma.hakedis.findUnique({
            where: { id },
            include: {
                proje: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                olusturan: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                    },
                },
                onaylayan: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                    },
                },
            },
        });
        if (!hakedis) {
            return res.status(404).json({ message: 'Hakediş bulunamadı.' });
        }
        // Frontend'in beklediği formata dönüştür
        // Hakediş numarasından sayısal kısmı çıkar
        const paymentNumber = hakedis.hakedisNo.split('-')[2]
            ? parseInt(hakedis.hakedisNo.split('-')[2])
            : 0;
        // Durumu map'le
        const statusMap = {
            'TASLAK': 'DRAFT',
            'ONAY_BEKLIYOR': 'PENDING',
            'ONAYLANDI': 'APPROVED',
            'ODENDI': 'PAID',
            'REDDEDILDI': 'REJECTED',
            'IPTAL_EDILDI': 'REJECTED'
        };
        const progressPayment = {
            id: hakedis.id,
            projectId: hakedis.projeId,
            projectName: ((_a = hakedis.proje) === null || _a === void 0 ? void 0 : _a.name) || "",
            paymentNumber: paymentNumber,
            description: hakedis.aciklama || "",
            createdAt: hakedis.createdAt.toISOString(),
            dueDate: hakedis.hakedisTarihi.toISOString(),
            requestedAmount: hakedis.tutar,
            approvedAmount: hakedis.durum === 'ONAYLANDI' || hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
            paidAmount: hakedis.durum === 'ODENDI' ? hakedis.tutar : null,
            status: statusMap[hakedis.durum] || 'DRAFT',
            paymentDate: hakedis.odemeTarihi ? hakedis.odemeTarihi.toISOString() : null,
            notes: hakedis.aciklama || null,
            documents: [] // Dosya desteği ileride eklenebilir
        };
        return res.status(200).json({
            data: progressPayment
        });
    }
    catch (error) {
        console.error('Hakediş getirme hatası:', error);
        return res.status(500).json({ message: 'Hakediş alınırken bir sunucu hatası oluştu.' });
    }
});
exports.getProgressPaymentById = getProgressPaymentById;
const createProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Detaylı request bilgilerini logla
        console.log('Gelen istek methodu:', req.method);
        console.log('Gelen istek headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Gelen istek body (ham):', req.body);
        console.log('Gelen dosyalar:', req.files);
        // Gelen veriler
        const projectId = req.body.projectId;
        const description = req.body.description;
        const requestedAmount = req.body.requestedAmount;
        const dueDate = req.body.dueDate;
        const notes = req.body.notes;
        console.log('İşlenecek veriler:', {
            projectId,
            description,
            requestedAmount,
            dueDate,
            notes
        });
        // Değerlerin doğruluğunu kontrol et
        if (!projectId || projectId === 'undefined') {
            return res.status(400).json({ message: 'Proje ID (projectId) zorunludur' });
        }
        if (!description || description === 'undefined') {
            return res.status(400).json({ message: 'Açıklama (description) zorunludur' });
        }
        if (!requestedAmount || requestedAmount === 'undefined') {
            return res.status(400).json({ message: 'Talep edilen tutar (requestedAmount) zorunludur' });
        }
        // Kullanıcı bilgisi - Auth'tan gelmeli, şimdilik hardcoded
        const olusturanId = "31ba596a-c0e0-4e86-a3f4-f2b1b027d3d3"; // req.user.id olmalı normalde
        // Hakediş numarası oluştur (örnek: HK-2024-001)
        const date = new Date();
        const year = date.getFullYear();
        const hakedisNo = `HK-${year}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        // Tarihler: İlerleme dönemi için varsayılan olarak mevcut ayın başlangıcı ve sonu
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Hakediş vade tarihi, eğer belirtilmişse kullan
        const hakedisTarihi = dueDate ? new Date(dueDate) : now;
        // KDV ve toplam tutarı hesapla
        const kdvOrani = 0.20; // %20 varsayılan
        // requestedAmount string veya number olabilir, doğru formata dönüştür
        let tutar;
        if (typeof requestedAmount === 'string') {
            tutar = parseFloat(requestedAmount);
        }
        else if (typeof requestedAmount === 'number') {
            tutar = requestedAmount;
        }
        else {
            return res.status(400).json({
                message: 'Geçersiz tutar formatı',
                receivedType: typeof requestedAmount,
                receivedValue: requestedAmount
            });
        }
        if (isNaN(tutar)) {
            return res.status(400).json({
                message: 'Talep edilen tutar geçerli bir sayı değil',
                receivedValue: requestedAmount
            });
        }
        const kdvTutar = tutar * kdvOrani;
        const toplamTutar = tutar + kdvTutar;
        // Açıklamayı hazırla
        const aciklama = notes
            ? `${description} - ${notes}`
            : description;
        try {
            // Veritabanına kaydet
            console.log('Veritabanına kaydedilecek veri:', {
                hakedisNo,
                projeId: projectId,
                aciklama,
                tutar,
                hakedisTarihi: hakedisTarihi.toISOString()
            });
            const newProgressPayment = yield prisma_1.prisma.hakedis.create({
                data: {
                    hakedisNo,
                    projeId: projectId,
                    aciklama,
                    hakedisTarihi,
                    baslangicTarihi: firstDayOfMonth,
                    bitisTarihi: lastDayOfMonth,
                    tutar,
                    kdvOrani,
                    kdvTutar,
                    toplamTutar,
                    paraBirimi: "TRY",
                    durum: 'TASLAK',
                    olusturanId
                },
                include: {
                    proje: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            // Hakediş numarasından sayısal kısmı çıkar
            const paymentNumber = newProgressPayment.hakedisNo.split('-')[2]
                ? parseInt(newProgressPayment.hakedisNo.split('-')[2])
                : 0;
            // Frontend'in beklediği formatta yanıt döndür
            const response = {
                id: newProgressPayment.id,
                projectId: newProgressPayment.projeId,
                projectName: ((_a = newProgressPayment.proje) === null || _a === void 0 ? void 0 : _a.name) || "",
                paymentNumber: paymentNumber,
                description: newProgressPayment.aciklama || "",
                requestedAmount: newProgressPayment.tutar,
                approvedAmount: null,
                paidAmount: null,
                status: 'DRAFT',
                createdAt: newProgressPayment.createdAt.toISOString(),
                dueDate: newProgressPayment.hakedisTarihi.toISOString(),
                paymentDate: null,
                notes: null,
                documents: []
            };
            return res.status(201).json({
                data: response
            });
        }
        catch (dbError) {
            console.error('Veritabanı hatası:', dbError);
            return res.status(500).json({
                message: 'Hakediş kaydedilirken veritabanı hatası oluştu',
                error: dbError.message
            });
        }
    }
    catch (error) {
        console.error('Hakediş oluşturma hatası:', error);
        return res.status(500).json({
            message: 'Hakediş oluşturulurken bir sunucu hatası oluştu',
            error: error.message
        });
    }
});
exports.createProgressPayment = createProgressPayment;
const updateProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { hakedisNo, projeId, aciklama, hakedisTarihi, baslangicTarihi, bitisTarihi, tutar, kdvOrani, paraBirimi, durum } = req.body;
        // KDV ve toplam tutarı hesapla
        const kdvTutar = tutar * kdvOrani;
        const toplamTutar = tutar + kdvTutar;
        const updatedProgressPayment = yield prisma_1.prisma.hakedis.update({
            where: { id },
            data: {
                hakedisNo,
                projeId,
                aciklama,
                hakedisTarihi: new Date(hakedisTarihi),
                baslangicTarihi: new Date(baslangicTarihi),
                bitisTarihi: new Date(bitisTarihi),
                tutar,
                kdvOrani,
                kdvTutar,
                toplamTutar,
                paraBirimi,
                durum
            }
        });
        return res.status(200).json(updatedProgressPayment);
    }
    catch (error) {
        console.error('Hakediş güncelleme hatası:', error);
        return res.status(500).json({ message: 'Hakediş güncellenirken bir sunucu hatası oluştu.' });
    }
});
exports.updateProgressPayment = updateProgressPayment;
const deleteProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.hakedis.delete({
            where: { id }
        });
        return res.status(200).json({ message: 'Hakediş başarıyla silindi.' });
    }
    catch (error) {
        console.error('Hakediş silme hatası:', error);
        return res.status(500).json({ message: 'Hakediş silinirken bir sunucu hatası oluştu.' });
    }
});
exports.deleteProgressPayment = deleteProgressPayment;
const updateProgressPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { durum, onaylayanId } = req.body;
        const updatedData = {
            durum
        };
        // Durum değişikliğine göre ek verileri güncelle
        if (durum === 'ONAYLANDI') {
            updatedData.onaylayanId = onaylayanId;
            updatedData.onayTarihi = new Date();
        }
        else if (durum === 'ODENDI') {
            updatedData.odemeTarihi = new Date();
            updatedData.odemeKanali = req.body.odemeKanali;
            updatedData.odemeReferansNo = req.body.odemeReferansNo;
        }
        const updatedProgressPayment = yield prisma_1.prisma.hakedis.update({
            where: { id },
            data: updatedData
        });
        return res.status(200).json(updatedProgressPayment);
    }
    catch (error) {
        console.error('Hakediş durumu güncelleme hatası:', error);
        return res.status(500).json({ message: 'Hakediş durumu güncellenirken bir sunucu hatası oluştu.' });
    }
});
exports.updateProgressPaymentStatus = updateProgressPaymentStatus;
const getProjectFinancialSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const projectDetails = yield prisma_1.prisma.project.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                name: true,
                budget: true,
                hakedisler: {
                    select: {
                        id: true,
                        hakedisNo: true,
                        durum: true,
                        tutar: true,
                        kdvTutar: true,
                        toplamTutar: true,
                        hakedisTarihi: true
                    }
                }
            }
        });
        if (!projectDetails) {
            return res.status(404).json({ message: 'Proje bulunamadı.' });
        }
        // Finansal özet hesapla
        const approvedPayments = projectDetails.hakedisler.filter(h => h.durum === 'ONAYLANDI' || h.durum === 'ODENDI');
        const totalApproved = approvedPayments.reduce((sum, h) => sum + h.toplamTutar, 0);
        const remainingBudget = projectDetails.budget ? projectDetails.budget - totalApproved : null;
        const totalPaid = projectDetails.hakedisler
            .filter(h => h.durum === 'ODENDI')
            .reduce((sum, h) => sum + h.toplamTutar, 0);
        return res.status(200).json({
            data: {
                projectId: projectDetails.id,
                projectName: projectDetails.name,
                totalBudget: projectDetails.budget,
                totalApproved,
                totalPaid,
                remainingBudget,
                paymentCount: projectDetails.hakedisler.length,
                approvedPaymentCount: approvedPayments.length,
                paidPaymentCount: projectDetails.hakedisler.filter(h => h.durum === 'ODENDI').length
            }
        });
    }
    catch (error) {
        console.error('Proje finansal özeti getirme hatası:', error);
        return res.status(500).json({ message: 'Proje finansal özeti alınırken bir sunucu hatası oluştu.' });
    }
});
exports.getProjectFinancialSummary = getProjectFinancialSummary;
