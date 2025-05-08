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
import { TeknisyenRaporu } from "@/types/teknisyen";
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

  const getDurumBadgeRengi = (durum: string) => {
    switch (durum) {
      case "Beklemede":
        return "bg-yellow-500";
      case "Fiyatlar Girildi":
        return "bg-blue-500";
      case "Fatura Kesildi":
        return "bg-green-500";
      case "İptal Edildi":
        return "bg-red-500";
      default:
        return "bg-gray-500";
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Teknisyen Raporları</CardTitle>
            <Link href="/teknisyenraporlari/yeni">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Rapor
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rapor Ara..."
                className="pl-8"
                value={aramaTermi}
                onChange={(e) => setAramaTermi(e.target.value)}
              />
            </div>
          </div>

          {yukleniyor ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : hata ? (
            <div className="text-center py-8 text-red-600">{hata}</div>
          ) : filtrelenmisRaporlar.length === 0 ? (
            <div className="text-center py-8">Hiç rapor bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teknisyen / ID</TableHead>
                    <TableHead>İşin Adı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Başlangıç Tarihi</TableHead>
                    <TableHead>Bitiş Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrelenmisRaporlar.map((rapor) => (
                    <TableRow key={rapor.id}>
                      <TableCell>{getTeknisyenAdi(rapor)}</TableCell>
                      <TableCell>{rapor.baslik || rapor.isinAdi}</TableCell>
                      <TableCell>
                        <Badge className={getDurumBadgeRengi(rapor.durum)}>
                          {rapor.durum}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTarih(rapor.tarih || rapor.baslangicTarihi)}</TableCell>
                      <TableCell>{formatTarih(rapor.bitisTarihi)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/teknisyenraporlari/${rapor.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/teknisyenraporlari/${rapor.id}/duzenle`}>
                            <Button variant="ghost" size="icon">
                              <FileEdit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu raporu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => raporuSil(rapor.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Sil
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