"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarPlus, FilterX, RefreshCw, Search } from "lucide-react";
import { AnnualLeave, LeaveStatus } from "@/types/annual-leave";
import { getAnnualLeaves, deleteAnnualLeave } from "@/services/annualLeaveService";
import { toast } from "sonner";
import PendingLeaves from "@/components/annual-leave/pending-leaves";
import ApprovedLeaves from "@/components/annual-leave/approved-leaves";
import RejectedLeaves from "@/components/annual-leave/rejected-leaves";
import LeaveStatsComponent from "@/components/annual-leave/leave-stats";
import { CreateLeaveDialog } from "@/components/annual-leave/create-leave-dialog";
import LeaveSearchFilters from "@/components/annual-leave/leave-search-filters";

export default function AnnualLeavePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState<AnnualLeave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<AnnualLeave[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaves = useCallback(async (showLoadingToast = false) => {
    let toastId: string | number | undefined;
    try {
      if (showLoadingToast) {
        setIsRefreshing(true);
        toastId = toast.loading("İzin kayıtları alınıyor...");
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      const data = await getAnnualLeaves();
      
      if (Array.isArray(data)) {
        setLeaves(data);
        setFilteredLeaves(data);
        setLastUpdated(new Date());
        
        if (showLoadingToast) {
          toast.success(`${data.length} izin kaydı başarıyla alındı`, { id: toastId });
        }
      } else {
        throw new Error("Sunucudan geçersiz veri formatı alındı");
      }
    } catch (error) {
      console.error("İzin kayıtları alınırken hata:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "İzin kayıtları alınamadı. Lütfen daha sonra tekrar deneyin.";
      
      setError(errorMessage);
      if (toastId) toast.error(errorMessage, { id: toastId });
      else toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLeaves(true);
  }, [fetchLeaves]);

  const handleDeleteLeave = useCallback(async (leaveId: string) => {
    const toastId = toast.loading("İzin talebi siliniyor...");
    try {
      await deleteAnnualLeave(leaveId);
      toast.success("İzin talebi başarıyla silindi", { id: toastId });
      await fetchLeaves(false);
    } catch (error) {
      console.error("İzin silme hatası:", error);
      const errorMessage = error instanceof Error ? error.message : "İzin kaydı silinirken bir hata oluştu";
      toast.error(errorMessage, { id: toastId });
    }
  }, [fetchLeaves]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilteredLeaves(leaves);
    setShowFilters(false);
  }, [leaves]);

  useEffect(() => {
    let currentFilteredLeaves = [...leaves];
    
    if (searchTerm.trim() !== "") {
        const searchTermLower = searchTerm.toLowerCase();
        currentFilteredLeaves = currentFilteredLeaves.filter((leave) => {
          const employeeName = `${leave.user?.name || ""} ${leave.user?.surname || ""}`.toLowerCase();
          
          return (
            employeeName.includes(searchTermLower) ||
            leave.status.toLowerCase().includes(searchTermLower)
          );
        });
    }
    
    setFilteredLeaves(currentFilteredLeaves);

  }, [searchTerm, leaves]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  if (error && !isRefreshing) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-900/10">
          <div className="flex flex-col items-center justify-center py-6 px-4 text-gray-800 dark:text-gray-200">
            <div className="text-red-500 text-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium mt-4">Veri Yükleme Hatası</h3>
            </div>
            <p className="text-center mb-6">{error}</p>
            <Button 
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yeniden Dene
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">İzin kayıtları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yıllık İzin Yönetimi</h1>
          <p className="text-muted-foreground">
            Tüm personel yıllık izin kayıtlarını yönetin ve izleyin
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Son güncelleme: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={isRefreshing}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Güncelleniyor...' : 'Yenile'}
          </Button>
          <Button 
            onClick={() => setIsCreating(true)} 
            className="h-9"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            <span>Yeni İzin</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="İzin ara: personel, departman, durum..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline" 
            size="sm" 
            className={`h-9 ${showFilters ? 'bg-muted' : ''}`}
          >
            {showFilters ? 'Filtreleri Gizle' : 'Filtreler'}
          </Button>
          {searchTerm && (
            <Button 
              onClick={clearFilters} 
              variant="ghost" 
              size="sm" 
              className="h-9"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Temizle
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="p-4">
          <LeaveSearchFilters leaves={leaves} onFilter={setFilteredLeaves} />
        </Card>
      )}

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Bekleyen İzinler
            {filteredLeaves.filter(l => l.status === LeaveStatus.PENDING).length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {filteredLeaves.filter(l => l.status === LeaveStatus.PENDING).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Onaylanan İzinler</TabsTrigger>
          <TabsTrigger value="stats">İzin İstatistikleri</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4 mt-4">
          <PendingLeaves 
            leaves={filteredLeaves.filter(l => l.status === LeaveStatus.PENDING)} 
            onDelete={handleDeleteLeave} 
            onUpdate={handleRefresh}
          />
        </TabsContent>
        
        <TabsContent value="approved" className="space-y-4 mt-4">
          <ApprovedLeaves 
            leaves={filteredLeaves.filter(l => l.status === LeaveStatus.APPROVED || l.status === LeaveStatus.REJECTED)} 
            onDelete={handleDeleteLeave}
          />
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4 mt-4">
          <LeaveStatsComponent />
        </TabsContent>
      </Tabs>

      <CreateLeaveDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onCreated={() => {
          setIsCreating(false);
          handleRefresh();
          setActiveTab("pending");
        }}
      />
    </div>
  );
} 