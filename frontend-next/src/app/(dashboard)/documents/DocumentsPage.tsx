'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  File, FolderOpen, Folder, 
  Upload, Plus, Search, Filter, 
  MoreVertical, Download, Eye, Trash,
  Home, ChevronRight, Grid, List 
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Document } from '@/types/document';
import { Folder as FolderType, FolderContentsResponse } from '@/types/folder';
import { getFolderContents, getRootContents, deleteFolder } from '@/services/folderService';
import { deleteDocument, downloadDocument } from '@/services/documentService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import CreateFolderDialog from './components/CreateFolderDialog';
import UploadFileDialog from './components/UploadFileDialog';
import DocumentGrid from './components/DocumentGrid';
import DocumentList from './components/DocumentList';
import { DocumentViewMode } from '@/types/document';

interface FolderPath {
  id: string | null;
  name: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  // State
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderPath[]>([{ id: null, name: 'Ana Dizin' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<DocumentViewMode>('grid');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  
  // Klasör içeriğini yükle
  const loadFolderContents = useCallback(async (folderId: string | null, addToPath: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[Documents Page] Klasör içeriği yükleniyor, folderId: ${folderId || 'root'}`);
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Yetkilendirme hatası: Token bulunamadı. Lütfen tekrar giriş yapın.');
        toast.error('Oturum hatası: Lütfen tekrar giriş yapın.');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }
      
      let result: FolderContentsResponse;
      if (folderId === null) {
        result = await getRootContents();
        
        // Ana dizine gidiyoruz, path'i sıfırla
        if (addToPath) {
          setFolderPath([{ id: null, name: 'Ana Dizin' }]);
        }
      } else {
        result = await getFolderContents(folderId);
        
        // Eğer bir klasöre giriyorsak ve path'e eklemek istiyorsak
        if (addToPath) {
          // Not: API'den klasörün kendisi dönmüyor, bu yüzden folderPath için folderId'yi kullanıyoruz
          // Gerçek klasör ismini öğrenmek için ayrı bir istek gerekebilir veya isimlendirme için folderId kullanılabilir
          setFolderPath(prev => [...prev, { id: folderId, name: `Klasör ${folderId.substring(0, 4)}...` }]);
        }
      }
      
      setFolders(result.folders || []);
      setDocuments(result.documents || []);
      setCurrentFolderId(folderId);
      
      console.log(`[Documents Page] Klasör içeriği yüklendi. ${result.folders?.length || 0} klasör, ${result.documents?.length || 0} doküman.`);
    } catch (err: any) {
      console.error('[Documents Page] Klasör içeriği yüklenirken hata:', err);
      
      let errorMessage = 'Klasör içeriği yüklenirken bir hata oluştu.';
      
      if (err.response) {
        const status = err.response.status;
        
        // Token hatalarını kontrol et
        if (status === 401 || status === 403) {
          errorMessage = 'Oturum hatası: Lütfen tekrar giriş yapın.';
          localStorage.removeItem('token');
          toast.error(errorMessage);
          setTimeout(() => router.push('/login'), 1500);
        } else {
          errorMessage = err.response.data?.error || 'Beklenmeyen bir hata oluştu.';
          toast.error(errorMessage);
        }
      } else if (err.message) {
        errorMessage = err.message;
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
      setFolders([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  // İlk yükleme
  useEffect(() => {
    if (!isLoading && user) {
      loadFolderContents(null);
    }
  }, [loadFolderContents, user, isLoading]);
  
  // Döküman silme işlemi
  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success('Doküman başarıyla silindi');
      // Mevcut klasörü yenile
      loadFolderContents(currentFolderId, false);
    } catch (error) {
      console.error('Doküman silinirken hata oluştu:', error);
      toast.error('Doküman silinemedi');
    }
  };
  
  // Döküman indirme işlemi
  const handleDownloadDocument = async (id: string, name: string) => {
    try {
      toast.info('Dosya indiriliyor...');
      await downloadDocument(id, name);
      toast.success('Dosya başarıyla indirildi');
    } catch (error) {
      console.error('Dosya indirilirken hata oluştu:', error);
      toast.error('Dosya indirilemedi');
    }
  };
  
  // Döküman görüntüleme işlemi
  const handleViewDocument = (document: Document) => {
    // Dosya URL kontrolü
    if (!document.fileUrl) {
      toast.error('Dosya URL bilgisi bulunamadı');
      return;
    }
    
    // Dosya tipine göre kontrol
    const isPDF = document.type === 'pdf' || 
                  (document.mimeType && document.mimeType.includes('pdf'));
    
    const isImage = document.type === 'image' || 
                    (document.mimeType && [
                      'image/jpeg', 
                      'image/png', 
                      'image/gif', 
                      'image/jpg', 
                      'image/webp'
                    ].some(type => document.mimeType?.includes(type)));
    
    if (!isPDF && !isImage) {
      toast.error('Bu dosya türü tarayıcıda görüntülenemez');
      return;
    }
    
    // Dosya URL'si işleme
    try {
      let fileUrl = document.fileUrl;
      
      // Eğer URL göreceli ise (/ ile başlıyorsa), backend URL'sini başına ekle
      if (fileUrl.startsWith('/')) {
        // Backend URL'sini al (önceki değişikliklerde API_BASE_URL 'http://localhost:5001' olarak ayarlandı)
        const backendUrl = 'http://localhost:5001'; // Bu kısım API_BASE_URL ile aynı olmalı
        fileUrl = `${backendUrl}${fileUrl}`;
      }
      
      console.log('Dosya URL\'si:', fileUrl);
      
      // Dosyayı yeni sekmede aç
      window.open(fileUrl, '_blank');
      toast.success('Dosya yeni sekmede açıldı');
    } catch (error) {
      console.error('Dosya açılırken hata:', error);
      toast.error('Dosya açılamadı');
    }
  };
  
  // Klasöre git
  const handleFolderClick = (folder: FolderType) => {
    loadFolderContents(folder.id);
  };
  
  // Breadcrumb'dan klasöre git
  const handleBreadcrumbClick = (folderId: string | null, index: number) => {
    // Tıklanan klasörden sonraki tüm klasörleri path'ten kaldır
    setFolderPath(prev => prev.slice(0, index + 1));
    loadFolderContents(folderId, false);
  };
  
  // Dosya yükleme başarılı
  const handleUploadSuccess = () => {
    loadFolderContents(currentFolderId, false);
    setIsUploadDialogOpen(false);
  };
  
  // Klasör oluşturma başarılı
  const handleCreateFolderSuccess = () => {
    loadFolderContents(currentFolderId, false);
    setIsCreateFolderDialogOpen(false);
  };
  
  // Arama ve filtreleme sonuçları
  const filteredDocuments = documents.filter(document => {
    let matchesSearch = true;
    let matchesType = true;
    let matchesCategory = true;
    
    if (searchQuery) {
      matchesSearch = 
        document.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (document.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    if (selectedType && selectedType !== 'all') {
      matchesType = document.type === selectedType;
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      matchesCategory = document.category === selectedCategory;
    }
    
    return matchesSearch && matchesType && matchesCategory;
  });
  
  // Klasör silme işlemi
  const handleDeleteFolder = async (folderId: string) => {
    try {
      setFolderToDelete(folderId);
      setIsDeleteFolderDialogOpen(true);
    } catch (error) {
      console.error('Klasör silme işlemi başlatılırken hata oluştu:', error);
      toast.error('Klasör silme işlemi başlatılamadı');
    }
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    try {
      toast.info('Klasör siliniyor...');
      await deleteFolder(folderToDelete);
      toast.success('Klasör başarıyla silindi');
      
      // Mevcut klasörü yenile
      loadFolderContents(currentFolderId, false);
    } catch (error) {
      console.error('Klasör silinirken hata oluştu:', error);
      toast.error('Klasör silinemedi. Klasörün boş olduğundan emin olun.');
    } finally {
      setFolderToDelete(null);
      setIsDeleteFolderDialogOpen(false);
    }
  };
  
  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Evraklar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Hata durumu
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600">Hata</CardTitle>
            <CardDescription>
              Evrak yönetim sistemine erişilirken bir hata oluştu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => loadFolderContents(currentFolderId, false)}>Yeniden Dene</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Boş içerik durumu (klasör ve döküman yoksa)
  if (folders.length === 0 && documents.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Boş Klasör</CardTitle>
            <CardDescription>
              Bu klasörde herhangi bir içerik bulunmuyor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Henüz bir klasör veya doküman eklenmemiş. Yeni klasör oluşturabilir veya dosya yükleyebilirsiniz.
            </p>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button 
              onClick={() => setIsCreateFolderDialogOpen(true)}
              variant="outline"
            >
              <Folder className="h-4 w-4 mr-2" />
              Klasör Oluştur
            </Button>
            <Button 
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Dosya Yükle
            </Button>
          </CardFooter>
        </Card>
        
        {/* Dialog bileşenleri */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <UploadFileDialog 
            folderId={currentFolderId}
            onSuccess={handleUploadSuccess}
            onCancel={() => setIsUploadDialogOpen(false)}
            open={isUploadDialogOpen}
          />
        </Dialog>
        
        <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
          <CreateFolderDialog
            parentId={currentFolderId}
            onSuccess={handleCreateFolderSuccess}
            onCancel={() => setIsCreateFolderDialogOpen(false)}
            open={isCreateFolderDialogOpen}
          />
        </Dialog>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto space-y-4">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          {folderPath.map((folder, index) => (
            <BreadcrumbItem key={folder.id || 'root'}>
              {index < folderPath.length - 1 ? (
                <>
                  <BreadcrumbLink 
                    onClick={() => handleBreadcrumbClick(folder.id, index)}
                    className="cursor-pointer hover:text-primary"
                  >
                    {index === 0 ? (
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span>{folder.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Folder className="h-4 w-4" />
                        <span>{folder.name}</span>
                      </div>
                    )}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                </>
              ) : (
                <BreadcrumbLink className="font-medium text-foreground">
                  {index === 0 ? (
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>{folder.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Folder className="h-4 w-4" />
                      <span>{folder.name}</span>
                    </div>
                  )}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Kontrol Paneli */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Evrak ara..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Türler</SelectItem>
              <SelectItem value="file">Dosya</SelectItem>
              <SelectItem value="text">Metin</SelectItem>
              <SelectItem value="image">Görsel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="spreadsheet">Tablo</SelectItem>
              <SelectItem value="presentation">Sunum</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              <SelectItem value="contract">Sözleşme</SelectItem>
              <SelectItem value="invoice">Fatura</SelectItem>
              <SelectItem value="report">Rapor</SelectItem>
              <SelectItem value="certificate">Sertifika</SelectItem>
              <SelectItem value="other">Diğer</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="icon" 
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Folder className="mr-2 h-4 w-4" />
                Yeni Klasör
              </Button>
            </DialogTrigger>
            <CreateFolderDialog 
              parentId={currentFolderId} 
              onSuccess={handleCreateFolderSuccess} 
              onCancel={() => setIsCreateFolderDialogOpen(false)}
              open={isCreateFolderDialogOpen}
            />
          </Dialog>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Dosya Yükle
              </Button>
            </DialogTrigger>
            <UploadFileDialog 
              folderId={currentFolderId} 
              onSuccess={handleUploadSuccess} 
              onCancel={() => setIsUploadDialogOpen(false)}
              open={isUploadDialogOpen}
            />
          </Dialog>
        </div>
      </div>
      
      {/* Klasörler */}
      {folders.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Klasörler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <Card 
                key={folder.id} 
                className="relative cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <CardContent 
                  className="p-4 text-center flex flex-col items-center"
                  onClick={() => handleFolderClick(folder)}
                >
                  <Folder className="h-12 w-12 text-yellow-500 mb-2" />
                  <h3 className="font-medium truncate max-w-full">{folder.name}</h3>
                  <div className="text-xs text-muted-foreground mt-1">
                    {folder._count?.documents || 0} dosya
                  </div>
                </CardContent>
                
                {/* Klasör İşlem Menüsü */}
                <div className="absolute top-1 right-1 z-10" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Dokümanlar */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">
          Dokümanlar
          {documents.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredDocuments.length} / {documents.length})
            </span>
          )}
        </h2>
        
        {documents.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <File className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-2">Bu klasörde henüz doküman bulunmuyor.</p>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Dosya Yükle
              </Button>
            </CardContent>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Search className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aramanıza uygun doküman bulunamadı.</p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <DocumentGrid 
            documents={filteredDocuments} 
            onDelete={handleDeleteDocument} 
            onDownload={handleDownloadDocument}
            onView={handleViewDocument}
          />
        ) : (
          <DocumentList 
            documents={filteredDocuments} 
            onDelete={handleDeleteDocument} 
            onDownload={handleDownloadDocument}
            onView={handleViewDocument}
          />
        )}
      </div>
      
      {/* Klasör Silme Onay Dialog'u */}
      <AlertDialog open={isDeleteFolderDialogOpen} onOpenChange={setIsDeleteFolderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klasörü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu klasörü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              Klasörün içinde dosya varsa, önce dosyaları silmeniz veya taşımanız gerekebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 