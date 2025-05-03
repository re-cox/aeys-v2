import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function main() {
  try {
    // Admin rolü oluştur
    const adminRole = await prisma.role.create({
      data: {
        name: "Admin",
        description: "Sistem yöneticisi",
        permissions: {
          "users.view": true,
          "users.create": true,
          "users.edit": true,
          "users.delete": true,
          "departments.view": true,
          "departments.create": true,
          "departments.edit": true,
          "departments.delete": true,
          "projects.view": true,
          "projects.create": true,
          "projects.edit": true,
          "projects.delete": true,
          "tasks.view": true,
          "tasks.create": true,
          "tasks.edit": true,
          "tasks.delete": true,
        },
      },
    });

    console.log("Admin rolü oluşturuldu:", adminRole);

    // Kullanıcı şifresini hashle
    const passwordHash = await hashPassword("Admin123!");

    // Admin kullanıcısı oluştur
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@aydem.com",
        name: "Admin",
        surname: "Kullanıcı",
        passwordHash,
        roleId: adminRole.id,
      },
    });

    console.log("Admin kullanıcısı oluşturuldu:", {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
    });

    // --- YENİ ADMIN KULLANICISI EKLEME BAŞLANGICI ---
    console.log("\nAhmet Yılmaz kullanıcısı oluşturuluyor...");
    
    // Ahmet Yılmaz için şifreyi hashle
    const ahmetPasswordHash = await hashPassword("123456");

    // Ahmet Yılmaz kullanıcısını oluştur
    const ahmetAdminUser = await prisma.user.create({
      data: {
        email: "ahmet.yilmaz@aeys.com",
        name: "Ahmet",
        surname: "Yılmaz",
        passwordHash: ahmetPasswordHash, // Hashlenmiş şifreyi kullan
        roleId: adminRole.id, // Mevcut admin rolünü ata
        // Gerekirse departman ata:
        // departmentId: departmentYonetim.id,
      },
    });

    console.log("Ahmet Yılmaz admin kullanıcısı oluşturuldu:", {
      id: ahmetAdminUser.id,
      email: ahmetAdminUser.email,
      name: ahmetAdminUser.name,
      surname: ahmetAdminUser.surname,
    });
    // --- YENİ ADMIN KULLANICISI EKLEME SONU ---

    // Personel rolü oluştur
    const employeeRole = await prisma.role.create({
      data: {
        name: "Personel",
        description: "Genel personel",
        permissions: {
          "projects.view": true,
          "tasks.view": true,
          "tasks.create": true,
          "tasks.edit": true,
        },
      },
    });

    console.log("Personel rolü oluşturuldu:", employeeRole);

    // Örnek departmanlar oluştur
    const departmentYonetim = await prisma.department.create({
      data: {
        name: "Yönetim",
        description: "Şirket yönetim departmanı",
      },
    });

    console.log("Yönetim departmanı oluşturuldu:", departmentYonetim);

    const departmentTeknik = await prisma.department.create({
      data: {
        name: "Teknik",
        description: "Teknik işler departmanı",
      },
    });

    console.log("Teknik departmanı oluşturuldu:", departmentTeknik);

    // Örnek müşteri oluştur
    const customer = await prisma.customer.create({
      data: {
        name: "ABC Elektrik Ltd. Şti.",
        status: "ACTIVE"
      },
    });

    console.log("Müşteri oluşturuldu:", customer);

    // Örnek proje oluştur
    const project = await prisma.project.create({
      data: {
        name: "İzmir Trafo Bakım Projesi",
        description: "İzmir bölgesi trafo bakım ve onarım projesi",
        status: "IN_PROGRESS",
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        budget: 250000,
        departmentId: departmentTeknik.id,
        customerId: customer.id,
      },
    });

    console.log("Proje oluşturuldu:", project);

    // Örnek görev oluştur
    const task = await prisma.task.create({
      data: {
        title: "Saha keşif çalışması",
        description: "İzmir bölgesi trafo lokasyonlarının keşfi",
        status: "IN_PROGRESS",
        priority: "HIGH",
        startDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
        estimatedHours: 40,
        projectId: project.id,
        createdById: adminUser.id,
        assignees: {
          connect: [{ id: adminUser.id }],
        },
      },
    });

    console.log("Görev oluşturuldu:", task);

    // Test kullanıcısı oluştur
    const testPasswordHash = await hashPassword("test123");
    
    const testUser = await prisma.user.create({
      data: {
        email: "test@aeys.com",
        name: "Test",
        surname: "Kullanıcı",
        passwordHash: testPasswordHash,
        roleId: employeeRole.id,
        employee: {
          create: {
            departmentId: departmentTeknik.id,
            position: "Test Teknisyeni",
            phoneNumber: "555-123-4567",
          }
        }
      },
    });

    console.log("Test kullanıcısı oluşturuldu:", {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      surname: testUser.surname,
      role: "Personel"
    });

  } catch (error) {
    console.error("Seed hatası:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 