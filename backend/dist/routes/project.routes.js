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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_handler_1 = require("../utils/error-handler");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
// Tüm projeleri getir
router.get('/', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, departmentId, search } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (departmentId)
        where.departmentId = departmentId;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    const projects = yield prisma_1.prisma.project.findMany({
        where,
        include: {
            department: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
            tasks: { select: { id: true, title: true, status: true } }, // İsteğe bağlı olarak eklenebilir
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    res.json({ success: true, data: projects, count: projects.length });
})));
// Tekil projeyi getir
router.get('/:id', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const project = yield prisma_1.prisma.project.findUnique({
        where: { id },
        include: {
            department: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
            tasks: true, // Tüm task detaylarını getir
            // additionalWorks: true, // İlave işleri getir //TODO: Prisma şemasında kontrol et
            // progressPayments: true, // Hakedişleri getir //TODO: Prisma şemasında kontrol et
        },
    });
    if (!project) {
        return res.status(404).json({ success: false, error: 'Proje bulunamadı' });
    }
    res.json({ success: true, data: project });
})));
// Yeni proje oluştur
router.post('/', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, status, startDate, endDate, budget, departmentId, customerId, 
    // projectCode, //TODO: Prisma şemasında kontrol et
    location,
    // projectManagerId //TODO: Prisma şemasında kontrol et
     } = req.body;
    // Yukarıdaki destructuring işleminde yorum satırına alınan alanlar:
    const projectCode = req.body.projectCode; // Eğer kullanılıyorsa geçici olarak böyle alalım
    const projectManagerId = req.body.projectManagerId; // Eğer kullanılıyorsa geçici olarak böyle alalım
    if (!name || !departmentId || !status) {
        return res.status(400).json({ success: false, error: 'Proje adı, departman ve durum zorunludur.' });
    }
    const newProject = yield prisma_1.prisma.project.create({
        data: {
            name,
            description,
            status: status,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            budget,
            departmentId,
            customerId,
            // projectManagerId: projectManagerId, //TODO: Prisma şemasında kontrol et (varsa)
            // createdById: (req as any).user.id, //TODO: Prisma şemasında kontrol et
        },
        include: {
            department: true,
            customer: true,
            // projectManager: true, //TODO: Prisma şemasında kontrol et
        }
    });
    res.status(201).json({ success: true, data: newProject });
})));
// Projeyi güncelle
router.put('/:id', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, description, status, startDate, endDate, budget, departmentId, customerId, 
    // projectCode, //TODO: Prisma şemasında kontrol et
    location,
    // projectManagerId //TODO: Prisma şemasında kontrol et
     } = req.body;
    // Yukarıdaki destructuring işleminde yorum satırına alınan alanlar:
    const projectCode_update = req.body.projectCode;
    const projectManagerId_update = req.body.projectManagerId;
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    if (status !== undefined)
        updateData.status = status;
    if (startDate !== undefined)
        updateData.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined)
        updateData.endDate = endDate ? new Date(endDate) : null; // null olabilmeli
    if (budget !== undefined)
        updateData.budget = budget;
    if (departmentId !== undefined)
        updateData.departmentId = departmentId;
    if (customerId !== undefined)
        updateData.customerId = customerId;
    if (location !== undefined)
        updateData.location = location;
    // if (projectManagerId_update !== undefined) updateData.projectManagerId = projectManagerId_update; //TODO: Prisma şemasında kontrol et
    const updatedProject = yield prisma_1.prisma.project.update({
        where: { id },
        data: updateData,
        include: {
            department: true,
            customer: true,
            // projectManager: true, //TODO: Prisma şemasında kontrol et
        }
    });
    res.json({ success: true, data: updatedProject });
})));
// Projeyi sil
router.delete('/:id', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // İlgili görevlerin projectId alanını null yap (veya isteğe bağlı olarak görevleri de sil)
    yield prisma_1.prisma.task.updateMany({
        where: { projectId: id },
        data: { projectId: null },
    });
    // Varsa ilave işlerin projectId alanını null yap //TODO: Prisma şemasında kontrol et
    // await prisma.additionalWork.updateMany({
    //   where: { projectId: id },
    //   data: { projectId: null }
    // })
    // Varsa hakedişlerin projectId alanını null yap //TODO: Prisma şemasında kontrol et
    // await prisma.progressPayment.updateMany({
    //     where: { projectId: id },
    //     data: { projectId: null }
    // })
    // Zimmetleri sil (eğer proje ile direkt bağlantılıysa ve cascade delete yoksa)
    // Not: Bu kısım şemanıza göre değişiklik gösterebilir.
    // await prisma.inventoryLog.deleteMany({ where: { projectId: id } });
    yield prisma_1.prisma.project.delete({
        where: { id },
    });
    res.status(204).end();
})));
exports.default = router;
