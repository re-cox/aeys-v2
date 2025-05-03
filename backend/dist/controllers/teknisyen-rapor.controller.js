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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeknisyenDokuman = exports.uploadTeknisyenDokuman = exports.getPersoneller = exports.deleteTeknisyenRaporu = exports.updateTeknisyenRaporu = exports.createTeknisyenRaporu = exports.getTeknisyenRaporu = exports.getTeknisyenRaporlari = void 0;
const prisma_1 = require("../lib/prisma"); // Orijinal import'a geri dön
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Doğrudan başlatmayı kaldır
/*
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
*/
// Tüm teknisyen raporlarını listele
const getTeknisyenRaporlari = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, projeId, siteId, durum } = req.query;
        let filter = {};
        if (userId)
            filter.teknisyenId = userId;
        if (projeId)
            filter.projeId = projeId;
        if (siteId)
            filter.siteId = siteId;
        if (durum)
            filter.durum = durum;
        const raporlar = yield prisma_1.prisma.teknisyenRapor.findMany({
            where: filter,
            include: {
                teknisyen: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true
                    }
                },
                proje: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                site: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                dokumanlar: {
                    select: {
                        id: true,
                        dosyaAdi: true,
                        dosyaUrl: true,
                        dosyaTipu: true,
                        dosyaBoyutu: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                tarih: 'desc'
            }
        });
        return res.status(200).json(raporlar);
    }
    catch (error) {
        console.error('Teknisyen raporlarını getirme hatası:', error);
        return res.status(500).json({ message: 'Teknisyen raporları alınırken bir hata oluştu' });
    }
});
exports.getTeknisyenRaporlari = getTeknisyenRaporlari;
// Belirli bir teknisyen raporunu getir
const getTeknisyenRaporu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const rapor = yield prisma_1.prisma.teknisyenRapor.findUnique({
            where: { id },
            include: {
                teknisyen: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true
                    }
                },
                proje: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                site: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                dokumanlar: {
                    select: {
                        id: true,
                        dosyaAdi: true,
                        dosyaUrl: true,
                        dosyaTipu: true,
                        dosyaBoyutu: true,
                        createdAt: true
                    }
                }
            }
        });
        if (!rapor) {
            return res.status(404).json({ message: 'Teknisyen raporu bulunamadı' });
        }
        return res.status(200).json(rapor);
    }
    catch (error) {
        console.error('Teknisyen raporu getirme hatası:', error);
        return res.status(500).json({ message: 'Teknisyen raporu alınırken bir hata oluştu' });
    }
});
exports.getTeknisyenRaporu = getTeknisyenRaporu;
// Yeni teknisyen raporu oluştur
const createTeknisyenRaporu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { baslik, aciklama, durum, teknisyenId, projeId, siteId } = req.body;
        if (!baslik || !teknisyenId) {
            return res.status(400).json({ message: 'Başlık ve teknisyen bilgileri gereklidir' });
        }
        const yeniRapor = yield prisma_1.prisma.teknisyenRapor.create({
            data: {
                baslik,
                aciklama,
                durum: durum || 'TASLAK',
                teknisyenId,
                projeId,
                siteId
            },
            include: {
                teknisyen: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true
                    }
                }
            }
        });
        return res.status(201).json(yeniRapor);
    }
    catch (error) {
        console.error('Teknisyen raporu oluşturma hatası:', error);
        return res.status(500).json({ message: 'Teknisyen raporu oluşturulurken bir hata oluştu' });
    }
});
exports.createTeknisyenRaporu = createTeknisyenRaporu;
// Teknisyen raporunu güncelle
const updateTeknisyenRaporu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { baslik, aciklama, durum, projeId, siteId } = req.body;
        const raporVarMi = yield prisma_1.prisma.teknisyenRapor.findUnique({
            where: { id }
        });
        if (!raporVarMi) {
            return res.status(404).json({ message: 'Güncellenecek teknisyen raporu bulunamadı' });
        }
        const guncelRapor = yield prisma_1.prisma.teknisyenRapor.update({
            where: { id },
            data: {
                baslik,
                aciklama,
                durum,
                projeId,
                siteId,
                updatedAt: new Date()
            },
            include: {
                teknisyen: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true
                    }
                },
                dokumanlar: true
            }
        });
        return res.status(200).json(guncelRapor);
    }
    catch (error) {
        console.error('Teknisyen raporu güncelleme hatası:', error);
        return res.status(500).json({ message: 'Teknisyen raporu güncellenirken bir hata oluştu' });
    }
});
exports.updateTeknisyenRaporu = updateTeknisyenRaporu;
// Teknisyen raporunu sil
const deleteTeknisyenRaporu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const raporVarMi = yield prisma_1.prisma.teknisyenRapor.findUnique({
            where: { id },
            include: { dokumanlar: true }
        });
        if (!raporVarMi) {
            return res.status(404).json({ message: 'Silinecek teknisyen raporu bulunamadı' });
        }
        // Önce dokumanları sil
        for (const dokuman of raporVarMi.dokumanlar) {
            try {
                // Dosya sisteminden dosyayı sil
                const filePath = path_1.default.join(process.cwd(), 'uploads', 'teknisyen-dokumanlar', path_1.default.basename(dokuman.dosyaUrl));
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            catch (fileError) {
                console.error('Dosya silme hatası:', fileError);
            }
        }
        // Raporu ve ilişkili dokumanları sil (cascade delete ile)
        yield prisma_1.prisma.teknisyenRapor.delete({
            where: { id }
        });
        return res.status(200).json({ message: 'Teknisyen raporu başarıyla silindi' });
    }
    catch (error) {
        console.error('Teknisyen raporu silme hatası:', error);
        return res.status(500).json({ message: 'Teknisyen raporu silinirken bir hata oluştu' });
    }
});
exports.deleteTeknisyenRaporu = deleteTeknisyenRaporu;
// Personel listesini getir (teknisyen seçimi için)
const getPersoneller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const personeller = yield prisma_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                // Departman ilişkisi User modelinde değil, Employee modelinde.
                // department: {
                //   select: {
                //     id: true,
                //     name: true
                //   }
                // }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.status(200).json(personeller);
    }
    catch (error) {
        console.error('Personelleri getirme hatası:', error);
        return res.status(500).json({ message: 'Personeller alınırken bir hata oluştu' });
    }
});
exports.getPersoneller = getPersoneller;
// Teknisyen raporu için doküman yükle
const uploadTeknisyenDokuman = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen bir dosya yükleyin' });
        }
        const { raporId, yuklayanId } = req.body;
        if (!raporId || !yuklayanId) {
            return res.status(400).json({ message: 'Rapor ID ve yükleyen ID gereklidir' });
        }
        // Rapor mevcut mu kontrol et
        const rapor = yield prisma_1.prisma.teknisyenRapor.findUnique({
            where: { id: raporId }
        });
        if (!rapor) {
            return res.status(404).json({ message: 'Rapor bulunamadı' });
        }
        const file = req.file;
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'teknisyen-dokumanlar');
        // Klasör yoksa oluştur
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        // Benzersiz dosya adı oluştur
        const dosyaUzantisi = path_1.default.extname(file.originalname);
        const benzersizDosyaAdi = `${(0, uuid_1.v4)()}${dosyaUzantisi}`;
        const dosyaYolu = path_1.default.join(uploadDir, benzersizDosyaAdi);
        // Dosyayı kaydet
        fs_1.default.writeFileSync(dosyaYolu, file.buffer);
        // Veritabanına kayıt ekle
        const yeniDokuman = yield prisma_1.prisma.teknisyenDokuman.create({
            data: {
                dosyaAdi: file.originalname,
                dosyaTipu: file.mimetype,
                dosyaBoyutu: file.size,
                dosyaUrl: `/uploads/teknisyen-dokumanlar/${benzersizDosyaAdi}`,
                raporId,
                yuklayanId
            }
        });
        return res.status(201).json(yeniDokuman);
    }
    catch (error) {
        console.error('Doküman yükleme hatası:', error);
        return res.status(500).json({ message: 'Doküman yüklenirken bir hata oluştu' });
    }
});
exports.uploadTeknisyenDokuman = uploadTeknisyenDokuman;
// Teknisyen dokümanını sil
const deleteTeknisyenDokuman = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const dokuman = yield prisma_1.prisma.teknisyenDokuman.findUnique({
            where: { id }
        });
        if (!dokuman) {
            return res.status(404).json({ message: 'Doküman bulunamadı' });
        }
        // Dosya sisteminden dosyayı sil
        try {
            const filePath = path_1.default.join(process.cwd(), 'uploads', 'teknisyen-dokumanlar', path_1.default.basename(dokuman.dosyaUrl));
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        catch (fileError) {
            console.error('Dosya silme hatası:', fileError);
        }
        // Veritabanından dokümanı sil
        yield prisma_1.prisma.teknisyenDokuman.delete({
            where: { id }
        });
        return res.status(200).json({ message: 'Doküman başarıyla silindi' });
    }
    catch (error) {
        console.error('Doküman silme hatası:', error);
        return res.status(500).json({ message: 'Doküman silinirken bir hata oluştu' });
    }
});
exports.deleteTeknisyenDokuman = deleteTeknisyenDokuman;
