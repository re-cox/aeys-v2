import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env'; // Ortam değişkenleri için

export const loginUser = async (req: Request, res: Response) => {
  console.log('[Backend Auth] Login isteği alındı');
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('[Backend Auth] Eksik alanlar:', { email: !!email, password: !!password });
    return res.status(400).json({ message: 'Email ve şifre gereklidir.', error: 'missing_fields' });
  }

  try {
    console.log('[Backend Auth] Kullanıcı aranıyor:', email);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        role: {
          select: { name: true, permissions: true }
        },
        employee: {
            select: { 
                id: true,
                department: {
                    select: { id: true, name: true }
                }
            }
        }
      }
    });

    if (!user) {
      console.log('[Backend Auth] Kullanıcı bulunamadı:', email);
      return res.status(401).json({ message: 'Geçersiz email veya şifre.', error: 'invalid_credentials' });
    }

    console.log('[Backend Auth] Kullanıcı bulundu:', user.name, user.surname);

    // Şifreyi doğrula
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      console.log('[Backend Auth] Şifre doğrulama başarısız:', email);
      return res.status(401).json({ message: 'Geçersiz email veya şifre.', error: 'invalid_credentials' });
    }

    console.log('[Backend Auth] Şifre doğrulandı, token oluşturuluyor...');

    // JWT Payload oluştur
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      roleId: user.roleId,
      roleName: user.role?.name,
      permissions: user.role?.permissions,
      employeeId: user.employee?.id,
      departmentId: user.employee?.department?.id,
      departmentName: user.employee?.department?.name
    };

    // JWT Token oluştur
    const jwtOptions: jwt.SignOptions = {
        expiresIn: 86400 // 1 gün = 24 * 60 * 60 = 86400 saniye
    };
    
    const token = jwt.sign(
      tokenPayload,
      env.JWT_SECRET, // Ortam değişkeninden gizli anahtarı al
      jwtOptions      // Ayrı tanımlanan options nesnesi
    );

    // Yanıttan hassas verileri çıkar (passwordHash)
    const { passwordHash: _passwordHash, ...userData } = user;

    console.log('[Backend Auth] Giriş başarılı:', email);
    
    // Başarılı yanıtı gönder
    return res.status(200).json({
      user: userData,
      token: token,
    });

  } catch (error) {
    console.error('[Backend Auth] Giriş hatası:', error);
    // Genel hata mesajı
    return res.status(500).json({ 
      message: 'Giriş sırasında sunucu hatası oluştu.', 
      error: error instanceof Error ? error.message : 'server_error' 
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  console.log('[Backend Auth] /me isteği alındı');
  
  // protect middleware'i kullanıcıyı req.user'a ekledi
  const user = req.user;

  if (!user) {
    // Bu durum normalde protect middleware'i tarafından yakalanmalı
    console.error('[Backend Auth] /me hatası: req.user tanımsız!');
    return res.status(401).json({ message: 'Yetkilendirme başarısız.', error: 'unauthorized' });
  }

  try {
    console.log('[Backend Auth] /me - Kullanıcı ID:', user.id);
    const currentUserData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
            role: { select: { name: true, permissions: true } },
            employee: {
                select: {
                    id: true,
                    department: {
                        select: { id: true, name: true }
                    }
                }
            }
        }
    });

    if (!currentUserData) {
        console.error('[Backend Auth] /me hatası: Kullanıcı veritabanında bulunamadı, ID:', user.id);
        return res.status(404).json({ message: 'Kullanıcı bulunamadı.', error: 'user_not_found' });
    }

    console.log('[Backend Auth] /me başarılı, kullanıcı bilgileri gönderiliyor:', currentUserData.email);
    return res.status(200).json({ user: currentUserData });

  } catch (error) {
    console.error('[Backend Auth] /me sırasında hata:', error);
    return res.status(500).json({ 
      message: 'Kullanıcı bilgileri alınırken sunucu hatası oluştu.', 
      error: error instanceof Error ? error.message : 'server_error' 
    });
  }
}; 