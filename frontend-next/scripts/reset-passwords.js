const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const NEW_PASSWORD = '123456';

async function resetPasswords() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);
    
    console.log('Şifre hash\'leniyor:', NEW_PASSWORD);
    console.log('Oluşturulan hash:', passwordHash);
    
    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true
      }
    });
    
    console.log(`Toplam ${employees.length} kullanıcı bulundu.`);
    
    // Update all employees with the new password hash
    for (const employee of employees) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { 
          password: passwordHash,
        }
      });
      
      console.log(`${employee.name} ${employee.surname || ''} (${employee.email}) kullanıcısının şifresi sıfırlandı.`);
    }
    
    console.log('Tüm kullanıcıların şifreleri başarıyla sıfırlandı.');
  } catch (error) {
    console.error('Şifre sıfırlama işlemi sırasında hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords(); 