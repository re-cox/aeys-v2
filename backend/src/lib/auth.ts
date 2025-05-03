import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// Diğer sağlayıcıları import edin (GoogleProvider, GithubProvider vb.)
// import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.hashedPassword) {
          // Kullanıcı bulunamadı veya şifresi hashlenmemiş
          console.error(`Yetkilendirme hatası: Kullanıcı bulunamadı veya şifre hashlenmemiş - ${credentials.email}`);
          return null;
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isValidPassword) {
          console.error(`Yetkilendirme hatası: Geçersiz şifre - ${credentials.email}`);
          return null;
        }

        // Yetkilendirme başarılı, kullanıcı nesnesini döndür
        console.log(`Yetkilendirme başarılı: ${user.email}`);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // Kullanıcı rolünü ekleyin
          // Gerekirse diğer kullanıcı bilgilerini ekleyin
        };
      }
    }),
    // Diğer sağlayıcıları buraya ekleyin
    // GoogleProvider({...}),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // JWT callback'i token'a ek bilgiler eklemek için
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Kullanıcı nesnesinde 'role' alanı varsa token'a ekle
        if ('role' in user) {
           token.role = (user as any).role; 
        }
      }
      return token;
    },
    // Session callback'i session nesnesine ek bilgiler eklemek için
    async session({ session, token }) {
      if (session.user) {
         // Session kullanıcı nesnesine ID ve rol ekle
        if (token.id) {
          (session.user as any).id = token.id;
        }
        if (token.role) {
           (session.user as any).role = token.role;
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET, // .env dosyasında tanımlanmalı
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login', // Özel giriş sayfası yolu (frontend'de)
    // error: '/auth/error', // Hata sayfası yolu
  }
};