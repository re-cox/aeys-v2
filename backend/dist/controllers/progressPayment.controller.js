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
const client_1 = require("@prisma/client");
const next_auth_1 = require("next-auth");
const auth_1 = require("../lib/auth");
const prisma = new client_1.PrismaClient();
/**
 * Tüm hakedişleri getir (opsiyonel projectId filtresi ile)
 */
const getAllProgressPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield (0, next_auth_1.getServerSession)(req, res, auth_1.authOptions);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
        const { projectId } = req.query;
        let progressPayments;
        if (projectId) {
            progressPayments = yield prisma.progressPayment.findMany({
                where: { projectId: String(projectId) },
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    documents: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        else {
            progressPayments = yield prisma.progressPayment.findMany({
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    documents: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        return res.status(200).json({ success: true, data: progressPayments });
    }
    catch (error) {
        console.error('Hakediş verileri alınırken hata:', error);
        return res.status(500).json({ success: false, message: 'Hakediş verileri alınamadı', error });
    }
});
exports.getAllProgressPayments = getAllProgressPayments;
/**
 * Belirli bir hakediş detayını getir
 */
const getProgressPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield (0, next_auth_1.getServerSession)(req, res, auth_1.authOptions);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
        const { id } = req.params;
        const progressPayment = yield prisma.progressPayment.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        customer: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                documents: true
            }
        });
        if (!progressPayment) {
            return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
        }
        return res.status(200).json({ success: true, data: progressPayment });
    }
    catch (error) {
        console.error('Hakediş detayı alınırken hata:', error);
        return res.status(500).json({ success: false, message: 'Hakediş detayı alınamadı', error });
    }
});
exports.getProgressPaymentById = getProgressPaymentById;
/**
 * Yeni bir hakediş oluştur
 */
const createProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield (0, next_auth_1.getServerSession)(req, res, auth_1.authOptions);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
        const { projectId, description, requestedAmount, dueDate, notes } = req.body;
        if (!projectId || !description || !requestedAmount) {
            return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
        }
        // Projenin var olup olmadığını kontrol et
        const project = yield prisma.project.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
        }
        // Bu proje için son hakediş numarasını bul
        const lastPayment = yield prisma.progressPayment.findFirst({
            where: { projectId },
            orderBy: { paymentNumber: 'desc' }
        });
        const paymentNumber = lastPayment ? lastPayment.paymentNumber + 1 : 1;
        const progressPayment = yield prisma.progressPayment.create({
            data: {
                projectId,
                paymentNumber,
                description,
                requestedAmount: parseFloat(requestedAmount.toString()),
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
                status: 'DRAFT'
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        customer: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                documents: true
            }
        });
        return res.status(201).json({ success: true, data: progressPayment });
    }
    catch (error) {
        console.error('Hakediş oluşturulurken hata:', error);
        return res.status(500).json({ success: false, message: 'Hakediş oluşturulamadı', error });
    }
});
exports.createProgressPayment = createProgressPayment;
/**
 * Hakediş güncelle
 */
const updateProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield (0, next_auth_1.getServerSession)(req, res, auth_1.authOptions);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
        const { id } = req.params;
        const { description, requestedAmount, dueDate, notes } = req.body;
        const progressPayment = yield prisma.progressPayment.findUnique({
            where: { id }
        });
        if (!progressPayment) {
            return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
        }
        const updatedProgressPayment = yield prisma.progressPayment.update({
            where: { id },
            data: {
                description,
                requestedAmount: requestedAmount ? parseFloat(requestedAmount.toString()) : undefined,
                dueDate: dueDate ? new Date(dueDate) : null,
                notes
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        customer: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                documents: true
            }
        });
        return res.status(200).json({ success: true, data: updatedProgressPayment });
    }
    catch (error) {
        console.error('Hakediş güncellenirken hata:', error);
        return res.status(500).json({ success: false, message: 'Hakediş güncellenemedi', error });
    }
});
exports.updateProgressPayment = updateProgressPayment;
/**
 * Hakediş sil
 */
const deleteProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield (0, next_auth_1.getServerSession)(req, res, auth_1.authOptions);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
        const { id } = req.params;
        const progressPayment = yield prisma.progressPayment.findUnique({
            where: { id }
        });
        if (!progressPayment) {
            return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
        }
        // İlişkili belgeleri sil
        yield prisma.progressPaymentDocument.deleteMany({
            where: { progressPaymentId: id }
        });
        // Hakediş kaydını sil
        yield prisma.progressPayment.delete({
            where: { id }
        });
        return res.status(200).json({ success: true, message: 'Hakediş başarıyla silindi' });
    }
    catch (error) {
        console.error('Hakediş silinirken hata:', error);
        return res.status(500).json({ success: false, message: 'Hakediş silinemedi', error });
    }
});
exports.deleteProgressPayment = deleteProgressPayment;
/**
 * Hakediş durumunu güncelle
 */
const updateProgressPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield (0, next_auth_1.getServerSession)(req, res, auth_1.authOptions);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
        const { id } = req.params;
        const { status, approvedAmount, paidAmount, paymentDate, notes } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Durum bilgisi gereklidir' });
        }
        const progressPayment = yield prisma.progressPayment.findUnique({
            where: { id }
        });
        if (!progressPayment) {
            return res.status(404).json({ success: false, message: 'Hakediş bulunamadı' });
        }
        const updatedProgressPayment = yield prisma.progressPayment.update({
            where: { id },
            data: {
                status,
                approvedAmount: approvedAmount ? parseFloat(approvedAmount.toString()) : undefined,
                paidAmount: paidAmount ? parseFloat(paidAmount.toString()) : undefined,
                paymentDate: paymentDate ? new Date(paymentDate) : null,
                notes: notes !== undefined ? notes : progressPayment.notes
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        customer: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                documents: true
            }
        });
        return res.status(200).json({ success: true, data: updatedProgressPayment });
    }
    catch (error) {
        console.error('Hakediş durumu güncellenirken hata:', error);
        return res.status(500).json({ success: false, message: 'Hakediş durumu güncellenemedi', error });
    }
});
exports.updateProgressPaymentStatus = updateProgressPaymentStatus;
/**
 * Proje finansal özetini getir
 */
const getProjectFinancialSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const session = yield (0, next_auth_1.getServerSession)(req, res, auth_1.authOptions);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }
        const { id } = req.params; // Proje ID'si
        // Projenin var olup olmadığını kontrol et
        const project = yield prisma.project.findUnique({
            where: { id }
        });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Proje bulunamadı' });
        }
        // Projeye ait tüm hakedişleri getir
        const progressPayments = yield prisma.progressPayment.findMany({
            where: { projectId: id }
        });
        // Finansal özeti hesapla
        const totalRequested = progressPayments.reduce((sum, payment) => sum + payment.requestedAmount, 0);
        const totalApproved = progressPayments.reduce((sum, payment) => sum + (payment.approvedAmount || 0), 0);
        const totalPaid = progressPayments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
        const remainingBalance = totalApproved - totalPaid;
        const completionPercentage = totalApproved > 0 ? (totalPaid / totalApproved) * 100 : 0;
        const financialSummary = {
            projectId: id,
            projectName: project.name,
            totalRequested,
            totalApproved,
            totalPaid,
            remainingBalance,
            completionPercentage: Math.round(completionPercentage * 100) / 100, // İki ondalık basamağa yuvarla
            paymentCount: progressPayments.length
        };
        return res.status(200).json({ success: true, data: financialSummary });
    }
    catch (error) {
        console.error('Proje finansal özeti alınırken hata:', error);
        return res.status(500).json({ success: false, message: 'Proje finansal özeti alınamadı', error });
    }
});
exports.getProjectFinancialSummary = getProjectFinancialSummary;
