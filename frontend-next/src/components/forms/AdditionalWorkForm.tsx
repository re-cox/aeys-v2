"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { EmployeeCombobox } from "@/components/forms/EmployeeCombobox";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { tr } from "date-fns/locale";

const statusOptions = [
  { value: "To Do", label: "Yapılacak" },
  { value: "In Progress", label: "Devam Ediyor" },
  { value: "Done", label: "Tamamlandı" },
  { value: "Cancelled", label: "İptal Edildi" },
];

const formSchema = z.object({
  title: z.string().min(2, "Başlık en az 2 karakter olmalıdır"),
  technicianNumber: z.string().optional(),
  description: z.string().optional(),
  status: z.string().min(1, "Durum seçilmelidir"),
  startDate: z.date({ required_error: "Başlangıç tarihi seçilmelidir" }),
  startTime: z.string().min(1, "Başlangıç saati seçilmelidir"),
  endDate: z.date().optional().nullable(),
  endTime: z.string().optional(),
  assignedToIds: z.array(z.string()).optional(),
  files: z.array(z.instanceof(File)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AdditionalWork {
  id: string;
  title: string;
  technicianNumber?: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  assignedTo: {
    id: string;
    name: string;
    surname: string;
  }[] | null;
  files?: string[];
  [key: string]: any;
}

export interface AdditionalWorkFormProps {
  initialData?: AdditionalWork;
  onSuccess?: (data: any) => void;
  mode?: "create" | "edit";
}

export function AdditionalWorkForm({
  initialData,
  onSuccess,
  mode = "create",
}: AdditionalWorkFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Array<{id: string, name: string, surname: string}>>([]);
  const [employees, setEmployees] = useState<Array<{id: string, name: string, surname: string, department?: {name: string}}>>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Default values based on mode and initialData
  const defaultValues: Partial<FormValues> = initialData
    ? {
        title: initialData.title,
        technicianNumber: initialData.technicianNumber || "",
        description: initialData.description || "",
        status: initialData.status,
        startDate: new Date(initialData.startDate),
        startTime: format(new Date(initialData.startDate), 'HH:mm'),
        endDate: initialData.endDate ? new Date(initialData.endDate) : null,
        endTime: initialData.endDate ? format(new Date(initialData.endDate), 'HH:mm') : "",
        assignedToIds: initialData.assignedTo ? initialData.assignedTo.map(a => a.id) : [],
        files: [],
      }
    : {
        title: "",
        technicianNumber: "",
        description: "",
        status: "To Do",
        startDate: new Date(),
        startTime: format(new Date(), 'HH:mm'),
        endDate: null,
        endTime: "",
        assignedToIds: [],
        files: [],
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    // Tüm çalışanları getir
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const response = await fetch("/api/employees", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Çalışanlar yüklenirken hata oluştu");
        }
        
        const data = await response.json();
        setEmployees(data);
        
        // Eğer düzenleme modundaysa ve atanmış personel varsa
        if (mode === "edit" && initialData && initialData.assignedTo) {
          setSelectedEmployees(initialData.assignedTo);
        }
      } catch (error) {
        console.error("Çalışanlar yüklenirken hata:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Çalışanlar yüklenirken bir hata oluştu",
        });
      }
    };

    fetchEmployees();
  }, [initialData, mode]);

  // Form'daki assignedToIds değeri değiştiğinde selectedEmployees'i güncelle
  useEffect(() => {
    // Sadece form ilk kez yüklendiğinde veya düzenleme modunda çalışsın
    if (mode === "edit" && initialData?.assignedTo) {
      setSelectedEmployees(initialData.assignedTo);
      form.setValue('assignedToIds', initialData.assignedTo.map(a => a.id));
    }
  }, [initialData, mode, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      form.setValue('files', updatedFiles);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
    form.setValue('files', updatedFiles);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      // Tarih ve saati birleştir
      const startDateTime = new Date(values.startDate);
      const [startHours, startMinutes] = values.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);
      
      let endDateTime = null;
      if (values.endDate && values.endTime) {
        endDateTime = new Date(values.endDate);
        const [endHours, endMinutes] = values.endTime.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes);
      }
      
      // Dosyaları yükle
      let fileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        try {
          const formData = new FormData();
          selectedFiles.forEach(file => {
            formData.append('files', file);
          });
          
          const token = localStorage.getItem('token') || '';
          
          // FormData ile 'Content-Type' header'ı belirtmeyin, 
          // fetch API bunu otomatik olarak 'multipart/form-data' yapacaktır
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              "Authorization": `Bearer ${token}`
              // Content-Type header'ını kaldırdık
            },
            body: formData
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            console.error("Dosya yükleme hatası:", errorData);
            throw new Error(errorData.message || "Dosyalar yüklenirken hata oluştu");
          }
          
          const uploadResult = await uploadResponse.json();
          if (!uploadResult.fileUrls || !Array.isArray(uploadResult.fileUrls)) {
            console.error("Geçersiz dosya yanıtı:", uploadResult);
            throw new Error("Dosya yanıtı geçersiz format");
          }
          
          fileUrls = uploadResult.fileUrls;
          console.log("Dosyalar başarıyla yüklendi:", fileUrls);
        } catch (uploadError) {
          console.error("Dosya yükleme hatası:", uploadError);
          throw new Error(uploadError instanceof Error ? uploadError.message : "Dosyalar yüklenirken hata oluştu");
        }
      }
      
      // API için veriyi hazırla
      const apiData = {
        title: values.title,
        technicianNumber: values.technicianNumber,
        description: values.description,
        status: values.status,
        priority: "Medium",
        startDate: startDateTime.toISOString(),
        endDate: endDateTime ? endDateTime.toISOString() : null,
        assignedToIds: values.assignedToIds,
        files: fileUrls,
      };

      // Determine URL and method based on mode
      const url = mode === "edit" && initialData 
        ? `/api/additional-works/${initialData.id}` 
        : "/api/additional-works";
      
      const method = mode === "edit" ? "PUT" : "POST";

      const token = localStorage.getItem('token') || '';
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save additional work");
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        toast({
          title: "Başarılı",
          description: `Ek iş ${mode === "create" ? "oluşturuldu" : "güncellendi"}.`,
        });
        
        if (mode === "create") {
          router.push(`/additional-works/${data.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving additional work:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ek iş kaydedilemedi",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlık</FormLabel>
              <FormControl>
                <Input placeholder="Başlık girin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="technicianNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teknisyen No</FormLabel>
              <FormControl>
                <Input placeholder="Teknisyen numarası girin" {...field} />
              </FormControl>
              <FormDescription>İsteğe bağlı</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Açıklama girin" 
                  className="min-h-[100px]" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Başlangıç Tarihi</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "d MMMM yyyy", { locale: tr })
                          ) : (
                            <span>Tarih seçin</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Başlangıç Saati</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      placeholder="00:00" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Bitiş Tarihi</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "d MMMM yyyy", { locale: tr })
                          ) : (
                            <span>Tarih seçin (isteğe bağlı)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>İsteğe bağlı</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Bitiş Saati</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      placeholder="00:00" 
                    />
                  </FormControl>
                  <FormDescription>İsteğe bağlı</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="assignedToIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atanmış Personeller</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedEmployees.map(emp => (
                      <Badge key={emp.id} variant="secondary" className="px-2 py-1">
                        {emp.name} {emp.surname}
                        <X 
                          className="ml-1 h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            // Personeli kaldır
                            const currentIds = form.getValues('assignedToIds') || [];
                            const updatedIds = currentIds.filter(id => id !== emp.id);
                            const updatedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                            
                            setSelectedEmployees(updatedEmployees);
                            form.setValue('assignedToIds', updatedIds, {
                              shouldValidate: true,
                              shouldDirty: true
                            });
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                    <div className="pb-2">
                      <Input 
                        type="text" 
                        placeholder="Personel ara..." 
                        className="mb-2"
                        onChange={(e) => {
                          // Arama işlevi burada eklenebilir
                        }}
                      />
                    </div>
                    
                    {employees.length === 0 ? (
                      <div className="text-center py-2 text-sm text-gray-500">
                        Personel bulunamadı
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {employees.map(emp => {
                          const isSelected = selectedEmployees.some(e => e.id === emp.id);
                          return (
                            <div 
                              key={emp.id} 
                              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => {
                                  const currentIds = form.getValues('assignedToIds') || [];
                                  let updatedIds: string[];
                                  
                                  if (isSelected) {
                                    updatedIds = currentIds.filter(id => id !== emp.id);
                                    const updatedEmployees = selectedEmployees.filter(e => e.id !== emp.id);
                                    setSelectedEmployees(updatedEmployees);
                                  } else {
                                    updatedIds = [...currentIds, emp.id];
                                    const updatedEmployees = [...selectedEmployees, emp];
                                    setSelectedEmployees(updatedEmployees);
                                  }
                                  
                                  form.setValue('assignedToIds', updatedIds, {
                                    shouldValidate: true,
                                    shouldDirty: true
                                  });
                                }}
                              />
                              <div>
                                <div>{emp.name} {emp.surname}</div>
                                {emp.department && (
                                  <div className="text-xs text-gray-500">{emp.department.name}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>İsteğe bağlı</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dosyalar</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Dosya Ekle
                    </label>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="truncate max-w-[80%]">
                            {file.name}
                            <span className="text-xs text-gray-500 ml-2">
                              ({(file.size / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>İsteğe bağlı - PDF, resim ve metin dosyaları ekleyebilirsiniz</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {mode === "create" ? (
            <Button type="button" variant="outline" onClick={() => router.back()}>
              İptal
            </Button>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : mode === "create" ? "Oluştur" : "Güncelle"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 