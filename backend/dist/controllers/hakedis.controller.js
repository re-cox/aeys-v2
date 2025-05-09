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
exports.deleteHakedis = exports.updateHakedis = exports.createHakedis = exports.getHakedisById = exports.getAllHakedisler = void 0;
const prisma_1 = require("../lib/prisma");
// Tüm hakedişleri listele
const getAllHakedisler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hakedisler = yield prisma_1.prisma.hakedis.findMany({
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
                // İleride onaylayan bilgisi de eklenebilir
                // onaylayan: {
                //   select: {
                //     id: true,
                //     name: true,
                //     surname: true,
                //   },
                // },
            },
            orderBy: {
                hakedisTarihi: 'desc',
            },
        });
        return res.status(200).json(hakedisler);
    }
    catch (error) {
        console.error('Hakedişleri getirme hatası:', error);
        return res.status(500).json({ message: 'Hakedişler alınırken bir sunucu hatası oluştu.' });
    }
});
exports.getAllHakedisler = getAllHakedisler;
// Belirli bir hakedişi ID ile getir (İleride eklenecek)
const getHakedisById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement
    return res.status(501).json({ message: 'Not Implemented' });
});
exports.getHakedisById = getHakedisById;
// Yeni hakediş oluştur (İleride eklenecek)
const createHakedis = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement
    // KDV ve Toplam Tutar burada hesaplanmalı
    return res.status(501).json({ message: 'Not Implemented' });
});
exports.createHakedis = createHakedis;
// Hakediş güncelle (İleride eklenecek)
const updateHakedis = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement
    return res.status(501).json({ message: 'Not Implemented' });
});
exports.updateHakedis = updateHakedis;
// Hakediş sil (İleride eklenecek)
const deleteHakedis = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement
    return res.status(501).json({ message: 'Not Implemented' });
});
exports.deleteHakedis = deleteHakedis;
