"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
import { AnnualLeave, LeaveStatus } from "@/types/annual-leave";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface LeaveSearchFiltersProps {
  leaves: AnnualLeave[];
  onFilter: (filteredLeaves: AnnualLeave[]) => void;
}

export default function LeaveSearchFilters({ leaves, onFilter }: LeaveSearchFiltersProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  
  const [status, setStatus] = useState<LeaveStatus | "ALL">("ALL");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  
  // Tüm departmanları topla (user.department.name üzerinden)
  const allDepartments = Array.from(
    new Set(
      leaves
        .map(leave => leave.user?.department?.name) // employee -> user.department
        .filter(Boolean) as string[]
    )
  ).sort();

  // Filtre uygula
  useEffect(() => {
    let filtered = [...leaves];
    
    // Tarih aralığı filtresi
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        
        // Başlangıç tarihine göre filtrele
        if (dateRange.from && !dateRange.to) {
          return startDate >= dateRange.from;
        }
        
        // Bitiş tarihine göre filtrele
        if (!dateRange.from && dateRange.to) {
          return endDate <= dateRange.to;
        }
        
        // Tarih aralığına göre filtrele (from ve to ikisi de tanımlı)
        if (dateRange.from && dateRange.to) {
          // İzin aralığı ile filtreleme aralığının kesişimi kontrol edilir
          return (
            (startDate >= dateRange.from && startDate <= dateRange.to) || // Başlangıç tarihi aralıkta
            (endDate >= dateRange.from && endDate <= dateRange.to) || // Bitiş tarihi aralıkta
            (startDate <= dateRange.from && endDate >= dateRange.to) // İzin, filtreleme aralığını kapsıyor
          );
        }
        
        return true;
      });
    }
    
    // Durum filtresi
    if (status !== "ALL") {
      filtered = filtered.filter(leave => leave.status === status);
    }
    
    // Departman filtresi (user.department.name üzerinden)
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(leave => 
        leave.user?.department?.name && // employee -> user.department
        selectedDepartments.includes(leave.user.department.name)
      );
    }
    
    onFilter(filtered);
  }, [leaves, dateRange, status, selectedDepartments, onFilter]);
  
  // Tüm filtreleri sıfırla
  const resetFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setStatus("ALL");
    setSelectedDepartments([]);
  };
  
  // Departman seçimini toggle et
  const toggleDepartment = (department: string) => {
    setSelectedDepartments(current => 
      current.includes(department)
        ? current.filter(d => d !== department)
        : [...current, department]
    );
  };
  
  // Aktif filtre sayısı
  const activeFilterCount = [
    dateRange.from || dateRange.to ? 1 : 0,
    status !== "ALL" ? 1 : 0,
    selectedDepartments.length > 0 ? 1 : 0,
  ].reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-base font-medium">
          Gelişmiş Filtreleme
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} filtre aktif
            </Badge>
          )}
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          disabled={activeFilterCount === 0}
        >
          <X className="h-4 w-4 mr-2" />
          Filtreleri Temizle
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarih Aralığı Filtresi */}
        <div className="space-y-2">
          <Label>Tarih Aralığı</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  {dateRange.from ? (
                    format(dateRange.from, "PPP", { locale: tr })
                  ) : (
                    "Başlangıç"
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  {dateRange.to ? (
                    format(dateRange.to, "PPP", { locale: tr })
                  ) : (
                    "Bitiş"
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {(dateRange.from || dateRange.to) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDateRange({ from: undefined, to: undefined })}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Temizle
            </Button>
          )}
        </div>
        
        {/* Durum Filtresi */}
        <div className="space-y-2">
          <Label>İzin Durumu</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as LeaveStatus | "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Durumlar</SelectItem>
              <SelectItem value="PENDING">Beklemede</SelectItem>
              <SelectItem value="APPROVED">Onaylandı</SelectItem>
              <SelectItem value="REJECTED">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
          
          {status !== "ALL" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStatus("ALL")}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Temizle
            </Button>
          )}
        </div>
        
        {/* Departman Filtresi */}
        <div className="space-y-2">
          <Label>Departman</Label>
          <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={departmentOpen}
                className="justify-between w-full"
              >
                {selectedDepartments.length === 0
                  ? "Departman seçin"
                  : `${selectedDepartments.length} departman seçildi`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Departman ara..." />
                <CommandEmpty>Departman bulunamadı.</CommandEmpty>
                <CommandGroup>
                  {allDepartments.map((department) => (
                    <CommandItem
                      key={department}
                      value={department}
                      onSelect={() => toggleDepartment(department)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedDepartments.includes(department)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {department}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedDepartments.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedDepartments.map(dept => (
                <Badge 
                  key={dept} 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {dept}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleDepartment(dept)}
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDepartments([])}
                className="h-6 px-2 text-xs"
              >
                Tümünü Temizle
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 