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
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Tüm görevleri getir
router.get('/', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, priority, projectId } = req.query;
    // Filtreleme koşullarını oluştur
    const where = {};
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (projectId)
        where.projectId = projectId;
    const tasks = yield prisma_1.prisma.task.findMany({
        where,
        include: {
            assignees: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    profilePictureUrl: true
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    res.json({ success: true, data: tasks, count: tasks.length });
})));
// Tekil görevi getir
router.get('/:id', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const task = yield prisma_1.prisma.task.findUnique({
        where: { id },
        include: {
            assignees: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    profilePictureUrl: true
                },
            },
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    department: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    profilePictureUrl: true
                }
            }
        },
    });
    if (!task) {
        return res.status(404).json({ success: false, error: 'Görev bulunamadı' });
    }
    res.json({ success: true, data: task });
})));
// Yeni görev oluştur
router.post('/', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, status, priority, dueDate, projectId, assigneeIds } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, error: 'Görev başlığı zorunludur' });
    }
    // Proje ID kontrolü kaldırıldı, çünkü artık opsiyonel.
    // if (!projectId) {
    //   return res.status(400).json({ success: false, error: 'Proje seçimi zorunludur' });
    // }
    const assigneesInput = Array.isArray(assigneeIds) ? assigneeIds : [];
    let validAssigneeConnects = [];
    if (assigneesInput.length > 0) {
        const existingUsers = yield prisma_1.prisma.user.findMany({
            where: { id: { in: assigneesInput } },
            select: { id: true }
        });
        validAssigneeConnects = existingUsers.map(user => ({ id: user.id }));
        if (assigneesInput.length !== validAssigneeConnects.length) {
            console.warn(`[Task Create] Bazı atanan kullanıcı ID'leri bulunamadı. Gelen: ${assigneesInput.length}, Bulunan: ${validAssigneeConnects.length}`);
        }
    }
    const dataToCreate = {
        title,
        description,
        status: status || client_1.TaskStatus.TODO,
        priority: priority || client_1.Priority.MEDIUM,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: {
            connect: { id: req.user.id }
        },
        assignees: {
            connect: validAssigneeConnects
        }
    };
    if (projectId && projectId !== "other") { // "other" değeri projesiz anlamına gelebilir, kontrol edelim
        dataToCreate.project = { connect: { id: projectId } };
    }
    // Eğer projectId yoksa veya "other" ise, project alanı dataToCreate'e eklenmeyecek, Prisma opsiyonel olduğu için null atayacak
    const newTask = yield prisma_1.prisma.task.create({
        data: dataToCreate,
        include: {
            assignees: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    profilePictureUrl: true
                }
            },
            project: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    res.status(201).json({ success: true, data: newTask });
})));
// Görevi güncelle
router.put('/:id', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, projectId, assigneeIds } = req.body;
    const assigneeInputIds = Array.isArray(assigneeIds) ? assigneeIds : [];
    let validAssigneeIdsToSet = [];
    if (assigneeInputIds.length > 0) {
        const existingUsers = yield prisma_1.prisma.user.findMany({
            where: { id: { in: assigneeInputIds } },
            select: { id: true }
        });
        validAssigneeIdsToSet = existingUsers.map(user => ({ id: user.id }));
        if (assigneeInputIds.length !== validAssigneeIdsToSet.length) {
            console.warn(`[Task Update] Bazı atanan kullanıcı ID'leri bulunamadı. Gelen: ${assigneeInputIds.length}, Bulunan: ${validAssigneeIdsToSet.length}. Sadece geçerli olanlar atanacak.`);
        }
    }
    const updateData = {};
    if (title !== undefined)
        updateData.title = title;
    if (description !== undefined)
        updateData.description = description;
    if (status !== undefined)
        updateData.status = status;
    if (priority !== undefined)
        updateData.priority = priority;
    if (dueDate !== undefined)
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
    // projectId undefined ise dokunma, null veya "other" ise bağlantıyı kes, geçerli ID ise bağlan.
    if (projectId === null || projectId === "other") {
        updateData.project = { disconnect: true };
    }
    else if (projectId) { // projectId dolu ve geçerli bir string ise (null veya "other" değilse)
        updateData.project = { connect: { id: projectId } };
    }
    // Eğer projectId frontend'den hiç gelmezse (undefined), bu alan güncellenmeyecek.
    if (Array.isArray(assigneeIds)) {
        updateData.assignees = {
            set: validAssigneeIdsToSet
        };
    }
    const updatedTask = yield prisma_1.prisma.task.update({
        where: { id },
        data: updateData,
        include: {
            assignees: {
                select: { id: true, name: true, surname: true, profilePictureUrl: true },
            },
            project: { select: { id: true, name: true } }
        },
    });
    res.json({ success: true, data: updatedTask });
})));
// Görev durumunu güncelle (PATCH)
router.patch('/:id/status', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const updatedTask = yield prisma_1.prisma.task.update({
        where: { id },
        data: { status: status },
        include: {
            assignees: {
                select: { id: true, name: true, surname: true, profilePictureUrl: true },
            },
            project: { select: { id: true, name: true } }
        },
    });
    res.json({ success: true, data: updatedTask });
})));
// Görevi sil
router.delete('/:id', auth_middleware_1.protect, (0, error_handler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield prisma_1.prisma.task.delete({
        where: { id },
    });
    res.status(204).end();
})));
exports.default = router;
