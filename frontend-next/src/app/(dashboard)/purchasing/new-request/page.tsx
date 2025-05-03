"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, PlusCircle, Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PurchaseRequestItemState {
  id: string;
  itemName: string;
  quantity: string;
  unit: string;
  estimatedPrice?: string;
  notes?: string;
}

export default function NewPurchaseRequestPage() {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    departmentId: "",
    projectId: "",
    reason: "",
    requiredDate: undefined as Date | undefined,
    notes: "",
  });
  const [items, setItems] = useState<PurchaseRequestItemState[]>([{
    id: crypto.randomUUID(),
    itemName: "",
    quantity: "",
    unit: "",
  }]);

  useEffect(() => {
    // Token kontrolü
    const checkAndSetToken = () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        toast.error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        window.location.href = '/auth/login';
        return null;
      }
      setToken(storedToken);
      return storedToken;
    };

    const storedToken = checkAndSetToken();
    if (!storedToken) return;

    // Departmanları getir
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments?includeUserDepartments=true', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/auth/login';
            return;
          }
          throw new Error(data.message || 'Departmanlar yüklenemedi');
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setDepartments(data.data);
          if (data.data.length === 1) {
            setFormData(prev => ({ ...prev, departmentId: data.data[0].id }));
          }
        } else {
          throw new Error('Departmanlar yüklenemedi');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Departmanlar yüklenirken bir hata oluştu");
        console.error(error);
      }
    };

    // Projeleri getir
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/auth/login';
            return;
          }
          throw new Error(data.message || 'Projeler yüklenemedi');
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const specialProjects = [
            { id: "CENTRAL_OFFICE", name: "Merkez Ofis" },
            { id: "OTHER", name: "Diğer" }
          ];
          setProjects([...data.data, ...specialProjects]);
        } else {
          throw new Error('Projeler yüklenemedi');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Projeler yüklenirken bir hata oluştu");
        console.error(error);
      }
    };

    fetchDepartments();
    fetchProjects();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: string, field: keyof PurchaseRequestItemState, value: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    setItems(prevItems => [...prevItems, {
      id: crypto.randomUUID(),
      itemName: "",
      quantity: "",
      unit: "",
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Token kontrolü
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        toast.error("Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        window.location.href = '/auth/login';
        setIsLoading(false);
        return;
      }

      // Token'ı güncelle
      setToken(storedToken);

      // Form validasyonu
      if (!formData.departmentId) {
        toast.error("Lütfen departman seçin.");
        setIsLoading(false);
        return;
      }

      if (items.length === 0) {
        toast.error("Lütfen en az bir malzeme ekleyin.");
        setIsLoading(false);
        return;
      }

      const invalidItem = items.find(item => 
        !item.itemName || 
        !item.quantity || 
        !item.unit || 
        isNaN(parseFloat(item.quantity)) || 
        parseFloat(item.quantity) <= 0
      );

      if (invalidItem) {
        toast.error("Lütfen tüm malzeme kalemlerindeki zorunlu alanları (Malzeme Adı, Miktar, Birim) doğru bir şekilde doldurun.");
        setIsLoading(false);
        return;
      }

      // İstek gövdesini hazırla
      const requestBody = {
        departmentId: formData.departmentId,
        projectId: formData.projectId || null,
        reason: formData.reason,
        requiredDate: formData.requiredDate ? formData.requiredDate.toISOString() : null,
        notes: formData.notes,
        items: items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          estimatedPrice: item.estimatedPrice || null,
          notes: item.notes,
        })),
      };

      // API isteğini yap
      const response = await fetch('/api/purchasing/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify(requestBody),
      });

      // Yanıtı kontrol et
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          return;
        }
        throw new Error(errorData.message || 'Bir hata oluştu');
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Satın alma talebi başarıyla oluşturuldu");
        window.location.href = '/purchasing/requests';
      } else {
        throw new Error(data.message || 'Bir hata oluştu');
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Satın alma talebi oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
       <div className="mb-6">
         <Button variant="outline" asChild>
           <Link href="/purchasing/requests" className="flex items-center gap-2">
             <ArrowLeft className="h-4 w-4" />
             Taleplere Geri Dön
           </Link>
         </Button>
       </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Yeni Satın Alma Talebi Oluştur</CardTitle>
            <CardDescription>Satın alınmasını istediğiniz malzemeleri ve detayları girin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="departmentId">Departman</Label>
                <Select
                  value={formData.departmentId || ""}
                  onValueChange={(value) => handleSelectChange("departmentId", value)}
                  disabled={departments.length === 1}
                >
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Departman seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="projectId">Proje</Label>
                <Select
                  value={formData.projectId || ""}
                  onValueChange={(value) => handleSelectChange("projectId", value)}
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Proje seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label htmlFor="requiredDate">İstenen Teslim Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.requiredDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.requiredDate ? format(formData.requiredDate, "PPP") : <span>Tarih seçin</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.requiredDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, requiredDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
             <div className="space-y-1">
                <Label htmlFor="reason">Talep Gerekçesi</Label>
                <Textarea 
                  id="reason" 
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="Bu malzemelere neden ihtiyaç duyulduğunu açıklayın..."
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Ek Notlar</Label>
                <Textarea 
                  id="notes" 
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Varsa eklemek istediğiniz diğer notlar..."
                  rows={2}
                />
              </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Talep Edilen Malzemeler</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Malzeme Adı / Açıklama *</TableHead>
                    <TableHead className="w-[15%]">Miktar *</TableHead>
                    <TableHead className="w-[15%]">Birim *</TableHead>
                    <TableHead className="w-[15%]">Tahmini Fiyat</TableHead>
                    <TableHead className="w-[15%]">Notlar</TableHead>
                    <TableHead className="w-[5%]"></TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input 
                          value={item.itemName}
                          onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                          placeholder="Malzeme adı"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          placeholder="0"
                          required
                          min="0.01"
                          step="any"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          placeholder="adet, kg, mt..."
                          required
                        />
                      </TableCell>
                       <TableCell>
                        <Input 
                          type="number"
                          value={item.estimatedPrice || ''}
                          onChange={(e) => handleItemChange(item.id, 'estimatedPrice', e.target.value)}
                          placeholder="0.00"
                           min="0"
                           step="any"
                        />
                      </TableCell>
                       <TableCell>
                        <Input 
                          value={item.notes || ''}
                          onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                          placeholder="Varsa özel not"
                        />
                      </TableCell>
                      <TableCell>
                        {items.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button type="button" variant="outline" onClick={addItem} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Kalem Ekle
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}> 
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Gönderiliyor..." : "Talebi Oluştur"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 