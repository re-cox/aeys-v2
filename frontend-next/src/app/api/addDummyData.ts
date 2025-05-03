import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Veritabanı bağlantısı kuruluyor...');
    
    // Test bağlantısı
    const testQuery = await prisma.$queryRaw`SELECT 1+1 as result`;
    console.log('Bağlantı başarılı:', testQuery);
    
    // Önce varsa departmanları temizle (ilişkili veriler silinmeli)
    console.log('Varolan verileri temizliyorum...');
    
    const employeeCount = await prisma.employee.count();
    if (employeeCount > 0) {
      // Önce bağımlı tabloları temizle
      await prisma.employeeDocument.deleteMany({});
      await prisma.emergencyContact.deleteMany({});
      await prisma.employee.deleteMany({});
      console.log('Tüm personel verileri silindi');
    }
    
    const departmentCount = await prisma.department.count();
    if (departmentCount > 0) {
      await prisma.department.deleteMany({});
      console.log('Tüm departman verileri silindi');
    }
    
    // Departmanları oluştur
    console.log('Departmanları oluşturuyorum...');
    const departments = await Promise.all([
      prisma.department.create({
        data: {
          name: 'Yazılım Geliştirme',
          description: 'Web ve mobil uygulama geliştirme departmanı'
        }
      }),
      prisma.department.create({
        data: {
          name: 'İnsan Kaynakları',
          description: 'Personel yönetimi ve işe alım departmanı'
        }
      }),
      prisma.department.create({
        data: {
          name: 'Muhasebe',
          description: 'Finans ve muhasebe işlemleri departmanı'
        }
      }),
      prisma.department.create({
        data: {
          name: 'Pazarlama',
          description: 'Ürün ve hizmet pazarlama departmanı'
        }
      }),
      prisma.department.create({
        data: {
          name: 'Satış',
          description: 'Satış ve müşteri geliştirme departmanı'
        }
      }),
      prisma.department.create({
        data: {
          name: 'Müşteri Hizmetleri',
          description: 'Müşteri destek ve çözüm hizmetleri departmanı'
        }
      }),
      prisma.department.create({
        data: {
          name: 'Operasyon',
          description: 'Şirket operasyonları ve lojistik yönetimi departmanı'
        }
      }),
      prisma.department.create({
        data: {
          name: 'Ar-Ge',
          description: 'Araştırma ve geliştirme departmanı'
        }
      })
    ]);
    
    console.log(`${departments.length} departman oluşturuldu`);
    
    // Personelleri oluştur
    console.log('Personelleri oluşturuyorum...');
    
    const employees = await Promise.all([
      // Yazılım departmanı çalışanları
      prisma.employee.create({
        data: {
          name: 'Ahmet',
          surname: 'Yılmaz',
          position: 'Yazılım Mühendisi',
          departmentId: departments[0].id,
          email: 'ahmet.yilmaz@example.com',
          phone: '5551234567',
          birthDate: '1990-05-15',
          hireDate: '2020-03-10',
          bloodType: 'A+',
          drivingLicense: 'B',
          address: 'Kadıköy, İstanbul',
          salary: 25000,
          education: 'Lisans',
          salaryVisibleTo: ['Yönetici', 'İK'],
          emergencyContact: {
            create: {
              name: 'Ayşe Yılmaz',
              phone: '5559876543',
              relation: 'Eş'
            }
          }
        }
      }),
      prisma.employee.create({
        data: {
          name: 'Mehmet',
          surname: 'Kaya',
          position: 'Frontend Geliştirici',
          departmentId: departments[0].id,
          email: 'mehmet.kaya@example.com',
          phone: '5551234568',
          birthDate: '1992-08-20',
          hireDate: '2021-01-15',
          bloodType: 'B+',
          address: 'Beşiktaş, İstanbul',
          salary: 22000,
          education: 'Lisans',
          salaryVisibleTo: ['Yönetici'],
          emergencyContact: {
            create: {
              name: 'Fatma Kaya',
              phone: '5559876544',
              relation: 'Anne'
            }
          }
        }
      }),
      
      // İK departmanı çalışanları
      prisma.employee.create({
        data: {
          name: 'Zeynep',
          surname: 'Demir',
          position: 'İK Uzmanı',
          departmentId: departments[1].id,
          email: 'zeynep.demir@example.com',
          phone: '5551234569',
          birthDate: '1988-11-25',
          hireDate: '2019-06-01',
          bloodType: '0+',
          drivingLicense: 'B',
          address: 'Maltepe, İstanbul',
          salary: 20000,
          education: 'Yüksek Lisans',
          salaryVisibleTo: ['Yönetici', 'İK'],
          emergencyContact: {
            create: {
              name: 'Ali Demir',
              phone: '5559876545',
              relation: 'Eş'
            }
          }
        }
      }),
      
      // Muhasebe departmanı çalışanları
      prisma.employee.create({
        data: {
          name: 'Ayşe',
          surname: 'Şahin',
          position: 'Muhasebe Uzmanı',
          departmentId: departments[2].id,
          email: 'ayse.sahin@example.com',
          phone: '5551234570',
          birthDate: '1985-04-12',
          hireDate: '2018-09-15',
          bloodType: 'AB+',
          drivingLicense: 'B',
          address: 'Ataşehir, İstanbul',
          salary: 23000,
          education: 'Lisans',
          salaryVisibleTo: ['Yönetici', 'İK', 'Muhasebe'],
          emergencyContact: {
            create: {
              name: 'Mustafa Şahin',
              phone: '5559876546',
              relation: 'Eş'
            }
          }
        }
      }),
      
      // Pazarlama departmanı çalışanları
      prisma.employee.create({
        data: {
          name: 'Can',
          surname: 'Özkan',
          position: 'Pazarlama Uzmanı',
          departmentId: departments[3].id,
          email: 'can.ozkan@example.com',
          phone: '5551234571',
          birthDate: '1991-09-30',
          hireDate: '2020-07-01',
          bloodType: 'A-',
          address: 'Bakırköy, İstanbul',
          salary: 21000,
          education: 'Lisans',
          salaryVisibleTo: ['Yönetici'],
          emergencyContact: {
            create: {
              name: 'Ece Özkan',
              phone: '5559876547',
              relation: 'Kardeş'
            }
          }
        }
      })
    ]);
    
    console.log(`${employees.length} personel oluşturuldu`);
    
    console.log('Test verileri başarıyla oluşturuldu!');
  } catch (error) {
    console.error('Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Veritabanı bağlantısı kapatıldı');
  }
}

export default main; 