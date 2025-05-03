"use client";

import { useState, useEffect } from "react";
import { Building2, Search, Plus, Pencil, Trash2, X, ChevronRight, ChevronDown, List, Rows3 } from "lucide-react";
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from "@/services/departmentService";
import { toast } from "sonner";
import { Department } from "@/types/department";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
        const data = await getAllDepartments();
        if (Array.isArray(data)) {
          const enrichedDepartments = data.map(dept => ({
            ...dept,
            // Üst departmanı isim olarak bul (eğer varsa)
            parent: data.find(p => p.managerId === dept.id) || null
          })) as DepartmentView[];
          setDepartments(enrichedDepartments);
        } else {
          handleLoadError("Departman verileri yüklenemedi. Geçersiz format.");
        }
      } catch (err) {
        handleLoadError("Departmanlar yüklenirken bir hata oluştu.", err);
      } finally {
        setLoading(false);
      }
    };
    loadDepartments();
  }, []); // Search bağımlılığını kaldırdım, liste görünümünde filtreleme yapılacak

  // Hiyerarşiyi yükle (department state'i değiştiğinde)
  useEffect(() => {
    if (departments.length > 0) {
      buildHierarchy();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  // Hiyerarşi oluşturma fonksiyonu
  const buildHierarchy = () => {
            const deptMap = new Map<string, DepartmentWithChildren>();
            const rootDepts: DepartmentWithChildren[] = [];
      departments.forEach(dept => {
              deptMap.set(dept.id, {
                ...dept,
                children: [],
              parent: dept.parent // Zaten yüklenmişti
              });
            });
      departments.forEach(dept => {
              const deptWithChildren = deptMap.get(dept.id);
              if (deptWithChildren) {
                if (dept.managerId && deptMap.has(dept.managerId)) {
                  const parent = deptMap.get(dept.managerId);
                  if (parent && parent.children) {
                    parent.children.push(deptWithChildren);
                  }
                } else {
                  rootDepts.push(deptWithChildren);
                }
              }
            });
      setHierarchyView(rootDepts);
  };

  // Yükleme hatası yönetimi
  const handleLoadError = (message: string, err?: unknown) => {
    console.error(message, err);
    setError(message);
    toast.error(message);
    setDepartments([]);
          setHierarchyView([]);
      };

  // Form değişikliklerini işle
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Select değişikliklerini işle
  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, managerId: value }));
  };

  // Departman ekleme/güncelleme sonrası listeyi yenile
  const refreshDepartments = async () => {
    try {
      const data = await getAllDepartments();
      if (Array.isArray(data)) {
        const enrichedDepartments = data.map(dept => ({
          ...dept,
          parent: data.find(p => p.managerId === dept.id) || null
        })) as DepartmentView[];
        setDepartments(enrichedDepartments);
      } else {
        toast.error("Departman listesi yenilenemedi.");
      }
    } catch (err) {
      toast.error("Departman listesi yenilenirken hata oluştu.");
    }
  };

  // Departman ekleme
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Butonun kendi loading state'i daha iyi olabilir
    try {
      const newDepartment = await createDepartment({
        name: formData.name,
        description: formData.description || undefined,
        managerId: formData.managerId === "null" ? undefined : formData.managerId || undefined,
      });
      toast.success(`"${newDepartment.name}" departmanı başarıyla eklendi`);
      resetForm();
      await refreshDepartments();
    } catch (err) { handleError(err, "eklenirken"); } 
    finally { setLoading(false); }
  };

  // Departman güncelleme
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description || undefined,
        managerId: formData.managerId === "null" ? undefined : formData.managerId || undefined,
      };
      const updated = await updateDepartment(editingDepartment.id, updateData);
      toast.success(`"${updated.name}" departmanı başarıyla güncellendi`);
      resetForm();
      await refreshDepartments();
    } catch (err) { handleError(err, "güncellenirken"); }
    finally { setLoading(false); }
  };

  // Departman silme
  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`"${name}" departmanını silmek istediğinizden emin misiniz?`)) return;
    setLoading(true);
    try {
      await deleteDepartment(id);
      toast.success(`"${name}" departmanı başarıyla silindi`);
      resetForm(); // Açık form varsa kapat
      await refreshDepartments();
    } catch (err) { handleError(err, "silinirken"); } 
    finally { setLoading(false); }
  };

  // Genel hata yönetimi
  const handleError = (err: unknown, action: string) => {
    console.error(`Departman ${action} hata:`, err);
    const message = err instanceof Error ? err.message : `Departman ${action} bir hata oluştu`;
    setError(message);
    toast.error(message);
  };

  // Formu sıfırla ve kapat
  const resetForm = () => {
      setShowAddForm(false);
      setEditingDepartment(null);
      setFormData({ name: "", description: "", managerId: "" });
  };

  // Düzenleme modunu aç
  const startEditing = (department: DepartmentView) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      managerId: department.managerId || "",
    });
    setShowAddForm(false); // Add formunu kapat
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Forma odaklan
  };

  // Genişletilmiş departmanları toggle
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(id)) newExpanded.delete(id); else newExpanded.add(id);
    setExpandedDepts(newExpanded);
  };

  // Filtrelenmiş departmanlar (Liste görünümü için)
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(search.toLowerCase())) ||
    (dept.parent?.name && dept.parent.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Hiyerarşi ağacını render et (Shadcn stilleri ile)
  const renderDepartmentTree = (dept: DepartmentWithChildren, level = 0) => {
    const isExpanded = expandedDepts.has(dept.id);
    const hasChildren = dept.children && dept.children.length > 0;

    return (
      <div key={dept.id}>
        <div 
          className={`flex items-center py-2 px-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 group ${level > 0 ? 'ml-6' : ''}`}
          style={{ borderLeft: level > 0 ? '1px solid var(--border)' : 'none'}}
        >
          <div className="flex items-center flex-1 min-w-0">
          {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
              onClick={() => toggleExpand(dept.id)}
                className="mr-1 h-7 w-7"
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </Button>
          ) : (
              <span className="inline-block w-7 h-7 mr-1"></span> // Boşluk için
          )}
          
            <Building2 size={16} className="mr-2 text-blue-500 flex-shrink-0" />
          
            <div className="flex-1 overflow-hidden">
              <p className="font-medium truncate" title={dept.name}>{dept.name}</p>
            {dept.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={dept.description}>{dept.description}</p>
            )}
            </div>
          </div>
          
          <Badge variant="secondary" className="ml-2 mr-2 flex-shrink-0">
             {dept._count?.employees || 0} Pers.
          </Badge>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(dept)}>
                    <Pencil size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Düzenle</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600" onClick={() => handleDeleteDepartment(dept.id, dept.name)}>
                    <Trash2 size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Sil</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {dept.children?.map(child => renderDepartmentTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Yeni Departman Ekleme Formu (Modal veya Açılır Alan)
  const renderAddEditForm = () => {
    const isEditing = !!editingDepartment;
    const title = isEditing ? "Departmanı Düzenle" : "Yeni Departman Ekle";

    return (
      <Card className="mb-6 border-blue-200">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={resetForm}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <form onSubmit={isEditing ? handleUpdateDepartment : handleAddDepartment}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Departman Adı *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="managerId">Üst Departman</Label>
              <Select value={formData.managerId} onValueChange={handleSelectChange}>
                <SelectTrigger id="managerId">
                  <SelectValue placeholder="Üst departman seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Ana departman seçeneği */}
                  <SelectItem value="null">- Üst Departman Yok -</SelectItem> 
                  {/* Diğer departmanları listele (kendisi ve altındakiler hariç) */}
                  {departments
                    .filter(dept => !isEditing || (dept.id !== editingDepartment?.id && !isDescendant(dept.id, editingDepartment?.id || '', hierarchyView)))
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>İptal</Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Kaydediliyor..." : (isEditing ? "Güncelle" : "Ekle")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  };

  // Alt departman kontrolü (düzenlemede döngü engellemek için)
  const isDescendant = (childId: string, parentId: string, hierarchy: DepartmentWithChildren[]): boolean => {
    for (const dept of hierarchy) {
      if (dept.id === parentId) {
        const checkChildren = (d: DepartmentWithChildren): boolean => {
          if (d.id === childId) return true;
          return d.children ? d.children.some(checkChildren) : false;
        };
        return dept.children ? dept.children.some(checkChildren) : false;
      }
      if (dept.children && isDescendant(childId, parentId, dept.children)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Sayfa Başlığı ve Aksiyonlar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Building2 className="mr-2 h-6 w-6"/>
            Departman Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Şirket departmanlarını yönetin ve hiyerarşiyi görüntüleyin.
        </p>
      </div>

        <div className="flex gap-2 items-center">
          {/* Görünüm Değiştirme Butonları */}
          <div className="flex rounded-md border bg-background p-0.5">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('list')} 
                    className="px-2.5 py-1 h-8 rounded-sm"
                  >
                     <List className="h-4 w-4"/>
                  </Button>
                 </TooltipTrigger>
                 <TooltipContent><p>Liste Görünümü</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
             <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'hierarchy' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('hierarchy')} 
                    className="px-2.5 py-1 h-8 rounded-sm"
                  >
                    <Rows3 className="h-4 w-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Hiyerarşi Görünümü</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button
              onClick={() => {
              resetForm(); // Formu sıfırla
                setShowAddForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' }); // Forma odaklan
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Departman
          </Button>
        </div>
        </div>

      {/* Hata Mesajı Alanı */}
      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setError(null)}>
            <X size={14}/>
          </Button>
        </Alert>
      )}

      {/* Ekleme/Düzenleme Formu */} 
        {(showAddForm || editingDepartment) && (
        renderAddEditForm()
      )}

      {/* Arama ve İçerik Alanı */} 
      <Card>
          <CardHeader>
             {/* Arama çubuğunu CardHeader içine alabiliriz veya ayrı tutabiliriz */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
               <CardTitle className="text-lg">
                {viewMode === 'list' ? 'Departman Listesi' : 'Departman Hiyerarşisi'}
               </CardTitle>
               {viewMode === 'list' && ( // Sadece liste görünümünde arama göster
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                        type="text"
                        placeholder="Listede ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
          </div>
        )}
            </div>
          </CardHeader>
          <CardContent>
        {loading && !error ? (
          <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
              ) : viewMode === "list" ? (
              <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Departman Adı</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Üst Departman</TableHead>
                        <TableHead className="text-center">Pers. Say.</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDepartments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            {search ? `"${search}" için sonuç bulunamadı.` : "Departman bulunamadı."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDepartments.map((dept) => (
                          <TableRow key={dept.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{dept.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={dept.description || ''}>{dept.description || "-"}</TableCell>
                            <TableCell>{dept.parent?.name || "-"}</TableCell>
                            <TableCell className="text-center">{dept._count?.employees || 0}</TableCell>
                            <TableCell className="text-right">
                               <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(dept)}>
                                        <Pencil size={16} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Düzenle</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                               <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600" onClick={() => handleDeleteDepartment(dept.id, dept.name)}>
                                        <Trash2 size={16} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Sil</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
              </div>
              ) : ( // Hierarchy View
                <div>
                  {hierarchyView.length === 0 && !loading ? (
                    <div className="text-center py-10 text-muted-foreground">
                      Departman hiyerarşisi bulunamadı veya oluşturulamadı.
                  </div>
                ) : (
                    <div className="space-y-1 -mt-2">
                      {hierarchyView.map(dept => renderDepartmentTree(dept))}
                    </div>
                )}
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
} 