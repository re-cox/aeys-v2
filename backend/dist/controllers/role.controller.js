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
exports.getRoles = void 0;
const prisma_1 = require("../lib/prisma");
/**
 * Tüm rolleri veritabanından getirir.
 * @route GET /api/roles
 * @access Private (Yetkilendirme eklenebilir)
 */
const getRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[Backend Role] Tüm roller isteniyor...');
    try {
        const roles = yield prisma_1.prisma.role.findMany({
            select: {
                id: true,
                name: true,
                // description: true, // Gerekirse açıklama da eklenebilir
            },
            orderBy: {
                name: 'asc' // İsimlere göre sırala
            }
        });
        console.log(`[Backend Role] ${roles.length} rol bulundu.`);
        res.status(200).json(roles);
    }
    catch (error) {
        console.error('[Backend Role] Rolleri getirme hatası:', error);
        res.status(500).json({ message: 'Roller alınırken bir sunucu hatası oluştu.' });
    }
});
exports.getRoles = getRoles;
