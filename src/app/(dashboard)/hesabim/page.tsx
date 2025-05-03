'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, X, FileText, File, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { User, Lock, Trash2, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from 'axios';

export default function AccountPage() {
  const { employee, token, isLoading: isAuthLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Belge yükleme durumları
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const { toast: useToastToast } = useToast();

  // Belgeleri yüklendiğinde getir
  useEffect(() => {
    if (employee?.id && token) {
      fetchEmployeeDocuments();
    }
  }, [employee, token]);

  // Çalışana ait belgeleri getiren fonksiyon
  const fetchEmployeeDocuments = async () => {
    try {
      const response = await fetch(`/api/employees/${employee?.id}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Belgeler yüklenirken bir hata oluştu');
      }
      
      const data = await response.json();
      setUploadedDocuments(data.documents || []);
    } catch (error) {
      console.error('Belge yükleme hatası:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (!currentPassword || !newPassword) {
      setError('Mevcut ve yeni şifre alanları zorunludur.');
      return;
    }
    // Context'ten gelen employee bilgisini kullan
    if (!employee || !employee.id) {
        setError('Kullanıcı bilgileri yüklenemedi veya oturum açılmamış.');
        return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Token'ı Authorization header'ına ekle
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          userId: employee.id, // Context'ten alınan kullanıcı ID'si
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Şifre değiştirme başarısız.');
      }

      toast.success('Şifreniz başarıyla değiştirildi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Şifre değiştirme sırasında bir hata oluştu.');
      toast.error(err.message || 'Şifre değiştirme sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dosya seçim işleyicisi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Belge yükleme işleyicisi
  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }
    
    if (!documentType) {
      toast.error('Lütfen belge tipini seçin');
      return;
    }
    
    if (!employee?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);
      formData.append('employeeId', employee.id.toString());
      
      const response = await fetch('/api/employees/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Belge yüklenirken bir hata oluştu');
      }
      
      const result = await response.json();
      
      toast.success('Belge başarıyla yüklendi');
      setSelectedFile(null);
      setDocumentType('');
      
      // Belge listesini güncelle
      await fetchEmployeeDocuments();
      
    } catch (error: any) {
      console.error('Document upload error:', error);
      toast.error(error.message || 'Belge yüklenirken bir hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  // Belge silme işlemi
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/employees/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Belge silinirken bir hata oluştu');
      }
      
      toast.success('Belge başarıyla silindi');
      
      // Belge listesini güncelle
      setUploadedDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      
    } catch (error: any) {
      console.error('Document delete error:', error);
      toast.error(error.message || 'Belge silinirken bir hata oluştu');
    }
  };

  // Oturum yüklenirken veya kullanıcı yoksa yükleniyor göster
  if (isAuthLoading || !employee) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // Artık employee context'ten geliyor
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Hesabım</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Kullanıcı Bilgileri
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Şifre Değiştir
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Belgelerim
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Bilgileri</CardTitle>
              <CardDescription>
                Hesap bilgilerinizi görüntüleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">Ad Soyad</Label>
                <div className="border rounded-md p-2">{employee.name} {employee.surname || ''}</div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-posta</Label>
                <div className="border rounded-md p-2">{employee.email}</div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Rol</Label>
                <div className="border rounded-md p-2">{employee.position || 'Belirtilmemiş'}</div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="department">Departman</Label>
                <div className="border rounded-md p-2">{employee.department || 'Belirtilmemiş'}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesabınız için yeni bir şifre belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Mevcut Şifre</Label>
                <div className="relative">
                  <Input
                    id="current"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="new"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Yeni Şifre Tekrar</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                 <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <Button className="w-full" onClick={handlePasswordChange}>
                Şifremi Değiştir
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Belge Yükle</CardTitle>
                <CardDescription>
                  Sisteme belge yüklemek için bu formu kullanın.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Belge Türü</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Belge türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kimlik">Kimlik</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="sertifika">Sertifika</SelectItem>
                      <SelectItem value="sözleşme">Sözleşme</SelectItem>
                      <SelectItem value="ikametgah">İkametgah</SelectItem>
                      <SelectItem value="sağlık_raporu">Sağlık Raporu</SelectItem>
                      <SelectItem value="diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Dosya Seç</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Seçilen dosya: {selectedFile.name}
                    </p>
                  )}
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleDocumentUpload} 
                  disabled={isUploading || !selectedFile || !documentType}
                >
                  {isUploading ? "Yükleniyor..." : "Belge Yükle"}
                  <Upload className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yüklenen Belgeler</CardTitle>
                <CardDescription>
                  Sisteme yüklediğiniz belgeler burada listelenir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Henüz belge yüklenmemiş.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploadedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{doc.originalFileName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {doc.documentType} • {formatFileSize(doc.fileSize)} • {new Date(doc.uploadDate).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDocumentDownload(doc.id, doc.originalFileName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Belgeyi Sil</DialogTitle>
                                <DialogDescription>
                                  Bu belgeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">İptal</Button>
                                </DialogClose>
                                <Button 
                                  variant="destructive"
                                  onClick={() => {
                                    handleDeleteDocument(doc.id);
                                  }}
                                >
                                  Sil
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return "📷";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("sheet")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📊";
  return "📁";
}

function handleDocumentDownload(documentId: string, fileName: string) {
  window.open(`/api/employees/documents/download?documentId=${documentId}`, '_blank');
} 