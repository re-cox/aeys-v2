import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client'; // Yorumlandı
// import { getServerSession } from 'next-auth'; // Yorumlandı
// import { authOptions } from '../lib/auth'; // Yorumlandı

// const prisma = new PrismaClient(); // Yorumlandı

// Fonksiyonları boş olarak tanımla
export const getAllProgressPayments = async (req: Request, res: Response) => { 
    console.warn('getAllProgressPayments fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.'}); 
};
export const getProgressPaymentById = async (req: Request, res: Response) => { 
    console.warn('getProgressPaymentById fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.'}); 
 };
export const createProgressPayment = async (req: Request, res: Response) => { 
    console.warn('createProgressPayment fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.'}); 
 };
export const updateProgressPayment = async (req: Request, res: Response) => { 
    console.warn('updateProgressPayment fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.'}); 
 };
export const deleteProgressPayment = async (req: Request, res: Response) => { 
    console.warn('deleteProgressPayment fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.'}); 
 };
export const updateProgressPaymentStatus = async (req: Request, res: Response) => { 
    console.warn('updateProgressPaymentStatus fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.'}); 
 };
export const getProjectFinancialSummary = async (req: Request, res: Response) => { 
    console.warn('getProjectFinancialSummary fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.'}); 
 };