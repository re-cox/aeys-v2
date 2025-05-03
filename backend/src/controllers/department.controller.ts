import { Request, Response, NextFunction } from "express";
import { departmentService } from "../services/department.service";

export const departmentController = {
  // Tüm departmanları getir
  async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search, sortBy = "name", sortOrder = "asc" } = req.query;
      
      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      const skip = (pageNumber - 1) * limitNumber;

      const result = await departmentService.findAll({
        skip,
        take: limitNumber,
        search: search ? String(search) : undefined,
        orderBy: { [String(sortBy)]: String(sortOrder) },
      });

      res.status(200).json(result);
      return;
    } catch (error) {
      console.error("Departman listesi hatası:", error);
      res.status(500).json({
        message: "Departmanlar listelenirken bir hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      return;
    }
  },

  // ID'ye göre departman getir
  async getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await departmentService.findById(id);
      res.status(200).json({ data: department });
      return;
    } catch (error) {
      console.error("Departman detayı hatası:", error);
      res.status(404).json({
        message: error instanceof Error ? error.message : "Departman bulunamadı",
      });
      return;
    }
  },

  // Departman oluştur
  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, parentId } = req.body;

      if (!name) {
        res.status(400).json({ message: "Departman adı zorunludur" });
        return;
      }

      const department = await departmentService.create({
        name,
        description,
        parent: parentId ? { connect: { id: parentId } } : undefined,
      });

      res.status(201).json({
        message: "Departman başarıyla oluşturuldu",
        data: department,
      });
      return;
    } catch (error) {
      console.error("Departman oluşturma hatası:", error);
      res.status(500).json({
        message: "Departman oluşturulurken bir hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      return;
    }
  },

  // Departman güncelle
  async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, parentId } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) {
        if (parentId === null) {
          updateData.parent = { disconnect: true };
        } else {
          updateData.parent = { connect: { id: parentId } };
        }
      }

      const department = await departmentService.update(id, updateData);

      res.status(200).json({
        message: "Departman başarıyla güncellendi",
        data: department,
      });
      return;
    } catch (error) {
      console.error("Departman güncelleme hatası:", error);
      res.status(500).json({
        message: "Departman güncellenirken bir hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      return;
    }
  },

  // Departman sil
  async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await departmentService.delete(id);
      res.status(200).json({
        message: "Departman başarıyla silindi",
      });
      return;
    } catch (error) {
      console.error("Departman silme hatası:", error);
      res.status(400).json({
        message: "Departman silinirken bir hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      return;
    }
  },

  // Departman hiyerarşisini getir
  async getDepartmentHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hierarchy = await departmentService.getHierarchy();
      res.status(200).json({ data: hierarchy });
      return;
    } catch (error) {
      console.error("Departman hiyerarşisi hatası:", error);
      res.status(500).json({
        message: "Departman hiyerarşisi alınırken bir hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
      return;
    }
  },
}; 