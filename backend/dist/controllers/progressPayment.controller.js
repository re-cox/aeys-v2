"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectFinancialSummary = exports.updateProgressPaymentStatus = exports.deleteProgressPayment = exports.updateProgressPayment = exports.createProgressPayment = exports.getProgressPaymentById = exports.getAllProgressPayments = void 0;
// import { PrismaClient } from '@prisma/client'; // Yorumlandı
// import { getServerSession } from 'next-auth'; // Yorumlandı
// import { authOptions } from '../lib/auth'; // Yorumlandı
// const prisma = new PrismaClient(); // Yorumlandı
// Fonksiyonları boş olarak tanımla
const getAllProgressPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn('getAllProgressPayments fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.' });
});
exports.getAllProgressPayments = getAllProgressPayments;
const getProgressPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn('getProgressPaymentById fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.' });
});
exports.getProgressPaymentById = getProgressPaymentById;
const createProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn('createProgressPayment fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.' });
});
exports.createProgressPayment = createProgressPayment;
const updateProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn('updateProgressPayment fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.' });
});
exports.updateProgressPayment = updateProgressPayment;
const deleteProgressPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn('deleteProgressPayment fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.' });
});
exports.deleteProgressPayment = deleteProgressPayment;
const updateProgressPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn('updateProgressPaymentStatus fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.' });
});
exports.updateProgressPaymentStatus = updateProgressPaymentStatus;
const getProjectFinancialSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.warn('getProjectFinancialSummary fonksiyonu geçici olarak devre dışı bırakıldı.');
    res.status(501).json({ message: 'Bu özellik geçici olarak devre dışıdır.' });
});
exports.getProjectFinancialSummary = getProjectFinancialSummary;
