"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, CheckCircle, Clock, XCircle, 
  Calendar, User, Clipboard, Filter, Pencil, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

// Görev durumu için tiplemeler
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Arayüzler
interface Employee {
  id: string;
  name: string;
  surname: string;
  department: {
    id: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo: Employee;
  project?: Project;
  createdAt: string;
}

// Durum yapılandırmaları
const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
  'TODO': { 
    label: 'Yapılacak', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: Clipboard
  },
  'IN_PROGRESS': { 
    label: 'Devam Ediyor', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Clock
  },
  'COMPLETED': { 
    label: 'Tamamlandı', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckCircle
  },
  'CANCELLED': { 
    label: 'İptal', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: XCircle
  }
};

// Öncelik yapılandırmaları
const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  'LOW': { 
    label: 'Düşük', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' 
  },
  'MEDIUM': { 
    label: 'Orta', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
  },
  'HIGH': { 
    label: 'Yüksek', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' 
  },
  'URGENT': { 
    label: 'Acil', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
  }
};

export default function EmployeeTaskPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState({
    search: "",
    status: "",
    priority: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // API henüz hazır olmadığı için mock veriler kullanıyoruz
        // Gerçek uygulamada: const response = await fetch('/api/employee-tasks');
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Yükleme simülasyonu
        
        const mockTasks: Task[] = [
          {
            id: "1",
            title: "İzmir Trafo Bakım Raporu Yazılması",
            description: "İzmir bölgesindeki trafoların bakım sonuçlarının raporlanması",
            status: "TODO",
            priority: "HIGH",
            dueDate: "2023-11-05",
            assignedTo: {
              id: "1",
              name: "Ahmet",
              surname: "Yılmaz",
              department: { id: "1", name: "Teknik" }
            },
            project: { id: "1", name: "İzmir Trafo Bakım Projesi" },
            createdAt: "2023-10-20"
          },
          {
            id: "2",
            title: "Müşteri Toplantısı Hazırlığı",
            description: "ABC Elektrik ile yapılacak toplantı için sunum hazırlanması",
            status: "IN_PROGRESS",
            priority: "URGENT",
            dueDate: "2023-10-30",
            assignedTo: {
              id: "2",
              name: "Ayşe",
              surname: "Kaya",
              department: { id: "2", name: "Satış" }
            },
            project: { id: "2", name: "Müşteri İlişkileri Yönetimi" },
            createdAt: "2023-10-15"
          },
          {
            id: "3",
            title: "Yeni Personel Eğitimi",
            description: "Yeni işe alınan teknisyenler için eğitim programının hazırlanması",
            status: "COMPLETED",
            priority: "MEDIUM",
            dueDate: "2023-10-10",
            assignedTo: {
              id: "3",
              name: "Mehmet",
              surname: "Demir",
              department: { id: "3", name: "İnsan Kaynakları" }
            },
            createdAt: "2023-09-25"
          },
          {
            id: "4",
            title: "Ekipman Sipariş Takibi",
            description: "Yeni ekipman siparişlerinin takibi ve teslim alınması",
            status: "IN_PROGRESS",
            priority: "LOW",
            dueDate: "2023-11-15",
            assignedTo: {
              id: "4",
              name: "Zeynep",
              surname: "Aydın",
              department: { id: "4", name: "Satın Alma" }
            },
            project: { id: "3", name: "Ekipman Yenileme Projesi" },
            createdAt: "2023-10-05"
          },
          {
            id: "5",
            title: "Aylık Rapor Hazırlanması",
            description: "Ekim ayı performans raporunun hazırlanması",
            status: "CANCELLED",
            priority: "MEDIUM",
            dueDate: "2023-10-31",
            assignedTo: {
              id: "5",
              name: "Ali",
              surname: "Yıldız",
              department: { id: "5", name: "Yönetim" }
            },
            createdAt: "2023-10-01"
          }
        ];
        
        setTasks(mockTasks);
        setFilteredTasks(mockTasks);
      } catch (err) {
        console.error("Görevler yüklenirken hata oluştu:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtreleme işlemi
  useEffect(() => {
    let result = [...tasks];
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchLower) || 
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        `${task.assignedTo.name} ${task.assignedTo.surname}`.toLowerCase().includes(searchLower) ||
        (task.project && task.project.name.toLowerCase().includes(searchLower))
      );
    }
    
    if (filter.status) {
      result = result.filter(task => task.status === filter.status);
    }
    
    if (filter.priority) {
      result = result.filter(task => task.priority === filter.priority);
    }
    
    setFilteredTasks(result);
  }, [filter, tasks]);
  
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Görevlerim</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Size atanan görevleri yönetin
        </p>
      </div>
      
      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Görev ara..."
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="pl-9"
          />
        </div>
        
        <div>
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            value={filter.priority}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Tüm Öncelikler</option>
            {Object.entries(priorityConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setFilter({ search: "", status: "", priority: "" })}
          >
            Filtreleri Temizle
          </Button>
        </div>
      </div>
      
      {/* Görev Listesi */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-gray-500 dark:text-gray-400">Görev bulunamadı</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <h3 className="text-lg font-medium">{task.title}</h3>
                      <div className={`text-xs px-2 py-0.5 rounded-full flex items-center ${statusConfig[task.status].color}`}>
                        <span className="mr-1">
                          {React.createElement(statusConfig[task.status].icon, { size: 12 })}
                        </span>
                        {statusConfig[task.status].label}
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig[task.priority].color}`}>
                        {priorityConfig[task.priority].label}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {task.description || "Açıklama yok"}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{task.assignedTo.name} {task.assignedTo.surname}</span>
                      </div>
                      
                      {task.project && (
                        <div className="flex items-center">
                          <Clipboard className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{task.project.name}</span>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Bitiş: {formatDate(task.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col justify-end gap-2 mt-3 md:mt-0">
                    <Button variant="outline" size="sm">
                      <Pencil className="h-3 w-3 mr-2" />
                      Düzenle
                    </Button>
                    
                    {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                      <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Tamamla
                      </Button>
                    )}
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