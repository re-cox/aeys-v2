import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Tüm rolleri veritabanından getirir.
 * @route GET /api/roles
 * @access Private (Yetkilendirme eklenebilir)
 */
export const getRoles = async (req: Request, res: Response) => {
    console.log('[Backend Role] Tüm roller isteniyor...');
    try {
        const roles = await prisma.role.findMany({
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
    } catch (error) {
        console.error('[Backend Role] Rolleri getirme hatası:', error);
        res.status(500).json({ message: 'Roller alınırken bir sunucu hatası oluştu.' });
    }
}; 