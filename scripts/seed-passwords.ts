import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const defaultPassword = '123456';
const saltRounds = 10; // bcrypt hashleme tur sayısı

async function main() {
  console.log(`Start seeding default passwords for existing employees...`);

  const employees = await prisma.employee.findMany({
    where: {
      // İsteğe bağlı: Sadece şifresi olmayanları veya belirli kriterlere uyanları seçebilirsiniz
      // Örneğin: password: null
    }
  });

  if (employees.length === 0) {
    console.log("No employees found to update.");
    return;
  }

  console.log(`Found ${employees.length} employees. Hashing default password...`);
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
  console.log(`Default password hashed.`);

  let updatedCount = 0;
  for (const employee of employees) {
    try {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          password: hashedPassword,
          passwordResetRequired: true, // Şifre değiştirme zorunluluğu
        },
      });
      updatedCount++;
      console.log(`Updated password for employee: ${employee.email}`);
    } catch (error) {
      console.error(`Failed to update password for employee ${employee.email}:`, error);
    }
  }

  console.log(`Seeding finished. Updated ${updatedCount} employees.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 