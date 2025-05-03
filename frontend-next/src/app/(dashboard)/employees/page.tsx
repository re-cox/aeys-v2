"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Filter, 
  Eye, Edit, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { 
  getAllEmployees, 
  deleteEmployee
} from "@/services/employeeService";
import { API_URL } from "@/services/api";
import { Employee as EmployeeType } from "@/types/employee";
import { toast } from "sonner";

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeType[]>([]);
  const router = useRouter();

  // API'den personel verilerini çek ve hataları yönet
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log("API'den personel verileri alınıyor...");
      
      const data = await getAllEmployees();
      console.log(`${data.length} personel verisi başarıyla alındı.`);
      
      // Personelleri isme göre sırala
      const sortedData = [...data].sort((a, b) => {
        // İsim alanlarının varlığını kontrol et
        const nameA = a.name || '';
        const nameB = b.name || '';
        const surnameA = a.surname || '';
        const surnameB = b.surname || '';
        
        // Önce isme göre sırala
        const nameComparison = nameA.localeCompare(nameB, 'tr');
        // İsimler aynıysa soyisme göre sırala
        if (nameComparison === 0) {
          return surnameA.localeCompare(surnameB, 'tr');
        }
        return nameComparison;
      });
      
      setEmployees(sortedData);
      setFilteredEmployees(sortedData);
    } catch (error) {
      console.error("Personel verileri yüklenirken hata oluştu:", error);
      toast.error("Personel verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Personel sayfası yükleniyor...");
    try {
      fetchEmployees();
    } catch (error) {
      console.error("Personel verilerini yüklerken üst seviye hata:", error);
      toast.error("Personel verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    }
  }, []);

  useEffect(() => {
    if (!employees.length) {
      console.log("Çalışan listesi boş, filtreleme yapılmadı");
      return;
    }
    
    console.log("Filtreleme öncesi toplam çalışan:", employees.length);
    
    let result = [...employees];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.name?.toLowerCase().includes(searchLower) || false) || 
        (emp.surname?.toLowerCase().includes(searchLower) || false) ||
        (emp.position?.toLowerCase().includes(searchLower) || false) ||
        (emp.email && emp.email.toLowerCase().includes(searchLower))
      );
    }
    
    if (departmentFilter) {
      result = result.filter(emp => emp.department?.id === departmentFilter);
    }
    
    console.log("Filtreleme sonrası görüntülenen çalışan:", result.length);
    setFilteredEmployees(result);
  }, [employees, searchTerm, departmentFilter]);

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return '';
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return String(dateString);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!id) {
      toast.error("Geçersiz personel ID'si.");
      return;
    }
    
    if (confirm(`${name} isimli personeli silmek istediğinize emin misiniz?`)) {
      const loadingToast = toast.loading("Personel siliniyor...");
      
      try {
        await deleteEmployee(id);
        toast.dismiss(loadingToast);
        toast.success("Personel başarıyla silindi.");
        fetchEmployees(); // Veriyi yenile
      } catch (error) {
        console.error("Personel silinirken hata:", error);
        toast.dismiss(loadingToast);
        toast.error("Personel silinemedi. Lütfen daha sonra tekrar deneyin.");
      }
    }
  };

  const getFullImageUrl = (relativeUrl: string | null | undefined): string => {
    if (!relativeUrl) return ''; // Resim yoksa boş string dön
    const backendBaseUrl = API_URL.replace('/api', '');
    return `${backendBaseUrl}${relativeUrl}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          Personel Yönetimi
        </h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
          onClick={() => router.push('/employees/new')}
        >
          <Plus className="h-4 w-4 mr-1" />
          Yeni Personel
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Personel ara..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Departman Filtrele</option>
            {Array.from(new Set(employees.filter(emp => emp.department?.id).map(emp => emp.department?.id))).map((deptId, index) => {
              if (!deptId) return null; // Boş departman ID'lerini atla
              const dept = employees.find(emp => emp.department?.id === deptId)?.department;
              return (
                <option key={`dept-${deptId || index}`} value={deptId}>{dept?.name || 'Bilinmeyen Departman'}</option>
              );
            })}
          </select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('');
            }}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtreleri Temizle
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Personel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pozisyon
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Departman
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşe Giriş
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee, index) => {
                    // Konsola yazdır
                    console.log(`Personel ID: ${employee.id}, Name: ${employee.name} ${employee.surname}`);
                    
                    return (
                      <tr key={employee.id || `emp-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                              {employee.profilePictureUrl ? (
                                <img 
                                  src={getFullImageUrl(employee.profilePictureUrl)}
                                  alt={`${employee.name || ''} ${employee.surname || ''}`} 
                                  className="h-full w-full object-cover" 
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                                  {(employee.name || '').charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {employee.name} {employee.surname}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {employee.phoneNumber || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {employee.position || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {employee.department?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(employee.hireDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="link"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                              onClick={() => router.push(`/employees/${employee.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="link"
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 p-1"
                              onClick={() => router.push(`/employees/edit/${employee.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="link"
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                              onClick={() => handleDelete(employee.id, `${employee.name} ${employee.surname}`)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      {loading ? 'Personeller yükleniyor...' : 'Gösterilecek personel bulunamadı.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 