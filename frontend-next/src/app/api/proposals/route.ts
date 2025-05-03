import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ProposalStatus, Currency, ProposalItemType } from '@/types/proposal';
import { Proposal } from '@/types/proposal';

// Özel tipler
type ProposalWhereInput = {
    OR?: any[];
    customerId?: string;
    status?: string;
    proposalNo?: {
        startsWith?: string;
    };
};

// Yardımcı fonksiyon: Teklif toplamlarını hesapla
function calculateTotals(items: any[]) {
    // Currency tipi için geçici çözüm
    type CurrencyKey = 'TL' | 'USD' | 'EUR' | 'GBP';
    const totals: { [key in CurrencyKey]?: number } = {};
    let totalQuantity = 0;
    
    items.forEach((item) => {
        // Eğer currency null ise veya tanımlı değilse, varsayılan TL kullan
        const currency = (item.currency || 'TL') as CurrencyKey;
        const itemTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
        totals[currency] = (totals[currency] || 0) + itemTotal;
        totalQuantity += Number(item.quantity) || 0;
    });
    
    return { totals, totalQuantity };
}

// GET: Tüm teklifleri getir (filtreleme ve sayfalama ile)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const search = searchParams.get('search') || '';
        const customerId = searchParams.get('customerId');
        const status = searchParams.get('status') as ProposalStatus | null;

        const skip = (page - 1) * limit;

        let whereClause: ProposalWhereInput = {};

        // Arama filtresi (başlık, açıklama, teklif no, müşteri adı)
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { proposalNo: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // Müşteri filtresi
        if (customerId) {
            whereClause.customerId = customerId;
        }

        // Durum filtresi
        if (status && Object.values(ProposalStatus).includes(status)) {
            whereClause.status = status;
        }

        // Teklifleri ve toplam sayıyı al
        const [proposals, totalCount] = await prisma.$transaction([
            prisma.proposal.findMany({
                where: whereClause,
                include: {
                    customer: { select: { id: true, name: true } },
                    items: true,
                    attachments: { select: { id: true, fileName: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: limit,
            }),
            prisma.proposal.count({ where: whereClause })
        ]);

        // Gelen 'proposals' içindeki her bir elemanın tipini belirle
        type ProposalWithItems = Omit<Proposal, 'items' | 'customer'> & { 
            customer: { id: string; name: string | null };
            items: any[]
        };

        const proposalsWithTotals = proposals.map((p: ProposalWithItems) => {
            const { totals, totalQuantity } = calculateTotals(p.items);
            // items anahtarını çıkartırken diğer veriyi koru
            const { items, ...rest } = p;
            return { ...rest, totals, totalQuantity };
        });

        // Yanıtı { proposals: [], totalCount: number } formatında döndür
        return NextResponse.json({ proposals: proposalsWithTotals, totalCount });

    } catch (error) {
        console.error("Teklifleri getirme hatası:", error);
        return NextResponse.json(
            { error: 'Teklifler alınamadı', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}


// POST: Yeni teklif oluştur (kalemleri ve ekleriyle birlikte)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { items, attachments, ...proposalData } = data;

    // Gerekli alan kontrolü
    if (!proposalData.title || !proposalData.customerId) {
      return NextResponse.json({ error: 'Teklif başlığı ve müşteri seçimi zorunludur' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
         return NextResponse.json({ error: 'Teklife en az bir kalem eklenmelidir' }, { status: 400 });
    }

    // Benzersiz Teklif Numarası Oluştur (Örnek: YYYYMMDD-XXXX)
    const today = new Date();
    const datePart = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const countToday = await prisma.proposal.count({ where: { proposalNo: { startsWith: datePart } } });
    const proposalNo = `${datePart}-${(countToday + 1).toString().padStart(4, '0')}`;

    // createdById değerini kontrol et
    const createdById = proposalData.createdById || 'system'; // varsayılan değer

    const newProposal = await prisma.proposal.create({
      data: {
        proposalNo,
        title: proposalData.title,
        customerId: proposalData.customerId,
        description: proposalData.description,
        status: proposalData.status as ProposalStatus || ProposalStatus.DRAFT,
        createdById: createdById,
        validUntil: proposalData.validUntil ? new Date(proposalData.validUntil) : null,
        items: {
          create: items.map((item: any) => ({
            type: item.type as ProposalItemType,
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unitPrice: item.unitPrice,
            currency: item.currency as Currency,
            unit: item.unit
          })),
        },
        attachments: attachments && Array.isArray(attachments) && attachments.length > 0 ? {
            create: attachments.map((att: any) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileType: att.fileType,
                fileSize: att.fileSize,
            }))
        } : undefined,
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
        attachments: true
      },
    });

    // Toplamları hesaplayıp döndür
    const { totals, totalQuantity } = calculateTotals(newProposal.items);
    const responseData = { ...newProposal, totals, totalQuantity };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Teklif oluşturma hatası DETAY:", error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
        if (error.code === 'P2002') {
             return NextResponse.json({ error: 'Bu teklif numarası zaten mevcut.', code: error.code }, { status: 409 });
        }
         console.error('Prisma Error Code:', error.code);
         return NextResponse.json({ error: 'Veritabanı hatası', code: error.code }, { status: 400 });
    }

    return NextResponse.json({
        error: 'Teklif oluşturulamadı',
        details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 