"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/types/employee";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

// Axios instance oluştur
const api = axios.create({
  baseURL: "/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ProfileInfoProps {
  employee: Employee;
}

export default function ProfileInfo({ employee }: ProfileInfoProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: employee.name || "",
    surname: employee.surname || "",
    phoneNumber: employee.phoneNumber || "",
    address: employee.address || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put(`/employees/${employee.id}`, formData);
      toast.success("Profil bilgileri başarıyla güncellendi");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      toast.error("Profil bilgileri güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">Soyad</Label>
            <Input
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Telefon Numarası</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
        <div className="flex space-x-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Ad</p>
          <p className="text-base">{employee.name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Soyad</p>
          <p className="text-base">{employee.surname}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">E-posta</p>
          <p className="text-base">{employee.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Pozisyon</p>
          <p className="text-base">{employee.position || "-"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Telefon</p>
          <p className="text-base">{employee.phoneNumber || "-"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">Adres</p>
          <p className="text-base">{employee.address || "-"}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          Düzenle
        </Button>
      </div>
    </div>
  );
} 