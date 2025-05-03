import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Prisma genel tipleri için

// Prisma transaction tipi
import type { PrismaClient } from '@prisma/client';
type TransactionClient = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// Enumları doğrudan tanımla
enum ProposalStatus {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
}

enum Currency {
    TL = 'TL',
    USD = 'USD',
    EUR = 'EUR',
}

enum ProposalItemType {
    MATERIAL = 'MATERIAL',
    LABOR = 'LABOR',
    OVERHEAD = 'OVERHEAD',
    PROFIT = 'PROFIT',
    OVERHEAD_PROFIT = 'OVERHEAD_PROFIT',
}

// Yardımcı fonksiyon: Teklif toplamlarını hesapla
function calculateTotals(items: any[]) {
    const totals: { [key in Currency]?: number } = {};
    let totalQuantity = 0;
    items.forEach((item) => {
        const currency = item.currency as Currency;
        const itemTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
        totals[currency] = (totals[currency] || 0) + itemTotal;
        totalQuantity += Number(item.quantity) || 0;
    });
    return { totals, totalQuantity };
}

// GET: Belirli bir teklifi ID ile getir
export async function GET(
    req: NextRequest,
    { params }: { params: { proposalId: string } }
) {
    const proposalId = params.proposalId;
    if (!proposalId) {
        return NextResponse.json({ error: "Teklif ID'si eksik" }, { status: 400 });
    }

    try {
        const proposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: {
                customer: { select: { id: true, name: true } },
                items: true,
                attachments: true
            },
        });

        if (!proposal) {
            return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });
        }

        const { totals, totalQuantity } = calculateTotals(proposal.items);
        const responseData = { ...proposal, totals, totalQuantity };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error(`Teklif getirme hatası (ID: ${proposalId}):`, error);
        return NextResponse.json(
            { error: 'Teklif alınamadı', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// PUT: Belirli bir teklifi güncelle
export async function PUT(
    req: NextRequest,
    { params }: { params: { proposalId: string } }
) {
    const proposalId = params.proposalId;
     if (!proposalId) {
        return NextResponse.json({ error: "Teklif ID'si eksik" }, { status: 400 });
    }

    try {
        const data = await req.json();
        const { items, attachments, ...proposalData } = data;

        if (!proposalData.title || !proposalData.customerId) {
             return NextResponse.json({ error: 'Teklif başlığı ve müşteri seçimi zorunludur' }, { status: 400 });
        }
        if (!Array.isArray(items)) {
             return NextResponse.json({ error: 'Teklif kalemleri dizi formatında olmalıdır' }, { status: 400 });
        }

        // TransactionClient tipini kullan
        const updatedProposal = await prisma.$transaction(async (tx: TransactionClient) => {
            await tx.proposalItem.deleteMany({
                where: { proposalId: proposalId },
            });

             await tx.proposalAttachment.deleteMany({
                 where: { proposalId: proposalId },
             });

            const updatedCoreProposal = await tx.proposal.update({
                where: { id: proposalId },
                data: {
                    title: proposalData.title,
                    customerId: proposalData.customerId,
                    description: proposalData.description,
                    status: proposalData.status as ProposalStatus,
                    validUntil: proposalData.validUntil ? new Date(proposalData.validUntil) : null,
                },
            });

            if (items.length > 0) {
                await tx.proposalItem.createMany({
                    data: items.map((item: any) => ({
                        proposalId: proposalId,
                        type: item.type as ProposalItemType,
                        description: item.description,
                        quantity: Number(item.quantity) || 0,
                        unitPrice: item.unitPrice,
                        currency: item.currency as Currency,
                        unit: item.unit
                    })),
                });
            }

            if (attachments && Array.isArray(attachments) && attachments.length > 0) {
                await tx.proposalAttachment.createMany({
                    data: attachments.map((att: any) => ({
                        proposalId: proposalId,
                        fileName: att.fileName,
                        fileUrl: att.fileUrl,
                        fileType: att.fileType,
                        fileSize: att.fileSize,
                    }))
                });
            }

            return updatedCoreProposal;
        });

        const finalProposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: {
                customer: { select: { id: true, name: true } },
                items: true,
                attachments: true
            }
        });

         if (!finalProposal) {
             return NextResponse.json({ error: 'Güncellenen teklif getirilemedi' }, { status: 404 });
        }

        const { totals, totalQuantity } = calculateTotals(finalProposal.items);
        const responseData = { ...finalProposal, totals, totalQuantity };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Teklif güncelleme hatası (ID: ${proposalId}):`, error);
         if (typeof error === 'object' && error !== null && 'code' in error) {
            if (error.code === 'P2025') {
                 return NextResponse.json({ error: 'Güncellenmeye çalışılan teklif bulunamadı' }, { status: 404 });
            }
             console.error("Prisma Error Code:", error.code);
             return NextResponse.json({ error: 'Veritabanı işlemi sırasında bir hata oluştu.', code: error.code }, { status: 400 });
         }
        return NextResponse.json(
            { error: 'Teklif güncellenemedi', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// DELETE: Belirli bir teklifi sil
export async function DELETE(
    req: NextRequest,
    { params }: { params: { proposalId: string } }
) {
    const proposalId = params.proposalId;
     if (!proposalId) {
        return NextResponse.json({ error: "Teklif ID'si eksik" }, { status: 400 });
    }

    try {
        await prisma.proposal.delete({
            where: { id: proposalId },
        });

        return NextResponse.json({ success: true, message: 'Teklif başarıyla silindi' });
    } catch (error) {
        console.error(`Teklif silme hatası (ID: ${proposalId}):`, error);
         if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
             return NextResponse.json({ error: 'Silinecek teklif bulunamadı' }, { status: 404 });
         }
        return NextResponse.json(
            { error: 'Teklif silinemedi', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 