"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileEdit, Trash2, Eye } from "lucide-react";
import { TeknisyenRaporu, TeknisyenRaporuDurum } from "@/types/teknisyen";
import { getTeknisyenRaporlari, deleteTeknisyenRaporu } from "@/services/teknisyenRaporService";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TeknisyenRaporlariPage = () => {
  const [raporlar, setRaporlar] = useState<TeknisyenRaporu[]>([]);
  const [filtrelenmisRaporlar, setFiltrelenmisRaporlar] = useState<TeknisyenRaporu[]>([]);
  const [aramaTermi, setAramaTermi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const getRaporBilgiNo = (aciklama?: string) => {
    if (!aciklama) return "-";
    const match = aciklama.match(/Rapor Bilgi No: (\S+)/);
    return match && match[1] ? match[1] : (aciklama.length > 20 ? aciklama.substring(0,10) + "..." : aciklama);
  };

  const durumMap: Record<TeknisyenRaporuDurum, { text: string; className: string }> = {
    TASLAK: { text: "Taslak", className: "bg-gray-400 hover:bg-gray-500 text-gray-800 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600" },
    INCELENIYOR: { text: "İnceleniyor", className: "bg-blue-500 hover:bg-blue-600 text-white" },
    ONAYLANDI: { text: "Onaylandı", className: "bg-green-500 hover:bg-green-600 text-white" },
    REDDEDILDI: { text: "Reddedildi", className: "bg-red-500 hover:bg-red-600 text-white" },
    BEKLEMEDE: { text: "Beklemede", className: "bg-yellow-400 hover:bg-yellow-500 text-gray-800 dark:text-gray-900" },
    FIYATLAR_GIRILDI: { text: "Fiyatlar Girildi", className: "bg-sky-500 hover:bg-sky-600 text-white" },
    FATURA_KESILDI: { text: "Fatura Kesildi", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
    IPTAL_EDILDI: { text: "İptal Edildi", className: "bg-rose-500 hover:bg-rose-600 text-white" },
  };

  const raporlariGetir = async () => {
    try {
      setYukleniyor(true);
      setHata(null);
      const data = await getTeknisyenRaporlari();
      console.log("Gelen rapor verileri:", data); // Debug için
      setRaporlar(data);
      setFiltrelenmisRaporlar(data);
    } catch (error) {
      console.error("Raporlar getirilirken hata oluştu:", error);
      setHata("Raporlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    raporlariGetir();
  }, []);

  useEffect(() => {
    if (aramaTermi.trim() === "") {
      setFiltrelenmisRaporlar(raporlar);
    } else {
      const filtreliListe = raporlar.filter(
        (rapor) =>
          rapor.baslik?.toLowerCase().includes(aramaTermi.toLowerCase()) ||
          rapor.teknisyenId?.toLowerCase().includes(aramaTermi.toLowerCase()) ||
          rapor.teknisyen?.name?.toLowerCase().includes(aramaTermi.toLowerCase()) ||
          rapor.teknisyen?.surname?.toLowerCase().includes(aramaTermi.toLowerCase())
      );
      setFiltrelenmisRaporlar(filtreliListe);
    }
  }, [aramaTermi, raporlar]);

  const raporuSil = async (id: string) => {
    try {
      await deleteTeknisyenRaporu(id);
      setRaporlar((prevRaporlar) => prevRaporlar.filter((rapor) => rapor.id !== id));
      setFiltrelenmisRaporlar((prevRaporlar) => prevRaporlar.filter((rapor) => rapor.id !== id));
    } catch (error) {
      console.error("Rapor silinirken hata oluştu:", error);
      alert("Rapor silinirken bir hata oluştu.");
    }
  };

  const formatTarih = (tarih?: string | Date) => {
    if (!tarih) return "-";
    try {
      return format(new Date(tarih), "dd MMM yyyy", { locale: tr });
    } catch (error) {
      console.error("Tarih biçimlendirme hatası:", error, tarih);
      return "-";
    }
  };

  const getTeknisyenAdi = (rapor: TeknisyenRaporu) => {
    if (rapor.teknisyen?.name) {
      return `${rapor.teknisyen.name} ${rapor.teknisyen.surname || ''}`;
    }
    return rapor.teknisyenId || "-";
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">Teknisyen Raporları</CardTitle>
            <Link href="/teknisyenraporlari/yeni">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Rapor
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rapor başlığı, teknisyen adı veya ID ile ara..."
                className="pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                value={aramaTermi}
                onChange={(e) => setAramaTermi(e.target.value)}
              />
            </div>
          </div>

          {yukleniyor ? (
            <div className="text-center py-12 text-gray-600">Yükleniyor, lütfen bekleyin...</div>
          ) : hata ? (
            <div className="text-center py-12 text-red-600 font-medium">{hata}</div>
          ) : filtrelenmisRaporlar.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Gösterilecek rapor bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teknisyen</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşin Adı</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rapor Bilgi No</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Başlangıç</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bitiş</TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filtrelenmisRaporlar.map((rapor) => (
                    <TableRow key={rapor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{getTeknisyenAdi(rapor)}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{rapor.baslik || rapor.isinAdi}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{getRaporBilgiNo(rapor.aciklama)}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm">
                        <Badge 
                          className={`${durumMap[rapor.durum]?.className || durumMap.TASLAK.className} text-xs font-semibold px-2 py-1 rounded-full`}
                        >
                          {durumMap[rapor.durum]?.text || rapor.durum}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatTarih(rapor.tarih || rapor.baslangicTarihi)}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{formatTarih(rapor.bitisTarihi)}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-1">
                          <Link href={`/teknisyenraporlari/${rapor.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-1.5">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/teknisyenraporlari/${rapor.id}/duzenle`}>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 p-1.5">
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 p-1.5">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Rapor Silme Onayı</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu teknisyen raporunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal Et</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => raporuSil(rapor.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Evet, Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeknisyenRaporlariPage; 