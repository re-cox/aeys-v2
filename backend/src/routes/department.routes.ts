import { Router, RequestHandler } from "express";
import { departmentController } from "../controllers/department.controller";
import { authenticateToken, authorizePermission } from "../middlewares/auth.middleware";

const router = Router();

// Departman listeleme
router.get("/", departmentController.getDepartments);

// Departman hiyerarşisi
router.get("/hierarchy", authenticateToken, departmentController.getDepartmentHierarchy);

// Departman detayı
router.get("/:id", authenticateToken, departmentController.getDepartmentById);

// Departman oluşturma
router.post(
  "/",
  authenticateToken,
  authorizePermission("departments.create"),
  departmentController.createDepartment
);

// Departman güncelleme
router.put(
  "/:id",
  authenticateToken,
  authorizePermission("departments.edit"),
  departmentController.updateDepartment
);

// Departman silme
router.delete(
  "/:id",
  authenticateToken,
  authorizePermission("departments.delete"),
  departmentController.deleteDepartment
);

export default router; 