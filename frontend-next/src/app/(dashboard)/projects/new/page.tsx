"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Assuming sonner is used for notifications
import { cn } from '@/lib/utils'; // For conditional classes

// Enums matching Prisma schema
const ProjectStatus = z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]);
const ProjectPriority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

// Zod schema for validation
const projectSchema = z.object({
  name: z.string().min(3, { message: 'Proje adı en az 3 karakter olmalıdır.' }),
  description: z.string().optional(),
  status: ProjectStatus.optional().default('PLANNING'),
  priority: ProjectPriority.optional().default('MEDIUM'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? undefined : Number(val),
    z.number().positive({ message: 'Bütçe pozitif bir sayı olmalıdır.' }).optional()
  ),
  managerId: z.string().optional(),
  // teamMembers: z.array(z.string()).optional(), // Assuming teamMembers will be handled differently
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Employee {
  id: string;
  name: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEmployees, setIsFetchingEmployees] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
        status: 'PLANNING',
        priority: 'MEDIUM',
    }
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsFetchingEmployees(true);
      try {
        // Use real API to fetch employees
        const response = await fetch('/api/employees/list');
        if (!response.ok) {
          throw new Error('Çalışanlar getirilemedi.');
        }
        const data = await response.json();
        setEmployees(data.data || []);

        // If no employees found, log a warning
        if (!data.data || data.data.length === 0) {
          console.warn("Dikkat: Veritabanında hiç çalışan bulunamadı! Önce Employee tablosunu doldurun.");
        }

      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error('Çalışan listesi yüklenirken bir hata oluştu.');
      } finally {
        setIsFetchingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    const toastId = toast.loading('Proje oluşturuluyor...');

    const payload = {
        ...data,
        startDate: data.startDate ? data.startDate.toISOString() : null,
        endDate: data.endDate ? data.endDate.toISOString() : null,
        // teamMembers: data.teamMembers, // Add team members if handling
    };

    // Log the payload with JSON.stringify for better visibility
    console.log('Sending project payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
         // Log the error response from the API
         console.error('API Error Response:', result);
         throw new Error(result.message || 'Proje oluşturulamadı.');
      }

      toast.success('Proje başarıyla oluşturuldu!', { id: toastId });
      reset(); // Reset form after successful submission
      // Redirect to the project list or the new project's detail page
      router.push('/projects');
    //   router.push(`/projects/${result.data.id}`); // Option to redirect to detail page

    } catch (error: any) {
      console.error("Submit Error:", error);
      toast.error(`Proje oluşturma başarısız: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-4xl">
       <Button variant="outline" size="sm" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri
       </Button>
      <Card>
        <CardHeader>
          <CardTitle>Yeni Proje Oluştur</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Proje Adı *</Label>
              <Input id="name" {...register('name')} placeholder="Proje Adı Girin" />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" {...register('description')} placeholder="Proje detaylarını girin..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Status */}
                <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="status">
                        <SelectValue placeholder="Durum Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                        {ProjectStatus.options.map((status) => (
                            <SelectItem key={status} value={status}>{translateStatus(status)}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                 {errors.status && <p className="text-xs text-red-600">{errors.status.message}</p>}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                 <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="priority">
                                <SelectValue placeholder="Öncelik Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {ProjectPriority.options.map((priority) => (
                                <SelectItem key={priority} value={priority}>{translatePriority(priority)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                 />
                {errors.priority && <p className="text-xs text-red-600">{errors.priority.message}</p>}
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                 <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP", { locale: tr }) : <span>Tarih Seçin</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                     )}
                />
                 {errors.startDate && <p className="text-xs text-red-600">{errors.startDate.message}</p>}
                </div>

                {/* End Date */}
                <div className="space-y-2">
                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                 <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP", { locale: tr }) : <span>Tarih Seçin</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {errors.endDate && <p className="text-xs text-red-600">{errors.endDate.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Budget */}
                <div className="space-y-2">
                <Label htmlFor="budget">Bütçe (₺)</Label>
                <Input id="budget" type="number" {...register('budget')} placeholder="Örn: 150000" step="0.01" />
                {errors.budget && <p className="text-xs text-red-600">{errors.budget.message}</p>}
                </div>

                 {/* Manager */}
                <div className="space-y-2">
                <Label htmlFor="managerId">Proje Yöneticisi</Label>
                 <Controller
                    name="managerId"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFetchingEmployees}>
                            <SelectTrigger id="managerId">
                                <SelectValue placeholder={isFetchingEmployees ? "Çalışanlar yükleniyor..." : "Yönetici Seçin"} />
                            </SelectTrigger>
                            <SelectContent>
                                {!isFetchingEmployees && employees.length === 0 && <SelectItem value="" disabled>Çalışan bulunamadı</SelectItem>}
                                {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                 />
                {errors.managerId && <p className="text-xs text-red-600">{errors.managerId.message}</p>}
                </div>

                 {/* Team Members - Placeholder/Example */} 
                 {/* <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="teamMembers">Ekip Üyeleri</Label>
                    <p className="text-sm text-muted-foreground">Ekip üyesi seçimi daha sonra eklenecektir.</p>
                     Add multi-select component here when ready
                 </div> */} 
            </div>

          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Oluşturuluyor...' : 'Projeyi Oluştur'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Helper functions (copy from list page or define here)
const translateStatus = (status: string): string => {
  switch (status) {
    case 'PLANNING': return 'Planlama';
    case 'IN_PROGRESS': return 'Devam Ediyor';
    case 'ON_HOLD': return 'Beklemede';
    case 'COMPLETED': return 'Tamamlandı';
    case 'CANCELLED': return 'İptal Edildi';
    default: return status;
  }
};

const translatePriority = (priority: string): string => {
    switch (priority) {
        case 'LOW': return 'Düşük';
        case 'MEDIUM': return 'Orta';
        case 'HIGH': return 'Yüksek';
        case 'URGENT': return 'Acil';
        default: return priority;
    }
}; 