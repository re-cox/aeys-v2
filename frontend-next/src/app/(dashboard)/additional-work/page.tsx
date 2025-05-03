"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, Calendar, CheckCircle, Clock, XCircle, 
  User, FileText, Pencil, Filter, PhoneCall
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from "react";
import { toast } from "sonner";

// Arayüzler
interface Employee {
  id: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  department?: {
    id: string;
    name: string;
  };
}

interface AdditionalWork {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: Employee;
  createdBy?: Employee;
  startDate: string;
  endDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  compensation?: number;
  createdAt: string;
}

// Durum yapılandırması
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  'To Do': { 
    label: 'Atandı', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: FileText
  },
  'In Progress': { 
    label: 'Devam Ediyor', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: Clock
  },
  'Done': { 
    label: 'Tamamlandı', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle
  },
  'Cancelled': { 
    label: 'İptal', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: XCircle
  }
};

// Öncelik yapılandırması
const priorityConfig: Record<string, { label: string; color: string }> = {
  'Low': { 
    label: 'Düşük', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
  },
  'Medium': { 
    label: 'Orta', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
  },
  'High': { 
    label: 'Yüksek', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' 
  }
};

export default function AdditionalWorkPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<AdditionalWork[]>([]);
  const [filter, setFilter] = useState({
    search: "",
    status: "",
    priority: ""
  });

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching additional works data...");
        
        // Local storage'dan token'ı al
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Oturum bilgisi bulunamadı.");
          toast.error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
          // Mevcut URL'i localStorage'a kaydet
          localStorage.setItem('redirectUrl', window.location.pathname);
          window.location.href = '/auth/login';
          return;
        }

        // Veritabanından verileri çekiyoruz
        const response = await fetch('/api/additional-works', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle authentication errors
        if (response.status === 401) {
          setError("Oturum sonlanmış olabilir. Lütfen yeniden giriş yapın.");
          console.error("Authentication error when fetching additional works");
          // Token'ı sil
          localStorage.removeItem('token');
          // Mevcut URL'i localStorage'a kaydet
          localStorage.setItem('redirectUrl', window.location.pathname);
          toast.error("Oturum sonlanmış olabilir. Lütfen yeniden giriş yapın.");
          window.location.href = '/auth/login';
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          throw new Error(errorData.message || "Ek işler yüklenirken bir hata oluştu");
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} additional works`);
        setAdditionalWorks(data);
        setFilteredWorks(data);
      } catch (err) {
        console.error("Ek işler yüklenirken hata oluştu:", err);
        setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
        toast.error("Ek işler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtreleme işlemi
  useEffect(() => {
    try {
      let result = [...additionalWorks];
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        result = result.filter(work => 
          work.title?.toLowerCase().includes(searchLower) || 
          (work.description && work.description.toLowerCase().includes(searchLower)) ||
          (work.assignedTo && `${work.assignedTo.name} ${work.assignedTo.surname}`.toLowerCase().includes(searchLower))
        );
      }
      
      if (filter.status) {
        result = result.filter(work => work.status === filter.status);
      }
      
      if (filter.priority) {
        result = result.filter(work => work.priority === filter.priority);
      }
      
      setFilteredWorks(result);
    } catch (err) {
      console.error("Filtreleme sırasında hata oluştu:", err);
      toast.error("Filtreleme işlemi sırasında bir hata oluştu.");
    }
  }, [filter, additionalWorks]);
  
  // Tarih formatlamak için yardımcı fonksiyon
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR');
    } catch (err) {
      console.error("Tarih formatlama hatası:", err);
      return dateStr;
    }
  };
  
  // Para birimi formatlamak için yardımcı fonksiyon
  const formatCurrency = (amount?: number) => {
    if (!amount && amount !== 0) return "-";
    
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0
      }).format(amount);
    } catch (err) {
      console.error("Para birimi formatlama hatası:", err);
      return `${amount} ₺`;
    }
  };

  // Durumu güncelleme fonksiyonu
  const updateWorkStatus = async (workId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      console.log(`Updating status of work ${workId} to ${newStatus}`);
      const response = await fetch(`/api/additional-works/${workId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          // We need to include required fields from the existing work
          title: additionalWorks.find(w => w.id === workId)?.title || "",
          priority: additionalWorks.find(w => w.id === workId)?.priority || "",
          startDate: additionalWorks.find(w => w.id === workId)?.startDate || new Date().toISOString()
        }),
      });
      
      // Handle authentication errors
      if (response.status === 401) {
        setError("Oturum sonlanmış olabilir. Lütfen yeniden giriş yapın.");
        console.error("Authentication error when updating work status");
        toast.error("Oturum sonlanmış olabilir. Lütfen yeniden giriş yapın.");
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Durum güncellenirken bir hata oluştu");
      }
      
      const updatedWork = await response.json();
      console.log("Work status updated successfully:", updatedWork);
      
      // Listeleri güncelle
      setAdditionalWorks(prev => 
        prev.map(work => work.id === workId ? updatedWork : work)
      );
      
      toast.success("Durum başarıyla güncellendi!");
    } catch (err) {
      console.error("Durum güncellenirken hata oluştu:", err);
      toast.error("Durum güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Hata durumunu göster
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <span className="text-2xl">⚠️</span> {error}
        </div>
        <Button onClick={() => window.location.reload()}>Yeniden Dene</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ek İşler</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Normal çalışma saatleri dışında yapılan ek görevleri yönetin
        </p>
      </div>
      
      {/* Üst Kontroller */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Ek iş ara..."
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select
            value={filter.priority}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tüm Öncelikler</option>
            {Object.entries(priorityConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <Button 
            variant="outline" 
            onClick={() => setFilter({ search: "", status: "", priority: "" })}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Temizle
          </Button>
          
          <Button 
            onClick={() => {
              try {
                window.location.href = '/additional-works/create';
              } catch (err) {
                console.error("Navigation error:", err);
                toast.error("Sayfa yönlendirmesi sırasında bir hata oluştu.");
              }
            }}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ekle
          </Button>
        </div>
      </div>
      
      {/* İş Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorks.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-gray-500 dark:text-gray-400">Ek iş bulunamadı</p>
            </div>
          ) : (
            filteredWorks.map(work => (
              <div key={work.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Sol taraf - İş detayları */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium">{work.title}</h3>
                      <div className={`text-xs px-2 py-0.5 rounded-full flex items-center ${statusConfig[work.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        <span className="mr-1">
                          {React.createElement(statusConfig[work.status]?.icon || FileText, { size: 12 })}
                        </span>
                        {statusConfig[work.status]?.label || work.status}
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[work.priority]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {priorityConfig[work.priority]?.label || work.priority}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {work.description || "Açıklama yok"}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {work.assignedTo ? `${work.assignedTo.name} ${work.assignedTo.surname}` : "Atanmamış"}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {formatDate(work.startDate)} - {formatDate(work.endDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {work.assignedTo?.department?.name || "Departman bilgisi yok"}
                        </span>
                      </div>
                      
                      {/* Teknisyen numarası alanı */}
                      <div className="flex items-center">
                        <PhoneCall className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Teknisyen No: {work.assignedTo?.phoneNumber || "Telefon bilgisi yok"}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Oluşturan: {work.createdBy ? `${work.createdBy.name} ${work.createdBy.surname}` : "Bilinmiyor"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sağ taraf - Detaylar ve işlemler */}
                  <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-4 flex flex-row md:flex-col justify-between items-end md:items-start gap-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Öngörülen Süre:</span>
                        <span className="font-medium">{work.estimatedHours || "-"} saat</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Gerçekleşen:</span>
                        <span className="font-medium">{work.actualHours || "-"} saat</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Ücret:</span>
                        <span className="font-medium">{formatCurrency(work.compensation)}</span>
                      </div>
                    </div>
                    
                    <div className="flex md:flex-col gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          try {
                            window.location.href = `/additional-works/${work.id}`;
                          } catch (err) {
                            console.error("Navigation error:", err);
                            toast.error("Sayfa yönlendirmesi sırasında bir hata oluştu.");
                          }
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Düzenle
                      </Button>
                      
                      {work.status !== 'Done' && work.status !== 'Cancelled' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateWorkStatus(work.id, 'Done')}
                        >
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Tamamla
                        </Button>
                      )}
                      
                      {work.status === 'To Do' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateWorkStatus(work.id, 'Cancelled')}
                        >
                          <XCircle className="h-3 w-3 mr-2" />
                          İptal Et
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 