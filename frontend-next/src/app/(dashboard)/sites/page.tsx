"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, MapPin, Filter, 
  Users, Building2, Clock, 
  CheckCircle2, AlertCircle, 
  List, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Tip tanımlamaları
interface Site {
  id: string;
  name: string;
  location: string;
  status: keyof SiteStatus;
  manager: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  employeeCount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface SiteStatus {
  ACTIVE: 'ACTIVE';
  COMPLETED: 'COMPLETED';
  PLANNED: 'PLANNED';
  SUSPENDED: 'SUSPENDED';
}

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
}

// Statik konfigürasyonlar
const statusConfig = {
  ACTIVE: { 
    label: 'Aktif', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle2 
  },
  COMPLETED: { 
    label: 'Tamamlandı', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: CheckCircle2 
  },
  PLANNED: { 
    label: 'Planlandı', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: Clock 
  },
  SUSPENDED: { 
    label: 'Askıya Alındı', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: AlertCircle 
  },
};

export default function SitesPage() {
  // State tanımlamaları
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Filtre state'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  
  // Şantiye ekleme/düzenleme state'leri
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [siteFormData, setSiteFormData] = useState({
    name: '',
    location: '',
    status: 'PLANNED' as keyof SiteStatus,
    manager: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    budget: 0,
    progress: 0,
    employeeCount: 0,
    description: '',
  });

  // Görünüm state'i
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Yardımcı fonksiyonlar
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // API verilerini yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock veriler
        const mockEmployees: Employee[] = [
          { id: '1', name: 'Ahmet Yılmaz', position: 'Şantiye Müdürü', department: 'Saha Operasyonları', email: 'ahmet.yilmaz@aydem.com', phone: '555-123-4567' },
          { id: '2', name: 'Ayşe Demir', position: 'Proje Müdürü', department: 'Saha Operasyonları', email: 'ayse.demir@aydem.com', phone: '555-234-5678' },
          { id: '3', name: 'Mehmet Kaya', position: 'Saha Mühendisi', department: 'Teknik Planlama', email: 'mehmet.kaya@aydem.com', phone: '555-345-6789' },
        ];

        const mockSites: Site[] = [
          {
            id: '1',
            name: 'İzmir Bornova Trafo Merkezi',
            location: 'İzmir, Bornova',
            status: 'ACTIVE',
            manager: '1',
            startDate: '2024-01-15',
            endDate: '2024-06-30',
            budget: 2500000,
            progress: 65,
            employeeCount: 25,
            description: 'Bornova bölgesi için yeni trafo merkezi inşaatı',
            createdAt: '2024-01-10T08:00:00',
            updatedAt: '2024-03-15T14:30:00',
          },
          {
            id: '2',
            name: 'Manisa Elektrik Dağıtım Hattı',
            location: 'Manisa, Merkez',
            status: 'PLANNED',
            manager: '2',
            startDate: '2024-04-01',
            endDate: '2024-09-30',
            budget: 1800000,
            progress: 0,
            employeeCount: 0,
            description: 'Manisa merkez elektrik dağıtım hattı yenileme projesi',
            createdAt: '2024-02-20T10:15:00',
            updatedAt: '2024-02-20T10:15:00',
          },
          {
            id: '3',
            name: 'Aydın Güneş Enerjisi Santrali',
            location: 'Aydın, Germencik',
            status: 'COMPLETED',
            manager: '3',
            startDate: '2023-06-01',
            endDate: '2024-02-28',
            budget: 5000000,
            progress: 100,
            employeeCount: 0,
            description: 'Germencik bölgesi güneş enerjisi santrali kurulumu',
            createdAt: '2023-05-15T09:00:00',
            updatedAt: '2024-02-28T16:45:00',
          },
        ];

        setEmployees(mockEmployees);
        setSites(mockSites);
        setFilteredSites(mockSites);
        setLoading(false);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filtreleme
  useEffect(() => {
    let result = [...sites];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(site => 
        site.name.toLowerCase().includes(searchLower) || 
        site.location.toLowerCase().includes(searchLower) ||
        site.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter) {
      result = result.filter(site => site.status === statusFilter);
    }
    
    if (locationFilter) {
      result = result.filter(site => 
        site.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    setFilteredSites(result);
  }, [sites, searchTerm, statusFilter, locationFilter]);

  return (
    <div className="container mx-auto px-4 py-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Sayfa Başlığı ve Kontroller */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
              Şantiye Yönetimi
            </h1>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className={`${viewMode === 'list' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                Liste
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`${viewMode === 'grid' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button 
                onClick={() => {
                  setSiteFormData({
                    name: '',
                    location: '',
                    status: 'PLANNED',
                    manager: '',
                    startDate: new Date().toISOString().substring(0, 10),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
                    budget: 0,
                    progress: 0,
                    employeeCount: 0,
                    description: '',
                  });
                  setShowSiteModal(true);
                  setEditingSite(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Yeni Şantiye
              </Button>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Şantiye</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{sites.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/30">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <div className="mt-2 flex space-x-2">
                {Object.entries(statusConfig).map(([key, value]) => (
                  <span 
                    key={key}
                    className={`text-xs px-2 py-1 rounded-full flex items-center ${value.color}`}
                  >
                    {sites.filter(s => s.status === key).length}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktif Şantiyeler</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sites.filter(s => s.status === 'ACTIVE').length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Toplam çalışan sayısı: {sites.reduce((acc, site) => acc + site.employeeCount, 0)}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Bütçe</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(sites.reduce((acc, site) => acc + site.budget, 0))}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full dark:bg-yellow-900/30">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Aktif şantiye bütçesi: {formatCurrency(sites.filter(s => s.status === 'ACTIVE').reduce((acc, site) => acc + site.budget, 0))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ortalama İlerleme</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(sites.filter(s => s.status === 'ACTIVE').reduce((acc, site) => acc + site.progress, 0) / 
                    (sites.filter(s => s.status === 'ACTIVE').length || 1))}%
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full dark:bg-purple-900/30">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 dark:bg-gray-700">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full dark:bg-purple-500" 
                  style={{ 
                    width: `${Math.round(sites.filter(s => s.status === 'ACTIVE').reduce((acc, site) => acc + site.progress, 0) / 
                    (sites.filter(s => s.status === 'ACTIVE').length || 1))}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Arama ve Filtreler */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Şantiye ara..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Durum Filtrele</option>
                {Object.entries(statusConfig).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              
              <select
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">Konum Filtrele</option>
                {Array.from(new Set(sites.map(site => site.location.split(',')[0].trim()))).map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setLocationFilter('');
                }}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtreleri Temizle
              </Button>
            </div>
          </div>

          {/* Şantiye Listesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSites.map((site) => {
              const manager = employees.find(e => e.id === site.manager);
              const status = statusConfig[site.status];
              
              return (
                <div 
                  key={site.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <status.icon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(site.startDate)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {site.name}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      {site.location}
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {site.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">İlerleme</span>
                        <span className="font-medium text-gray-900 dark:text-white">{site.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${site.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4 mr-2" />
                        {site.employeeCount} Çalışan
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Building2 className="w-4 h-4 mr-2" />
                        {manager?.name || 'Atanmamış'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(site.budget)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSite(site);
                          setSiteFormData({
                            name: site.name,
                            location: site.location,
                            status: site.status,
                            manager: site.manager,
                            startDate: site.startDate,
                            endDate: site.endDate,
                            budget: site.budget,
                            progress: site.progress,
                            employeeCount: site.employeeCount,
                            description: site.description,
                          });
                          setShowSiteModal(true);
                        }}
                      >
                        Düzenle
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
} 