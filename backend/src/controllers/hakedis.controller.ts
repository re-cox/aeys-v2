import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Tüm hakedişleri listele
export const getAllHakedisler = async (req: Request, res: Response) => {
  try {
    const hakedisler = await prisma.hakedis.findMany({
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
  } catch (error) {
    console.error('Hakedişleri getirme hatası:', error);
    return res.status(500).json({ message: 'Hakedişler alınırken bir sunucu hatası oluştu.' });
  }
};

// Belirli bir hakedişi ID ile getir (İleride eklenecek)
export const getHakedisById = async (req: Request, res: Response) => {
  // TODO: Implement
  return res.status(501).json({ message: 'Not Implemented' });
};

// Yeni hakediş oluştur (İleride eklenecek)
export const createHakedis = async (req: Request, res: Response) => {
  // TODO: Implement
  // KDV ve Toplam Tutar burada hesaplanmalı
  return res.status(501).json({ message: 'Not Implemented' });
};

// Hakediş güncelle (İleride eklenecek)
export const updateHakedis = async (req: Request, res: Response) => {
  // TODO: Implement
  return res.status(501).json({ message: 'Not Implemented' });
};

// Hakediş sil (İleride eklenecek)
export const deleteHakedis = async (req: Request, res: Response) => {
  // TODO: Implement
  return res.status(501).json({ message: 'Not Implemented' });
}; 