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
exports.departmentService = void 0;
const prisma_1 = require("../lib/prisma");
exports.departmentService = {
    // Tüm departmanları getir
    findAll(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { skip, take, search, orderBy } = params;
            let whereClause = {};
            if (search) {
                whereClause = {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                };
            }
            const [departments, total] = yield Promise.all([
                prisma_1.prisma.department.findMany({
                    where: whereClause,
                    skip,
                    take,
                    orderBy,
                    include: {
                        parent: true,
                        _count: {
                            select: {
                                employees: true,
                            },
                        },
                    },
                }),
                prisma_1.prisma.department.count({ where: whereClause }),
            ]);
            return {
                data: departments,
                meta: {
                    total,
                    page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
                    pageSize: take || 10,
                },
            };
        });
    },
    // ID'ye göre departman getir
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const department = yield prisma_1.prisma.department.findUnique({
                where: { id },
                include: {
                    parent: true,
                    children: true,
                    employees: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    surname: true,
                                    email: true,
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            employees: true,
                            projects: true,
                        },
                    },
                },
            });
            if (!department) {
                throw new Error("Departman bulunamadı");
            }
            return department;
        });
    },
    // Departman oluştur
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.department.create({
                data,
                include: {
                    parent: true,
                },
            });
        });
    },
    // Departman güncelle
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.department.update({
                where: { id },
                data,
                include: {
                    parent: true,
                },
            });
        });
    },
    // Departman sil
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Alt departmanları kontrol et
            const childDepartments = yield prisma_1.prisma.department.findMany({
                where: { parentId: id },
            });
            if (childDepartments.length > 0) {
                throw new Error("Bu departmanı silemezsiniz çünkü alt departmanları bulunmaktadır.");
            }
            // Kullanıcıları (Employees) kontrol et
            const employeesInDept = yield prisma_1.prisma.employee.count({
                where: { departmentId: id },
            });
            if (employeesInDept > 0) {
                throw new Error("Bu departmanı silemezsiniz çünkü departmana bağlı çalışanlar bulunmaktadır.");
            }
            return yield prisma_1.prisma.department.delete({
                where: { id },
            });
        });
    },
    // Departman hiyerarşisini getir
    getHierarchy() {
        return __awaiter(this, void 0, void 0, function* () {
            const rootDepartments = yield prisma_1.prisma.department.findMany({
                where: { parentId: null },
                include: {
                    children: {
                        include: {
                            children: true,
                            _count: {
                                select: {
                                    employees: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            employees: true,
                        },
                    },
                },
            });
            return rootDepartments;
        });
    },
};
