// Mock veri durumunu diğer servislerle paylaşmak için
import { Employee, EmployeeDocument } from '@/types/employee';
import { Department } from '@/types/department';

// Dışa aktarmak için employee listesi
export let mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Ahmet",
    surname: "Yılmaz",
    email: "ahmet.yilmaz@aydem.com",
    phone: "555-1234",
    position: "Elektrik Teknisyeni",
    department: { id: "1", name: "Teknik" },
    birthDate: "1985-05-15",
    hireDate: "2020-03-10",
    bloodType: "A Rh+",
    drivingLicense: "B",
    address: "İzmir, Konak",
    emergencyContact: {
      name: "Ayşe Yılmaz",
      phone: "555-5678",
      relation: "Eş"
    },
    documents: [],
    profileImage: ""
  },
  {
    id: "2",
    name: "Mehmet",
    surname: "Kaya",
    email: "mehmet.kaya@aydem.com",
    phone: "555-4321",
    position: "Müşteri Temsilcisi",
    department: { id: "2", name: "Müşteri Hizmetleri" },
    birthDate: "1990-08-20",
    hireDate: "2019-06-15",
    bloodType: "0 Rh+",
    drivingLicense: "B",
    address: "İzmir, Bornova",
    emergencyContact: {
      name: "Ali Kaya",
      phone: "555-8765",
      relation: "Kardeş"
    },
    documents: [],
    profileImage: ""
  }
];

// Toast bildirimlerini mockEmployees değişkenine aktarın
export const syncMockData = (updatedEmployees: Employee[]) => {
  mockEmployees = [...updatedEmployees];
  console.log("Mock veri güncellendi, toplam:", mockEmployees.length);
  return mockEmployees;
};

// Departmanlar
export const mockDepartments: Department[] = [
  { id: "1", name: "Teknik", description: "Teknik destek ve bakım" },
  { id: "2", name: "Müşteri Hizmetleri", description: "Müşteri ilişkileri" },
  { id: "3", name: "İnsan Kaynakları", description: "Personel yönetimi" },
  { id: "4", name: "Muhasebe", description: "Mali işler" },
  { id: "5", name: "Bilgi İşlem", description: "BT altyapısı" }
]; 