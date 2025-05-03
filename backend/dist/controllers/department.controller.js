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
exports.departmentController = void 0;
const department_service_1 = require("../services/department.service");
exports.departmentController = {
    // Tüm departmanları getir
    getDepartments(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, search, sortBy = "name", sortOrder = "asc" } = req.query;
                const pageNumber = Number(page);
                const limitNumber = Number(limit);
                const skip = (pageNumber - 1) * limitNumber;
                const result = yield department_service_1.departmentService.findAll({
                    skip,
                    take: limitNumber,
                    search: search ? String(search) : undefined,
                    orderBy: { [String(sortBy)]: String(sortOrder) },
                });
                res.status(200).json(result);
                return;
            }
            catch (error) {
                console.error("Departman listesi hatası:", error);
                res.status(500).json({
                    message: "Departmanlar listelenirken bir hata oluştu",
                    error: error instanceof Error ? error.message : "Bilinmeyen hata",
                });
                return;
            }
        });
    },
    // ID'ye göre departman getir
    getDepartmentById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const department = yield department_service_1.departmentService.findById(id);
                res.status(200).json({ data: department });
                return;
            }
            catch (error) {
                console.error("Departman detayı hatası:", error);
                res.status(404).json({
                    message: error instanceof Error ? error.message : "Departman bulunamadı",
                });
                return;
            }
        });
    },
    // Departman oluştur
    createDepartment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, description, parentId } = req.body;
                if (!name) {
                    res.status(400).json({ message: "Departman adı zorunludur" });
                    return;
                }
                const department = yield department_service_1.departmentService.create({
                    name,
                    description,
                    parent: parentId ? { connect: { id: parentId } } : undefined,
                });
                res.status(201).json({
                    message: "Departman başarıyla oluşturuldu",
                    data: department,
                });
                return;
            }
            catch (error) {
                console.error("Departman oluşturma hatası:", error);
                res.status(500).json({
                    message: "Departman oluşturulurken bir hata oluştu",
                    error: error instanceof Error ? error.message : "Bilinmeyen hata",
                });
                return;
            }
        });
    },
    // Departman güncelle
    updateDepartment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { name, description, parentId } = req.body;
                const updateData = {};
                if (name !== undefined)
                    updateData.name = name;
                if (description !== undefined)
                    updateData.description = description;
                if (parentId !== undefined) {
                    if (parentId === null) {
                        updateData.parent = { disconnect: true };
                    }
                    else {
                        updateData.parent = { connect: { id: parentId } };
                    }
                }
                const department = yield department_service_1.departmentService.update(id, updateData);
                res.status(200).json({
                    message: "Departman başarıyla güncellendi",
                    data: department,
                });
                return;
            }
            catch (error) {
                console.error("Departman güncelleme hatası:", error);
                res.status(500).json({
                    message: "Departman güncellenirken bir hata oluştu",
                    error: error instanceof Error ? error.message : "Bilinmeyen hata",
                });
                return;
            }
        });
    },
    // Departman sil
    deleteDepartment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield department_service_1.departmentService.delete(id);
                res.status(200).json({
                    message: "Departman başarıyla silindi",
                });
                return;
            }
            catch (error) {
                console.error("Departman silme hatası:", error);
                res.status(400).json({
                    message: "Departman silinirken bir hata oluştu",
                    error: error instanceof Error ? error.message : "Bilinmeyen hata",
                });
                return;
            }
        });
    },
    // Departman hiyerarşisini getir
    getDepartmentHierarchy(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const hierarchy = yield department_service_1.departmentService.getHierarchy();
                res.status(200).json({ data: hierarchy });
                return;
            }
            catch (error) {
                console.error("Departman hiyerarşisi hatası:", error);
                res.status(500).json({
                    message: "Departman hiyerarşisi alınırken bir hata oluştu",
                    error: error instanceof Error ? error.message : "Bilinmeyen hata",
                });
                return;
            }
        });
    },
};
