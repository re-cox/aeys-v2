"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Filter, 
  Package, Warehouse, AlertTriangle,
  ArrowDown, ArrowUp, History,
  List, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Tip tanımlamaları
interface InventoryItem {
  id: string;
  name: string;
  code: string;
  siteId: string;
  category: keyof InventoryCategory;
  quantity: number;
  unit: string;
  minQuantity: number;
  maxQuantity: number;
  location: string;
  lastStockEntry: string;
  lastStockExit: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryCategory {
  EQUIPMENT: 'EQUIPMENT';
  MATERIAL: 'MATERIAL';
  TOOL: 'TOOL';
  CONSUMABLE: 'CONSUMABLE';
}

interface Site {
  id: string;
  name: string;
  location: string;
}

interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  reason: string;
  siteId: string;
  createdBy: string;
}

// Statik konfigürasyonlar
const categoryConfig = {
  EQUIPMENT: { 
    label: 'Ekipman', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
  },
  MATERIAL: { 
    label: 'Malzeme', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
  },
  TOOL: { 
    label: 'Alet', 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
  },
  CONSUMABLE: { 
    label: 'Sarf Malzeme', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' 
  },
};

export default function SiteInventoryPage() {
  // State tanımlamaları
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  
  // Filtre state'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [siteFilter, setSiteFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Stok hareketi ekleme state'leri
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementFormData, setMovementFormData] = useState({
    type: 'IN' as 'IN' | 'OUT',
    quantity: 0,
    reason: '',
    date: new Date().toISOString().substring(0, 10),
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

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return {
        label: 'Stokta Yok',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      };
    }
    if (item.quantity <= item.minQuantity) {
      return {
        label: 'Düşük Stok',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      };
    }
    return {
      label: 'Yeterli Stok',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
  };

  // API verilerini yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock veriler
        const mockSites: Site[] = [
          { id: '1', name: 'İzmir Bornova Trafo Merkezi', location: 'İzmir, Bornova' },
          { id: '2', name: 'Manisa Elektrik Dağıtım Hattı', location: 'Manisa, Merkez' },
          { id: '3', name: 'Aydın Güneş Enerjisi Santrali', location: 'Aydın, Germencik' },
        ];

        const mockItems: InventoryItem[] = [
          {
            id: '1',
            name: 'Yüksek Gerilim Trafosu',
            code: 'TRF-001',
            siteId: '1',
            category: 'EQUIPMENT',
            quantity: 2,
            unit: 'adet',
            minQuantity: 1,
            maxQuantity: 5,
            location: 'Ana Depo',
            lastStockEntry: '2024-03-01',
            lastStockExit: '2024-02-15',
            description: '34.5 kV Yüksek Gerilim Trafosu',
            createdAt: '2024-01-01T08:00:00',
            updatedAt: '2024-03-01T10:30:00',
          },
          {
            id: '2',
            name: 'Elektrik Kablosu',
            code: 'KBL-002',
            siteId: '2',
            category: 'MATERIAL',
            quantity: 500,
            unit: 'metre',
            minQuantity: 200,
            maxQuantity: 1000,
            location: 'Saha Deposu',
            lastStockEntry: '2024-03-10',
            lastStockExit: '2024-03-05',
            description: '95mm² Yeraltı Elektrik Kablosu',
            createdAt: '2024-01-15T09:00:00',
            updatedAt: '2024-03-10T11:45:00',
          },
          {
            id: '3',
            name: 'İzolasyon Bandı',
            code: 'SRF-003',
            siteId: '1',
            category: 'CONSUMABLE',
            quantity: 50,
            unit: 'adet',
            minQuantity: 100,
            maxQuantity: 500,
            location: 'Malzeme Dolabı',
            lastStockEntry: '2024-02-20',
            lastStockExit: '2024-03-12',
            description: 'Elektrik İzolasyon Bandı',
            createdAt: '2024-01-20T10:00:00',
            updatedAt: '2024-03-12T13:15:00',
          },
        ];

        const mockMovements: InventoryMovement[] = [
          {
            id: '1',
            itemId: '1',
            type: 'IN',
            quantity: 2,
            date: '2024-03-01',
            reason: 'Yeni stok girişi',
            siteId: '1',
            createdBy: 'Ahmet Yılmaz',
          },
          {
            id: '2',
            itemId: '2',
            type: 'OUT',
            quantity: 100,
            date: '2024-03-05',
            reason: 'Saha kullanımı',
            siteId: '2',
            createdBy: 'Mehmet Kaya',
          },
        ];

        setSites(mockSites);
        setItems(mockItems);
        setFilteredItems(mockItems);
        setMovements(mockMovements);
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
    let result = [...items];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchLower) || 
        item.code.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    if (siteFilter) {
      result = result.filter(item => item.siteId === siteFilter);
    }
    
    if (stockFilter === 'low') {
      result = result.filter(item => item.quantity <= item.minQuantity && item.quantity > 0);
    } else if (stockFilter === 'out') {
      result = result.filter(item => item.quantity <= 0);
    }
    
    setFilteredItems(result);
  }, [items, searchTerm, categoryFilter, siteFilter, stockFilter]);

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
              Şantiye Stok Yönetimi
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
                  setSelectedItem(null);
                  setMovementFormData({
                    type: 'IN',
                    quantity: 0,
                    reason: '',
                    date: new Date().toISOString().substring(0, 10),
                  });
                  setShowMovementModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Stok Hareketi
              </Button>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Ürün</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/30">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <div className="mt-2 flex space-x-2">
                {Object.entries(categoryConfig).map(([key, value]) => (
                  <span 
                    key={key}
                    className={`text-xs px-2 py-1 rounded-full flex items-center ${value.color}`}
                  >
                    {items.filter(i => i.category === key).length}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Düşük Stok</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {items.filter(i => i.quantity <= i.minQuantity && i.quantity > 0).length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full dark:bg-yellow-900/30">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Stokta olmayan: {items.filter(i => i.quantity <= 0).length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Son Hareketler</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {movements.length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full dark:bg-green-900/30">
                  <History className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <div className="mt-4 flex space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Giriş: {movements.filter(m => m.type === 'IN').length}
                  <ArrowUp className="inline-block w-4 h-4 ml-1 text-green-500" />
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Çıkış: {movements.filter(m => m.type === 'OUT').length}
                  <ArrowDown className="inline-block w-4 h-4 ml-1 text-red-500" />
                </span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Depo Sayısı</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Array.from(new Set(items.map(i => i.location))).length}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full dark:bg-purple-900/30">
                  <Warehouse className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Şantiye sayısı: {sites.length}
              </div>
            </div>
          </div>

          {/* Arama ve Filtreler */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Ürün ara..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Kategori Filtrele</option>
                {Object.entries(categoryConfig).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
              
              <select
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
              >
                <option value="">Şantiye Filtrele</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
              
              <select
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
              >
                <option value="all">Tüm Stoklar</option>
                <option value="low">Düşük Stok</option>
                <option value="out">Stokta Yok</option>
              </select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setSiteFilter('');
                  setStockFilter('all');
                }}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtreleri Temizle
              </Button>
            </div>
          </div>

          {/* Stok Listesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const site = sites.find(s => s.id === item.siteId);
              const category = categoryConfig[item.category];
              const stockStatus = getStockStatus(item);
              
              return (
                <div 
                  key={item.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                        {category.label}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {item.name}
                    </h3>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Kod: {item.code}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Miktar</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Min-Max</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.minQuantity}-{item.maxQuantity} {item.unit}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Warehouse className="w-4 h-4 mr-2" />
                        {item.location}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Package className="w-4 h-4 mr-2" />
                        {site?.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Son hareket: {formatDate(item.lastStockEntry)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setMovementFormData({
                            type: 'IN',
                            quantity: 0,
                            reason: '',
                            date: new Date().toISOString().substring(0, 10),
                          });
                          setShowMovementModal(true);
                        }}
                      >
                        Hareket Ekle
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