'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import { Loader2, Image as ImageIcon, Upload, X, MoreHorizontal, Map, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Fotoğraf tipi tanımı
interface ProjectPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  description: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  uploadedAt: string;
  projectId: string;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export default function ProjectGallery({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  
  // Fotoğraf yükleme işlevi
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }
    
    setUploading(true);
    
    // EXIF verilerini okumak için
    const processFile = async (file: File) => {
      // Gerçek uygulamada EXIF bilgilerini çıkarmak için bir kütüphane kullanılabilir
      // Şimdilik simüle ediyoruz
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      
      try {
        // Mock EXIF verileri - gerçekte API'den gelecek
        const mockExifData = {
          latitude: Math.random() * 90,
          longitude: Math.random() * 180,
          takenAt: new Date().toISOString(),
          locationName: 'İstanbul, Türkiye'
        };
        
        // API'ye dosya yükleme isteği (mock)
        // const response = await fetch('/api/projects/photos/upload', {
        //   method: 'POST',
        //   body: formData
        // });
        
        // if (!response.ok) {
        //   throw new Error('Fotoğraf yüklenemedi.');
        // }
        
        // const data = await response.json();
        
        // Mock response
        const mockResponse = {
          id: `photo-${Date.now()}`,
          url: URL.createObjectURL(file),
          thumbnailUrl: URL.createObjectURL(file),
          fileName: file.name,
          description: null,
          locationName: mockExifData.locationName,
          latitude: mockExifData.latitude,
          longitude: mockExifData.longitude,
          takenAt: mockExifData.takenAt,
          uploadedAt: new Date().toISOString(),
          projectId,
          uploadedBy: {
            id: 'user-1',
            name: 'Kullanıcı'
          }
        };
        
        toast.success('Fotoğraf başarıyla yüklendi.');
        return mockResponse;
      } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        toast.error('Fotoğraf yüklenirken bir hata oluştu.');
        return null;
      }
    };
    
    try {
      const results = await Promise.all(acceptedFiles.map(processFile));
      const validResults = results.filter(result => result !== null) as ProjectPhoto[];
      setPhotos(prev => [...validResults, ...prev]);
    } catch (error) {
      console.error('Toplu fotoğraf işleme hatası:', error);
      toast.error('Fotoğraflar işlenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  }, [projectId]);
  
  // Dropzone konfigürasyonu
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxSize: 10485760, // 10MB
    disabled: uploading
  });
  
  // Mock fotoğraf verileri yükleniyor efekti
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API isteği
      // const response = await fetch(`/api/projects/${projectId}/photos`);
      // if (!response.ok) {
      //   throw new Error('Fotoğraflar yüklenirken bir hata oluştu.');
      // }
      // const data = await response.json();
      
      // Mock veri
      setTimeout(() => {
        const mockPhotos: ProjectPhoto[] = [
          {
            id: 'photo-1',
            url: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77',
            thumbnailUrl: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=250',
            fileName: 'elektrik_şantiye_1.jpg',
            description: 'Şantiyede elektrik panosu kurulum çalışmaları.',
            locationName: 'İstanbul, Kadıköy',
            latitude: 40.9812,
            longitude: 29.0381,
            takenAt: '2023-12-15T10:30:00Z',
            uploadedAt: '2023-12-15T14:45:00Z',
            projectId,
            uploadedBy: {
              id: 'user-1',
              name: 'Ahmet Yılmaz'
            }
          },
          {
            id: 'photo-2',
            url: 'https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e',
            thumbnailUrl: 'https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e?w=250',
            fileName: 'kablo_döşeme.jpg',
            description: 'Ana bina kablo döşeme işlemleri tamamlandı.',
            locationName: 'İstanbul, Ataşehir',
            latitude: 40.9923,
            longitude: 29.1244,
            takenAt: '2023-11-28T09:15:00Z',
            uploadedAt: '2023-11-28T16:20:00Z',
            projectId,
            uploadedBy: {
              id: 'user-2',
              name: 'Zeynep Kaya'
            }
          },
          {
            id: 'photo-3',
            url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1',
            thumbnailUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=250',
            fileName: 'trafo_kurulum.jpg',
            description: 'Trafo kurulum çalışmaları.',
            locationName: 'İstanbul, Beşiktaş',
            latitude: 41.0422,
            longitude: 29.0059,
            takenAt: '2024-01-05T11:00:00Z',
            uploadedAt: '2024-01-05T17:30:00Z',
            projectId,
            uploadedBy: {
              id: 'user-3',
              name: 'Mehmet Demir'
            }
          }
        ];
        
        setPhotos(mockPhotos);
        setLoading(false);
      }, 1000);
    } catch (error: any) {
      console.error('Fotoğraf yükleme hatası:', error);
      setError(error.message || 'Fotoğraflar yüklenirken bir hata oluştu');
      setLoading(false);
    }
  }, [projectId]);
  
  // Bileşen yüklendiğinde fotoğrafları getir
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);
  
  // Fotoğraf açıklamasını güncelleme
  const updatePhotoDescription = useCallback(async () => {
    if (!selectedPhoto) return;
    
    // API isteği simülasyonu
    try {
      // const response = await fetch(`/api/projects/photos/${selectedPhoto.id}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ description: photoDescription })
      // });
      
      // if (!response.ok) {
      //   throw new Error('Açıklama güncellenemedi.');
      // }
      
      // API cevabını simüle edelim
      setTimeout(() => {
        setPhotos(photos.map(photo => 
          photo.id === selectedPhoto.id 
            ? { ...photo, description: photoDescription } 
            : photo
        ));
        
        setSelectedPhoto({ ...selectedPhoto, description: photoDescription });
        toast.success('Fotoğraf açıklaması güncellendi.');
      }, 500);
    } catch (error) {
      console.error('Açıklama güncelleme hatası:', error);
      toast.error('Açıklama güncellenirken bir hata oluştu.');
    }
  }, [selectedPhoto, photoDescription, photos]);
  
  // Tarih formatlama
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'PPP', { locale: tr });
    } catch {
      return 'Geçersiz Tarih';
    }
  };
  
  // Fotoğraflara göre sıralanmış timeline oluşturma
  const timelinePhotos = [...photos].sort((a, b) => {
    const dateA = a.takenAt || a.uploadedAt;
    const dateB = b.takenAt || b.uploadedAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  
  // Fotoğrafları tarihe göre gruplandırma
  const groupedPhotos = timelinePhotos.reduce<Record<string, ProjectPhoto[]>>((groups, photo) => {
    const dateKey = formatDate(photo.takenAt || photo.uploadedAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(photo);
    return groups;
  }, {});
  
  return (
    <div className="space-y-6">
      {/* Fotoğraf Yükleme Alanı */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 pb-3">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Saha Fotoğrafı Yükle
          </CardTitle>
          <CardDescription>
            Drag & drop ile fotoğraf yükle veya dosya seç. Çekim tarihi ve konum bilgileri otomatik olarak okunacaktır.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "border-t border-dashed rounded-b-lg p-10 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[180px]",
              isDragActive
                ? "bg-primary/5 border-primary/40"
                : "hover:bg-primary/5 hover:border-primary/40"
            )}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Fotoğraflar yükleniyor...</p>
                <p className="text-xs text-muted-foreground mt-1">Lütfen bekleyin</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-primary font-medium">Fotoğrafları buraya bırak</p>
                <p className="text-xs text-primary/70 mt-1">Fotoğraflar otomatik olarak yüklenecek</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">
                  Fotoğrafları buraya sürükle & bırak
                </p>
                <p className="text-xs text-muted-foreground">
                  veya dosya seçmek için tıkla (Max: 10MB)
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Fotoğraf Seç
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Zaman Çizelgesi */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Saha Fotoğrafları Zaman Çizelgesi
            </CardTitle>
            <CardDescription>
              Fotoğraflar çekilme tarihine göre sıralanmıştır.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => fetchPhotos()}>
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-24 h-6 bg-muted rounded animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="aspect-square bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <ImageIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Henüz fotoğraf yok</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Bu proje için yüklenmiş saha fotoğrafı bulunmuyor. Yukarıdaki alandan fotoğraf yükleyebilirsiniz.
              </p>
              <Button size="sm" variant="outline" className="gap-1">
                <Upload className="h-4 w-4 mr-1" />
                Fotoğraf Yükle
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
                <div key={date} className="relative border-l-2 border-blue-200 dark:border-blue-700 pl-5 pt-1">
                  <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-md font-medium inline-flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-blue-600" /> {date}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {datePhotos.length} fotoğraf
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-2">
                    {datePhotos.map((photo) => (
                      <div 
                        key={photo.id} 
                        className="group relative aspect-square rounded-lg overflow-hidden border shadow-sm cursor-pointer hover:opacity-95 transition-all hover:shadow-md"
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setPhotoDescription(photo.description || '');
                        }}
                      >
                        <Image 
                          src={photo.url} 
                          alt={photo.description || 'Proje fotoğrafı'} 
                          className="object-cover transition-transform group-hover:scale-105"
                          fill
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform">
                          <div className="text-sm font-medium truncate">
                            {photo.description || photo.fileName}
                          </div>
                          {photo.locationName && (
                            <div className="flex items-center gap-1 text-xs text-gray-200 mt-1">
                              <MapPin className="h-3 w-3" /> {photo.locationName}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Seçili Fotoğraf Detayları (Modal/Dialog) */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">Fotoğraf Detayları</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2">
              {/* Fotoğraf */}
              <div className="relative h-80 md:h-full">
                <Image 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.description || 'Proje fotoğrafı'} 
                  className="object-contain"
                  fill
                />
              </div>
              
              {/* Detaylar */}
              <div className="p-4 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Fotoğraf Bilgileri</h4>
                    <div className="text-sm grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Dosya:</span>
                      <span className="col-span-2">{selectedPhoto.fileName}</span>
                      
                      <span className="text-muted-foreground">Çekim:</span>
                      <span className="col-span-2">{formatDate(selectedPhoto.takenAt)}</span>
                      
                      <span className="text-muted-foreground">Konum:</span>
                      <span className="col-span-2">{selectedPhoto.locationName || '-'}</span>
                      
                      <span className="text-muted-foreground">Yükleyen:</span>
                      <span className="col-span-2">{selectedPhoto.uploadedBy.name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Açıklama</h4>
                    <Textarea 
                      placeholder="Fotoğraf için açıklama ekleyin..."
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                      className="resize-none h-24"
                    />
                  </div>
                  
                  {selectedPhoto.latitude && selectedPhoto.longitude && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Map className="h-4 w-4" /> Konum
                      </h4>
                      <div className="h-36 rounded-md overflow-hidden border">
                        <iframe
                          src={`https://maps.google.com/maps?q=${selectedPhoto.latitude},${selectedPhoto.longitude}&z=15&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          title="Photo Location"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4 space-x-2">
                  <Button
                    onClick={updatePhotoDescription}
                    disabled={selectedPhoto.description === photoDescription}
                  >
                    Açıklamayı Kaydet
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedPhoto(null)}
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 