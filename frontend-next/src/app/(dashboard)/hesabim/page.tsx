"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileInfo from "./components/ProfileInfo";
import PasswordReset from "./components/PasswordReset";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hesabım</h2>
          <p className="text-muted-foreground">
            Hesap bilgilerinizi görüntüleyin ve düzenleyin
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="profile">Profil Bilgileri</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>
                Kişisel bilgilerinizi görüntüleyin ve düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileInfo employee={{
                id: user.id,
                name: user.firstName,
                surname: user.lastName || '',
                email: user.email,
                position: user.role,
                departmentId: user.department || '',
                phoneNumber: user.phoneNumber || '',
                profilePictureUrl: user.profileImage
              }} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştirme</CardTitle>
              <CardDescription>
                Hesabınızın şifresini değiştirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordReset />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 