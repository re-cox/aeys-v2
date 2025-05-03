"use client";

import { useState, useEffect } from "react";
import { Building2, Search, Plus, Pencil, Trash2, X, ChevronRight, ChevronDown } from "lucide-react";
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from "@/services/departmentService";
import { toast } from "sonner";
import { Department } from "@/types/department";

// DepartmentWithChildren tipini Department'a uygun olarak genişlet
interface DepartmentWithChildren extends Department {
  children?: DepartmentWithChildren[];
  parent?: Department | null;
}

// DepartmentView ekrana göstermek için zenginleştirilmiş tip
interface DepartmentView extends Department {
  parent?: Department | null;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentView[]>([]);
  const [hierarchyView, setHierarchyView] = useState<DepartmentWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentView | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "", // parentId yerine managerId kullanılacak
  });
  const [viewMode, setViewMode] = useState<"list" | "hierarchy">("list");
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  // Departmanları yükle
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API çağrısını yapmadan önce bir gecikme ekleyelim (API henüz çalışmıyor olabilir)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Yeni department servisi ile çağrı yapalım
        const data = await getAllDepartments();
        
        console.log("Gelen departman verisi:", JSON.stringify(data));
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`${data.length} departman başarıyla yüklendi`);
          
          // Departmanları doğrudan API'den gelen verilerle kullan
          const enrichedDepartments = data.map(dept => ({
            ...dept,
            parent: null // Üst departman bilgisi de olmadığından null olarak ayarla
          })) as DepartmentView[];
          
          setDepartments(enrichedDepartments);
        } else {
          console.error("API'den departman verisi alınamadı veya boş dizi döndü");
          setError("Departmanlar yüklenemedi. Lütfen daha sonra tekrar deneyin.");
          setDepartments([]);
          toast.error("Departman verileri yüklenemedi. Lütfen sayfayı yenileyin.");
        }
      } catch (err) {
        console.error("Departman yükleme hatası:", err);
        setError("Departmanlar yüklenirken bir hata oluştu. API sunucusunun çalıştığından emin olun.");
        toast.error("Departman verilerine erişilemiyor. Sunucu bağlantısını kontrol edin.");
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [search]);

  // Hiyerarşiyi yükle
  useEffect(() => {
    if (viewMode === "hierarchy") {
      const loadHierarchy = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Şimdilik gösterebilecek bir hiyerarşi verisi olmadığından liste görünümünü kullanacağız
          // Gelecekte bir hierarchyService eklenebilir
          const data = await getAllDepartments();
          
          if (Array.isArray(data) && data.length > 0) {
            // Basit bir hiyerarşi oluştur
            const deptMap = new Map<string, DepartmentWithChildren>();
            const rootDepts: DepartmentWithChildren[] = [];
            
            // Önce tüm departmanları bir Map'e ekle
            data.forEach(dept => {
              deptMap.set(dept.id, {
                ...dept,
                children: [],
                parent: null // Üst departman bilgisi yok
              });
            });
            
            // Şimdi parent-child ilişkilerini kur (manager ilişkisine göre)
            data.forEach(dept => {
              const deptWithChildren = deptMap.get(dept.id);
              if (deptWithChildren) {
                if (dept.managerId && deptMap.has(dept.managerId)) {
                  // Bu departmanın bir üst yöneticisi var, bunu parent olarak değerlendirelim
                  const parent = deptMap.get(dept.managerId);
                  if (parent && parent.children) {
                    parent.children.push(deptWithChildren);
                    // Parent referansını da güncelleyelim
                    deptWithChildren.parent = parent;
                  }
                } else {
                  // Bu root departman
                  rootDepts.push(deptWithChildren);
                }
              }
            });
            
            setHierarchyView(rootDepts);
          } else {
            setHierarchyView([]);
            setError("Departman hiyerarşisi yüklenemedi. Veri yok.");
            toast.error("Departman hiyerarşisi yüklenemedi.");
          }
        } catch (err) {
          console.error("Hiyerarşi yükleme hatası:", err);
          setError("Departman hiyerarşisi yüklenirken bir hata oluştu.");
          toast.error("Departman hiyerarşisi yüklenemedi. Sunucu bağlantısını kontrol edin.");
          setHierarchyView([]);
        } finally {
          setLoading(false);
        }
      };

      loadHierarchy();
    }
  }, [viewMode]);

  // Form değişikliklerini işle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Departman ekleme
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Yeni departmentService createDepartment fonksiyonunu kullan
      const newDepartment = await createDepartment({
        name: formData.name,
        description: formData.description || undefined,
        managerId: formData.managerId || undefined,
      });
      
      // Başarı mesajı göster
      toast.success(`"${newDepartment.name}" departmanı başarıyla eklendi`);
      
      // Formu sıfırla ve gizle
      setFormData({ name: "", description: "", managerId: "" });
      setShowAddForm(false);
      
      // Departmanları yeniden yükle
      const updatedDepartments = await getAllDepartments();
      if (Array.isArray(updatedDepartments)) {
        const enrichedDepartments = updatedDepartments.map(dept => ({
          ...dept,
          parent: null
        })) as DepartmentView[];
        
        setDepartments(enrichedDepartments);
      }
    } catch (err) {
      console.error("Departman ekleme hatası:", err);
      setError("Departman eklenirken bir hata oluştu");
      toast.error("Departman eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Departman güncelleme
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    try {
      setLoading(true);
      setError(null);
      
      // Sadece API'nin kabul ettiği alanları içeren bir obje oluştur
      const updatedDepartment = await updateDepartment(editingDepartment.id, {
        name: formData.name || editingDepartment.name,
        description: formData.description || editingDepartment.description,
        managerId: formData.managerId || editingDepartment.managerId,
      });
      
      // Başarı mesajı göster
      toast.success(`"${updatedDepartment.name}" departmanı başarıyla güncellendi`);
      
      // Formu sıfırla ve düzenleme modunu kapat
      setFormData({ name: "", description: "", managerId: "" });
      setEditingDepartment(null);
      
      // Departmanları yeniden yükle
      const updatedDepartments = await getAllDepartments();
      if (Array.isArray(updatedDepartments)) {
        const enrichedDepartments = updatedDepartments.map(dept => ({
          ...dept,
          parent: null
        })) as DepartmentView[];
        
        setDepartments(enrichedDepartments);
      }
    } catch (err) {
      console.error("Departman güncelleme hatası:", err);
      setError(`Departman güncellenirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
      toast.error("Departman güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Departman silme
  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm("Bu departmanı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Departman silme işlemi
      await deleteDepartment(id);
      
      // Başarı mesajı göster
      toast.success("Departman başarıyla silindi");
      
      // Departmanları yeniden yükle
      const updatedDepartments = await getAllDepartments();
      if (Array.isArray(updatedDepartments)) {
        const enrichedDepartments = updatedDepartments.map(dept => ({
          ...dept,
          parent: null
        })) as DepartmentView[];
        
        setDepartments(enrichedDepartments);
      }
    } catch (err) {
      console.error("Departman silme hatası:", err);
      
      // Hata mesajı göster
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(`Departman silinirken bir hata oluştu: ${errorMessage}`);
      
      // Özel toast mesajı
      if (errorMessage.includes("bağlı çalışanları var")) {
        toast.error("Bu departman silinemez çünkü bağlı çalışanları var. Önce çalışanları başka departmanlara taşıyın.");
      } else {
        toast.error("Departman silinemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme modunu başlat
  const startEditing = (department: Department) => {
    setEditingDepartment(department as DepartmentView);
    setFormData({
      name: department.name,
      description: department.description || "",
      managerId: department.managerId || "",
    });
  };

  // Hiyerarşik görünümde ağaç bölümünü aç/kapat
  const toggleExpand = (id: string) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Hiyerarşik görünümde departman ağacını işle
  const renderDepartmentTree = (dept: DepartmentWithChildren, level = 0) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expandedDepts.has(dept.id);
    
    return (
      <div key={dept.id} className="mb-1">
        <div 
          className={`flex items-center ${level > 0 ? 'ml-' + (level * 4) : ''}`}
        >
          {hasChildren ? (
            <button 
              onClick={() => toggleExpand(dept.id)} 
              className="p-1 mr-1 text-gray-500 hover:text-blue-500"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="ml-5"></span>
          )}
          
          <div className="flex items-center justify-between w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center">
              <Building2 className="mr-2 h-4 w-4 text-blue-500" />
              <span>{dept.name}</span>
              {dept._count && typeof dept._count.employees === 'number' && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  ({dept._count.employees} personel)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => startEditing(dept)}
                className="p-1 text-gray-500 hover:text-blue-500"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteDepartment(dept.id)}
                className="p-1 text-gray-500 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {dept.children!.map(child => renderDepartmentTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Departman sayısını doğru formatta göster
  const formatEmployeeCount = (count?: number) => {
    if (count === undefined) return "";
    return `(${count} personel)`;
  };

  // Arama sorgusuyla filtreleme
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Departman Yönetimi
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "hierarchy" : "list")}
            className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100"
          >
            {viewMode === "list" ? "Hiyerarşik Görünüm" : "Liste Görünümü"}
          </button>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingDepartment(null);
              setFormData({ name: "", description: "", managerId: "" });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="h-5 w-5 mr-1" />
            Departman Ekle
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Departman ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-md"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>
      </div>

      {/* Form gösterimi */}
      {(showAddForm || editingDepartment) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">
              {editingDepartment ? "Departman Düzenle" : "Yeni Departman Ekle"}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingDepartment(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={editingDepartment ? handleUpdateDepartment : handleAddDepartment}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departman Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Üst Departman
                </label>
                <select
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md"
                >
                  <option value="">Yok (Ana Departman)</option>
                  {departments
                    .filter(d => !editingDepartment || d.id !== editingDepartment.id)
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  disabled={loading}
                >
                  {loading ? "İşleniyor..." : editingDepartment ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Hata mesajı */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Departman listesi veya hiyerarşisi */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {filteredDepartments.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDepartments.map((dept) => (
                <div key={dept.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <h3 className="font-medium">{dept.name}</h3>
                      {dept.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {dept.description}
                        </p>
                      )}
                      {dept._count && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                          {formatEmployeeCount(dept._count.employees)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(dept)}
                      className="p-1 text-gray-500 hover:text-blue-500"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="p-1 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {search ? "Arama kriterlerine uyan departman bulunamadı." : "Henüz departman bulunmuyor."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {hierarchyView.length > 0 ? (
            <div className="space-y-2">
              {hierarchyView.map(dept => renderDepartmentTree(dept))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz departman ağacı oluşturulmamış veya yüklenemedi.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 