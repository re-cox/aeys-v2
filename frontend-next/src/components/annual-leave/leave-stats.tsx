"use client";

import { useState, useEffect, useCallback } from "react";
// LeaveStats tipini servisten alacağız.
// import { LeaveStats } from "@/types/annual-leave"; // Bu satırı kaldır veya yorumla
import { Card, CardContent } from "@/components/ui/card";
import { UsersRound, Info, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Hatalı importu kaldırıp doğrusunu ekleyelim
// import { calculateAllEmployeesLeaveStats } from "@/services/annualLeaveService";
import { getAnnualLeaveStats, LeaveStats } from "@/services/annualLeaveService"; // Yeni fonksiyonu ve tipi import et
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function LeaveStatsComponent() {
  const [stats, setStats] = useState<LeaveStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (showToast = false) => {
    try {
      if (showToast) {
        setIsRefreshing(true);
        toast.loading("İzin istatistikleri güncelleniyor...");
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      const data = await getAnnualLeaveStats();
      setStats(data);
      
      if (showToast) {
        toast.success("İzin istatistikleri güncellendi");
      }
    } catch (error) {
      console.error("İzin istatistikleri yüklenirken hata:", error);
      const errorMessage = error instanceof Error ? error.message : "İzin istatistikleri yüklenemedi";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (error && !isRefreshing) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">İzin istatistikleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500 dark:text-gray-400">
        <UsersRound className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-1">İzin Bilgisi Bulunamadı</h3>
        <p className="text-center mb-6">Henüz hiçbir personel için izin istatistiği bulunmamaktadır.</p>
        <Button 
          onClick={handleRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Yeniden Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Tüm Personel İzin Durumu</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Güncelleniyor...' : 'Yenile'}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personel</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead className="text-right">Kullanılan</TableHead>
                  <TableHead className="text-right">Bekleyen</TableHead>
                  <TableHead className="text-right">Kalan</TableHead>
                  <TableHead className="text-right">Toplam Hak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat, index) => (
                  <TableRow key={stat.userId || index}>
                    <TableCell className="font-medium">
                      {stat.employeeName || "İsimsiz"}
                    </TableCell>
                    <TableCell>
                      {stat.departmentName || "Belirtilmemiş"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={stat.totalDaysUsed > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                        {stat.totalDaysUsed} gün
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={stat.pendingDays > 0 ? "text-blue-600 dark:text-blue-400 font-medium" : ""}>
                        {stat.pendingDays} gün
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        stat.remainingDays <= 3 
                          ? "text-red-600 dark:text-red-400 font-medium" 
                          : (stat.remainingDays <= 7 
                            ? "text-amber-600 dark:text-amber-400 font-medium" 
                            : "text-green-600 dark:text-green-400 font-medium")
                      }>
                        {stat.remainingDays} gün
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{stat.totalAnnualAllowance || 14} gün</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Yıllık izin hakları her personel için varsayılan olarak 14 gün olarak hesaplanmaktadır. 
          Özel izin hakları insan kaynakları tarafından personele özel olarak tanımlanabilir.
        </p>
      </div>
    </div>
  );
} 