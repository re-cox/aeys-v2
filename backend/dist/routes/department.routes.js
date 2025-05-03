"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_controller_1 = require("../controllers/department.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Departman listeleme
router.get("/", department_controller_1.departmentController.getDepartments);
// Departman hiyerarşisi
router.get("/hierarchy", auth_middleware_1.authenticateToken, department_controller_1.departmentController.getDepartmentHierarchy);
// Departman detayı
router.get("/:id", auth_middleware_1.authenticateToken, department_controller_1.departmentController.getDepartmentById);
// Departman oluşturma
router.post("/", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizePermission)("departments.create"), department_controller_1.departmentController.createDepartment);
// Departman güncelleme
router.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizePermission)("departments.edit"), department_controller_1.departmentController.updateDepartment);
// Departman silme
router.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizePermission)("departments.delete"), department_controller_1.departmentController.deleteDepartment);
exports.default = router;
