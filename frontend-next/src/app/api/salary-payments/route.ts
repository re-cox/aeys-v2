import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

// Prisma istemcisi
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Veritabanı bağlantısını test et
export async function testDatabaseConnection() {
  try {
    console.log("[DATABASE] Veritabanı bağlantısı test ediliyor...");
    const result = await prisma.$queryRaw`SELECT 1+1 as result`;
    console.log("[DATABASE] Veritabanı bağlantısı başarılı:", result);
    return true;
  } catch (error) {
    console.error("[DATABASE] Veritabanı bağlantı hatası:", error);
    return false;
  }
}

// Tüm maaş ödemelerini getir
export async function GET(request: NextRequest) {
  console.log("[API] Maaş ödemeleri listesi istendi");

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanına bağlanılamadı. Lütfen veritabanı ayarlarınızı kontrol edin." 
      }, { status: 500 });
    }

    // URL parametrelerini kontrol et
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');

    // Eğer employeeId parametresi varsa, sadece o personelin ödemelerini getir
    if (employeeId) {
      try {
        console.log(`[API] ${employeeId} ID'li personelin maaş ödemeleri getiriliyor...`);
        const salaryPayments = await prisma.salaryPayment.findMany({
          where: { employeeId },
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                surname: true,
                department: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            paymentDate: 'desc'
          }
        });

        console.log(`[API] ${salaryPayments.length} maaş ödemesi başarıyla getirildi`);
        return NextResponse.json(salaryPayments);
      } catch (error) {
        console.error("[API] Personel maaş ödemeleri getirme hatası:", error);
        return NextResponse.json({ 
          error: "Personel maaş ödemeleri alınamadı", 
          details: error instanceof Error ? error.message : "Bilinmeyen hata" 
        }, { status: 500 });
      }
    }

    // Tüm ödemeleri getir
    try {
      console.log("[API] Tüm maaş ödemeleri getiriliyor...");
      const salaryPayments = await prisma.salaryPayment.findMany({
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              surname: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          paymentDate: 'desc'
        }
      });

      console.log(`[API] ${salaryPayments.length} maaş ödemesi başarıyla getirildi`);
      return NextResponse.json(salaryPayments);
    } catch (error) {
      console.error("[API] Tüm maaş ödemelerini getirme hatası:", error);
      return NextResponse.json({ 
        error: "Maaş ödemesi kayıtları alınamadı", 
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] Maaş ödemeleri listesi getirme hatası:", error);
    return NextResponse.json({ 
      error: "Maaş ödemesi kayıtları alınamadı", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
}

// Yeni maaş ödemesi oluştur
export async function POST(request: NextRequest) {
  console.log("[API] Yeni maaş ödemesi oluşturma isteği alındı");

  // Veritabanı bağlantısı kontrolü
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error("[API] Veritabanı bağlantısı yok, hata döndürülüyor");
      return NextResponse.json({ 
        error: "Veritabanı bağlantısı kurulamadı. Lütfen veritabanı ayarlarınızı kontrol edin." 
      }, { status: 500 });
    }

    const paymentData = await request.json();

    // Zorunlu alanları kontrol et
    if (!paymentData.employeeId || !paymentData.paymentDate || !paymentData.paymentPeriod || !paymentData.baseSalary || !paymentData.netAmount) {
      return NextResponse.json({
        error: "Personel ID, ödeme tarihi, ödeme dönemi, temel maaş ve net tutar zorunlu alanlardır"
      }, { status: 400 });
    }

    try {
      // Personelin var olup olmadığını kontrol et
      const employee = await prisma.employee.findUnique({
        where: { id: paymentData.employeeId }
      });

      if (!employee) {
        return NextResponse.json({
          error: "Belirtilen personel bulunamadı"
        }, { status: 400 });
      }

      // Yeni ödeme oluştur
      const newPayment = await prisma.salaryPayment.create({
        data: {
          employeeId: paymentData.employeeId,
          paymentDate: new Date(paymentData.paymentDate),
          paymentPeriod: paymentData.paymentPeriod,
          baseSalary: parseFloat(paymentData.baseSalary.toString()),
          overtimePay: paymentData.overtimePay ? parseFloat(paymentData.overtimePay.toString()) : null,
          bonus: paymentData.bonus ? parseFloat(paymentData.bonus.toString()) : null,
          taxDeduction: paymentData.taxDeduction ? parseFloat(paymentData.taxDeduction.toString()) : null,
          otherDeductions: paymentData.otherDeductions ? parseFloat(paymentData.otherDeductions.toString()) : null,
          netAmount: parseFloat(paymentData.netAmount.toString()),
          paymentMethod: paymentData.paymentMethod || null,
          notes: paymentData.notes || null
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          }
        }
      });

      console.log("[API] Yeni maaş ödemesi başarıyla oluşturuldu:", newPayment.id);
      return NextResponse.json(newPayment, { status: 201 });
    } catch (error) {
      console.error("[API] Maaş ödemesi oluşturma hatası:", error);
      return NextResponse.json({ 
        error: "Maaş ödemesi oluşturulamadı", 
        details: error instanceof Error ? error.message : "Bilinmeyen hata" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[API] Maaş ödemesi oluşturma hatası:", error);
    return NextResponse.json({ 
      error: "Maaş ödemesi oluşturulamadı", 
      details: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }, { status: 500 });
  }
} 