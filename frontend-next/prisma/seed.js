const { PrismaClient, CustomerStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...');

  try {
    // Önce mevcut Admin rolünü arayalım
    let adminRole = await prisma.role.findFirst({
      where: { name: "Admin" }
    });

    // Rol yoksa yeni oluşturalım
    if (!adminRole) {
      console.log('Admin rolü oluşturuluyor...');
      adminRole = await prisma.role.create({
        data: {
          id: "role_admin",
          name: "Admin",
          description: "Sistem yöneticisi",
          permissions: JSON.stringify({
            users: ["create", "read", "update", "delete"],
            projects: ["create", "read", "update", "delete"],
            customers: ["create", "read", "update", "delete"]
          }),
          updatedAt: new Date()
        }
      });
      console.log(`Admin rolü oluşturuldu: ${adminRole.name}`);
    } else {
      console.log(`Mevcut Admin rolü kullanılıyor: ${adminRole.name} (${adminRole.id})`);
    }

    // Departman oluşturalım veya mevcut olanı bulalım
    let department;
    try {
      department = await prisma.department.findFirst({
        where: { name: "Teknik Servis" }
      });

      if (!department) {
        console.log('Departman oluşturuluyor...');
        department = await prisma.department.create({
          data: {
            name: "Teknik Servis",
            description: "Elektrik teknisyenlerinin çalıştığı departman"
          }
        });
        console.log(`Departman oluşturuldu: ${department.name} (${department.id})`);
      } else {
        console.log(`Mevcut departman kullanılıyor: ${department.name} (${department.id})`);
      }
    } catch (error) {
      console.error("Departman işlemi sırasında hata:", error);
      throw error;
    }
    
    // Kullanıcı oluşturalım veya mevcut olanı bulalım
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: "admin@aydem.com" }
      });
      
      if (!user) {
        console.log('Admin kullanıcısı oluşturuluyor...');
        user = await prisma.user.create({
          data: {
            id: "user_" + Math.random().toString(36).substring(2, 10),
            email: "admin@aydem.com",
            name: "Admin",
            surname: "Kullanıcı",
            passwordHash: hashedPassword,
            roleId: adminRole.id,
            departmentId: department.id,
            updatedAt: new Date()
          }
        });
        console.log(`Kullanıcı oluşturuldu: ${user.name} ${user.surname} (${user.email})`);
      } else {
        console.log(`Mevcut kullanıcı kullanılıyor: ${user.name} ${user.surname} (${user.email})`);
      }
    } catch (error) {
      console.error("Kullanıcı işlemi sırasında hata:", error);
      throw error;
    }

    // Örnek müşteri oluşturalım veya mevcut olanı bulalım
    try {
      const existingCustomer = await prisma.customer.findFirst({
        where: { name: "Örnek Müşteri A.Ş." }
      });
      
      if (!existingCustomer) {
        console.log('Müşteri oluşturuluyor...');
        const customer = await prisma.customer.create({
          data: {
            name: "Örnek Müşteri A.Ş.",
            email: "info@ornek.com",
            phone: "0212 555 55 55",
            address: "İstanbul, Türkiye",
            taxId: "1234567890",
            status: CustomerStatus.ACTIVE
          }
        });
        console.log(`Müşteri oluşturuldu: ${customer.name}`);
      } else {
        console.log(`Mevcut müşteri kullanılıyor: ${existingCustomer.name}`);
      }
    } catch (error) {
      console.error("Müşteri işlemi sırasında hata:", error);
      throw error;
    }

    console.log('Seed işlemi başarıyla tamamlandı!');
  } catch (error) {
    console.error('Seed işlemi sırasında hata oluştu:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed işlemi sırasında hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 