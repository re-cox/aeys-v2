import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...');

  // Öncelikle departmanları oluşturalım
  const departments = [
    { name: 'Teknik Servis' },
    { name: 'Finans' },
    { name: 'İnsan Kaynakları' },
    { name: 'Satış ve Pazarlama' },
    { name: 'Bilgi Teknolojileri' }
  ];

  console.log('Departmanlar oluşturuluyor...');
  
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept
    });
  }

  // Departmanları veritabanından çekelim (ID'leri için)
  const dbDepartments = await prisma.department.findMany();
  const deptMap = new Map(dbDepartments.map(d => [d.name, d.id]));

  // Personel verilerini oluşturalım
  const employees = [
    {
      name: 'Ahmet',
      surname: 'Yılmaz',
      email: 'ahmet.yilmaz@aydem.com',
      phone: '5551234567',
      position: 'Elektrik Teknisyeni',
      departmentId: deptMap.get('Teknik Servis')!,
      birthDate: '1985-05-10',
      hireDate: '2020-03-15',
      bloodType: 'A Rh+',
      drivingLicense: 'B',
      address: 'İzmir, Konak',
      iban: 'TR123456789012345678901234',
      salary: 15000,
      militaryStatus: 'Yapıldı',
      education: 'Meslek Yüksekokulu',
      salaryVisibleTo: []
    },
    {
      name: 'Ayşe',
      surname: 'Demir',
      email: 'ayse.demir@aydem.com',
      phone: '5559876543',
      position: 'Muhasebeci',
      departmentId: deptMap.get('Finans')!,
      birthDate: '1990-12-20',
      hireDate: '2021-01-10',
      bloodType: '0 Rh-',
      address: 'İzmir, Bornova',
      iban: 'TR123456789012345678901235',
      salary: 18000,
      militaryStatus: 'Muaf',
      education: 'Üniversite',
      salaryVisibleTo: []
    },
    {
      name: 'Mehmet',
      surname: 'Kaya',
      email: 'mehmet.kaya@aydem.com',
      phone: '5553456789',
      position: 'İnsan Kaynakları Uzmanı',
      departmentId: deptMap.get('İnsan Kaynakları')!,
      birthDate: '1988-08-15',
      hireDate: '2019-05-20',
      bloodType: 'AB Rh+',
      drivingLicense: 'B',
      address: 'İzmir, Karşıyaka',
      iban: 'TR123456789012345678901236',
      salary: 20000,
      militaryStatus: 'Yapıldı',
      education: 'Yüksek Lisans',
      salaryVisibleTo: []
    }
  ];

  console.log('Personeller oluşturuluyor...');
  
  for (const emp of employees) {
    const email = emp.email;
    const existingEmployee = await prisma.employee.findFirst({
      where: { email },
    });

    if (!existingEmployee) {
      await prisma.employee.create({
        data: {
          name: emp.name,
          surname: emp.surname,
          email: emp.email,
          phone: emp.phone,
          position: emp.position,
          departmentId: emp.departmentId,
          birthDate: emp.birthDate,
          hireDate: emp.hireDate,
          bloodType: emp.bloodType,
          drivingLicense: emp.drivingLicense,
          address: emp.address,
          iban: emp.iban,
          salary: emp.salary,
          militaryStatus: emp.militaryStatus,
          education: emp.education,
          salaryVisibleTo: emp.salaryVisibleTo,
          emergencyContact: {
            create: {
              name: `${emp.name} Acil Kişi`,
              phone: emp.phone?.replace(/\d{2}$/, '99'),
              relation: 'Aile'
            }
          }
        }
      });

      console.log(`Personel oluşturuldu: ${emp.name} ${emp.surname}`);
    } else {
      console.log(`Personel zaten mevcut: ${emp.name} ${emp.surname}`);
    }
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