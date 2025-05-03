"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Package, Warehouse, AlertTriangle, 
  Calendar, ArrowDownRight, ArrowUpRight, Filter, Pencil,
  MoreHorizontal, XCircle, ArrowUp, ArrowDown, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { Settings as Tool } from "lucide-react";

// Tip tanımlamaları
interface ItemCategory {
  EQUIPMENT: 'EQUIPMENT';
  MATERIAL: 'MATERIAL';
  TOOL: 'TOOL';
  SAFETY: 'SAFETY';
  OFFICE: 'OFFICE';
  OTHER: 'OTHER';
}

interface ItemStatus {
  AVAILABLE: 'AVAILABLE';
  LOW_STOCK: 'LOW_STOCK';
  OUT_OF_STOCK: 'OUT_OF_STOCK';
  DISCONTINUED: 'DISCONTINUED';
  ON_HOLD: 'ON_HOLD';
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: keyof ItemCategory;
  status: keyof ItemStatus;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  location: string;
  supplier: string;
  price: number;
  lastRestockDate: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  reason: string;
  initiatedBy: string;
  createdAt: string;
}

interface MovementFormData {
  quantity: number;
  date: string;
  reason: string;
}

// Kategori ve durum konfigürasyonları
const categoryConfig = {
  EQUIPMENT: { label: 'Ekipman', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Package },
  MATERIAL: { label: 'Malzeme', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: Warehouse },
  TOOL: { label: 'Alet', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: Tool },
  SAFETY: { label: 'Güvenlik', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: AlertTriangle },
  OFFICE: { label: 'Ofis', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', icon: FileText },
  OTHER: { label: 'Diğer', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', icon: Package },
};

const statusConfig = {
  AVAILABLE: { label: 'Mevcut', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  LOW_STOCK: { label: 'Az Stok', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  OUT_OF_STOCK: { label: 'Stokta Yok', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  DISCONTINUED: { label: 'Üretimi Durdu', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
  ON_HOLD: { label: 'Beklemede', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
};

// Yardımcı fonksiyonlar
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    // Sunucu ve istemci arasında tutarlılık için sabit bir format kullanın
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC' // Zaman dilimi tutarlılığı için UTC kullanın
    }).format(date);
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString; // Hata durumunda orijinal string'i döndür
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const getStockStatusColor = (item: InventoryItem) => {
  if (item.quantity <= 0) return 'text-red-600 dark:text-red-400';
  if (item.quantity < item.minStockLevel) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
};

export default function InventoryPage() {
  // State tanımlamaları
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [movementFormData, setMovementFormData] = useState<MovementFormData>({
    quantity: 1,
    date: new Date().toISOString().substring(0, 10), // YYYY-MM-DD formatında sabit bir string
    reason: '',
  });

  // API'den ürünleri yükleme
  useEffect(() => {
    const loadInventoryData = async () => {
      // Gerçek API çağrısı burada yapılacak
      // Şimdilik mock veriler kullanıyoruz
      
      const mockInventoryItems: InventoryItem[] = [
        {
          id: '1',
          code: 'EQ-001',
          name: 'Jeneratör 10kW',
          description: 'Dizel jeneratör, 10kW güç kapasitesi, taşınabilir',
          category: 'EQUIPMENT',
          status: 'AVAILABLE',
          quantity: 5,
          unit: 'adet',
          minStockLevel: 2,
          maxStockLevel: 10,
          location: 'Ana Depo',
          supplier: 'Enerji A.Ş.',
          price: 15000,
          lastRestockDate: '2023-06-10',
          createdAt: '2023-01-15',
          updatedAt: '2023-06-10',
        },
        {
          id: '2',
          code: 'EQ-002',
          name: 'Elektrik Direği 12m',
          description: 'Beton elektrik direği, 12 metre',
          category: 'EQUIPMENT',
          status: 'LOW_STOCK',
          quantity: 3,
          unit: 'adet',
          minStockLevel: 5,
          maxStockLevel: 20,
          location: 'Saha Depo 1',
          supplier: 'Yapı Malzemeleri Ltd.',
          price: 4500,
          lastRestockDate: '2023-05-22',
          createdAt: '2023-01-20',
          updatedAt: '2023-05-22',
        },
        {
          id: '3',
          code: 'MT-001',
          name: 'Elektrik Kablosu 5x2.5mm',
          description: '5x2.5mm kablo, yer altı kullanımı için',
          category: 'MATERIAL',
          status: 'AVAILABLE',
          quantity: 2500,
          unit: 'metre',
          minStockLevel: 1000,
          maxStockLevel: 5000,
          location: 'Ana Depo',
          supplier: 'Kablo Tic. A.Ş.',
          price: 45,
          lastRestockDate: '2023-07-05',
          createdAt: '2023-02-10',
          updatedAt: '2023-07-05',
        }
      ];

      const mockMovements: InventoryMovement[] = [
        {
          id: '1',
          itemId: '1',
          type: 'IN',
          quantity: 2,
          date: '2023-06-10',
          reason: 'Satın alma',
          initiatedBy: 'Ahmet Demir',
          createdAt: '2023-06-10T10:30:00',
        },
        {
          id: '2',
          itemId: '3',
          type: 'IN',
          quantity: 1000,
          date: '2023-07-05',
          reason: 'Tedarikçi teslimatı',
          initiatedBy: 'Mehmet Kaya',
          createdAt: '2023-07-05T14:15:00',
        }
      ];

      // Veri yükleme simülasyonu - hydration hatalarını önlemek için yavaş yükleme
      setTimeout(() => {
        setInventoryItems(mockInventoryItems);
        setFilteredItems(mockInventoryItems);
        setRecentMovements(mockMovements);
        setLoading(false);
      }, 500); // Daha hızlı yükleme için 500ms
    };
    
    loadInventoryData();
  }, []);

  // Filtreleme işlemi
  useEffect(() => {
    let result = [...inventoryItems];
    
    // Arama terimine göre filtreleme
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.code.toLowerCase().includes(searchLower) || 
        item.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Kategori filtreleme
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    // Durum filtreleme
    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Lokasyon filtreleme
    if (locationFilter) {
      result = result.filter(item => item.location === locationFilter);
    }
    
    setFilteredItems(result);
  }, [inventoryItems, searchTerm, categoryFilter, statusFilter, locationFilter]);

  // Yeni stok hareketi ekleme
  const handleAddMovement = () => {
    if (!selectedItem) return;
    
    const newQuantity = selectedItem.quantity + (movementType === 'IN' 
      ? movementFormData.quantity 
      : -movementFormData.quantity);
    
    // 0'dan küçük stok olamaz
    if (newQuantity < 0) {
      alert('Çıkış miktarı mevcut stoktan fazla olamaz!');
      return;
    }
    
    // Yeni hareket oluştur
    const newMovement: InventoryMovement = {
      id: `m-${Date.now()}`,
      itemId: selectedItem.id,
      type: movementType,
      quantity: movementFormData.quantity,
      date: movementFormData.date,
      reason: movementFormData.reason,
      initiatedBy: 'Aktif Kullanıcı', // Gerçek uygulamada oturum açan kullanıcı
      createdAt: new Date().toISOString(),
    };
    
    // Güncellenmiş ürün
    const updatedItem: InventoryItem = {
      ...selectedItem,
      quantity: newQuantity,
      status: getUpdatedStatus(newQuantity, selectedItem),
      lastRestockDate: movementType === 'IN' ? movementFormData.date : selectedItem.lastRestockDate,
      updatedAt: new Date().toISOString(),
    };
    
    // State'leri güncelle
    setRecentMovements(prev => [newMovement, ...prev]);
    setInventoryItems(prev => prev.map(item => 
      item.id === selectedItem.id ? updatedItem : item
    ));
    
    // Modalı kapat ve formu sıfırla
    setShowMovementModal(false);
    setMovementFormData({
      quantity: 1,
      date: new Date().toISOString().substring(0, 10),
      reason: '',
    });
  };

  // Stok miktarına göre durum belirleme
  const getUpdatedStatus = (quantity: number, item: InventoryItem): keyof ItemStatus => {
    if (quantity <= 0) return 'OUT_OF_STOCK';
    if (quantity < item.minStockLevel) return 'LOW_STOCK';
    return 'AVAILABLE';
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Ekleme Butonu */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Envanter Yönetimi</h1>
          <p className="text-muted-foreground">Stok takibi ve hareketleri</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
        </Button>
      </div>
      
      {/* Üst panel - İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Ürün</div>
              <div className="text-2xl font-bold">{inventoryItems.length}</div>
            </div>
            <span className="p-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
              <Package className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {categoryFilter ? `${categoryConfig[categoryFilter as keyof ItemCategory].label} kategorisinde` : 'Tüm kategorilerde'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Stok Durumu</div>
              <div className="text-2xl font-bold flex items-center">
                <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                {inventoryItems.filter(i => i.quantity >= i.minStockLevel).length}
                <span className="mx-1 text-gray-400">/</span>
                <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
                {inventoryItems.filter(i => i.quantity > 0 && i.quantity < i.minStockLevel).length}
                <span className="mx-1 text-gray-400">/</span>
                <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                {inventoryItems.filter(i => i.quantity <= 0).length}
              </div>
            </div>
            <span className="p-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Normal / Az Stok / Stokta Yok
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Son Hareketler</div>
              <div className="text-2xl font-bold flex items-center">
                <span className="text-green-600 dark:text-green-400 flex items-center mr-3">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {recentMovements.filter(m => m.type === 'IN').length}
                </span>
                <span className="text-red-600 dark:text-red-400 flex items-center">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  {recentMovements.filter(m => m.type === 'OUT').length}
                </span>
              </div>
            </div>
            <span className="p-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full">
              <Calendar className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Son 30 günde
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Depo Doluluk</div>
              <div className="text-2xl font-bold">
                {inventoryItems.length ? Math.round((inventoryItems.filter(i => i.quantity > 0).length / inventoryItems.length) * 100) : 0}%
              </div>
            </div>
            <span className="p-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
              <Warehouse className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {inventoryItems.filter(i => i.quantity > 0).length} stoklu ürün
          </div>
        </div>
      </div>
      
      {/* Filtreler ve Kontroller */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Ara: Ürün kodu veya adı"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {Object.entries(categoryConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">Tüm Lokasyonlar</option>
            {Array.from(new Set(inventoryItems.map(item => item.location))).map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setCategoryFilter('');
            setStatusFilter('');
            setLocationFilter('');
          }}>
            <Filter className="mr-2 h-4 w-4" /> Filtreleri Temizle
          </Button>
          
          <div className="flex rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              className="rounded-r-none"
              onClick={() => setViewMode('list')}
            >
              Liste
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              className="rounded-l-none"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </div>
        </div>
      </div>
      
      {/* Envanter Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-gray-500 dark:text-gray-400">Ürün bulunamadı</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ürün Kodu/Adı</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategori</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stok</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lokasyon</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Son Stok Girişi</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fiyat</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.code}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryConfig[item.category].color}`}>
                            {categoryConfig[item.category].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig[item.status].color}`}>
                            {statusConfig[item.status].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${getStockStatusColor(item)}`}>
                            {item.quantity} {item.unit}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min: {item.minStockLevel} / Max: {item.maxStockLevel}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(item.lastRestockDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setMovementType('IN');
                                setShowMovementModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Stok Girişi"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setMovementType('OUT');
                                setShowMovementModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Stok Çıkışı"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Düzenle"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Daha Fazla"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.code}</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</div>
                    </div>
                    
                    <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${statusConfig[item.status].color}`}>
                      {statusConfig[item.status].label}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Kategori</div>
                        <div className="text-sm font-medium">{categoryConfig[item.category].label}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Stok</div>
                        <div className={`text-sm font-medium ${getStockStatusColor(item)}`}>
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Lokasyon</div>
                        <div className="text-sm font-medium">{item.location}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Fiyat</div>
                        <div className="text-sm font-medium">{formatCurrency(item.price)}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Açıklama</div>
                    <div className="text-sm mb-4 line-clamp-2">{item.description || "Açıklama yok"}</div>
                    
                    <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Son Giriş: {formatDate(item.lastRestockDate)}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setMovementType('IN');
                            setShowMovementModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1"
                          title="Stok Girişi"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setMovementType('OUT');
                            setShowMovementModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title="Stok Çıkışı"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Son Stok Hareketleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-medium mb-4">Son Stok Hareketleri</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ürün</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tür</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Miktar</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sebep</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemi Yapan</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentMovements.map((movement) => {
                const relatedItem = inventoryItems.find(item => item.id === movement.itemId);
                return (
                  <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(movement.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {relatedItem ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{relatedItem.code}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{relatedItem.name}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Bilinmeyen Ürün</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movement.type === 'IN' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {movement.type === 'IN' ? 'Giriş' : 'Çıkış'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <span className={movement.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {movement.type === 'IN' ? '+' : '-'}{movement.quantity} {relatedItem?.unit || 'birim'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {movement.reason}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {movement.initiatedBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Stok Hareketi Modal */}
      {showMovementModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {movementType === 'IN' ? 'Stok Girişi' : 'Stok Çıkışı'}: {selectedItem.name}
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mevcut Stok
                </label>
                <div className="text-lg font-medium">
                  {selectedItem.quantity} {selectedItem.unit}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {movementType === 'IN' ? 'Giriş' : 'Çıkış'} Miktarı
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={movementFormData.quantity}
                  onChange={(e) => setMovementFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tarih
                </label>
                <Input
                  type="date"
                  value={movementFormData.date}
                  onChange={(e) => setMovementFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sebep
                </label>
                <Input
                  type="text"
                  placeholder={movementType === 'IN' ? "Örn: Satın alma, İade" : "Örn: Proje kullanımı, Transfer"}
                  value={movementFormData.reason}
                  onChange={(e) => setMovementFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMovementModal(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleAddMovement}
                disabled={movementFormData.quantity <= 0 || !movementFormData.reason}
                className={movementType === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {movementType === 'IN' ? 'Giriş Yap' : 'Çıkış Yap'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 