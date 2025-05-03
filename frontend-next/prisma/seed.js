const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...');

  // Önce bir departman oluşturalım
  console.log('Departman oluşturuluyor...');
  const department = await prisma.department.upsert({
    where: { name: 'Teknik Servis' },
    update: {
      description: 'Elektrik teknisyenlerinin çalıştığı departman'
    },
    create: {
      name: 'Teknik Servis',
      description: 'Elektrik teknisyenlerinin çalıştığı departman'
    }
  });
  
  console.log(`Departman oluşturuldu: ${department.name} (${department.id})`);
  
  // Şimdi bir personel oluşturalım
  console.log('Personel oluşturuluyor...');
  
  // Şifreyi hashleyelim
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  // Önce email ile kontrol edelim
  const existingEmployee = await prisma.employee.findUnique({
    where: { email: 'ahmet.yilmaz@aydem.com' }
  });
  
  if (existingEmployee) {
    console.log(`Personel zaten mevcut: ${existingEmployee.name} ${existingEmployee.surname || ''} (${existingEmployee.id})`);
    
    // Mevcut kullanıcıya şifre ekleyelim (daha önce eklenmemişse)
    if (!existingEmployee.password) {
      await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: { password: hashedPassword }
      });
      console.log('Mevcut personele şifre eklendi.');
    }
  } else {
    const employee = await prisma.employee.create({
      data: {
        name: 'Ahmet',
        surname: 'Yılmaz',
        email: 'ahmet.yilmaz@aydem.com',
        phoneNumber: '5551234567',
        position: 'Elektrik Teknisyeni',
        password: hashedPassword, // Şifre eklendi
        department: {
          connect: { id: department.id }
        },
        birthDate: new Date('1985-05-10'),
        hireDate: new Date('2020-03-15'),
        bloodType: 'A Rh+',
        drivingLicense: 'B',
        address: 'İzmir, Konak',
        iban: 'TR123456789012345678901234',
        salary: 15000,
        militaryStatus: 'Yapıldı',
        education: 'Meslek Yüksekokulu',
        salaryVisibleTo: 'Yönetici',
        annualLeaveAllowance: 14,
        emergencyContacts: {
          create: {
            name: 'Ahmet Acil Kişi',
            phone: '5551234599',
            relation: 'Aile'
          }
        }
      }
    });
    
    console.log(`Personel oluşturuldu: ${employee.name} ${employee.surname} (${employee.id})`);
  }

  console.log('Seed işlemi tamamlandı!');
}

main()
  .catch((e) => {
    console.error('Seed işlemi sırasında hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 