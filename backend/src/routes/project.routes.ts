import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/error-handler';
import { prisma } from '../lib/prisma';
import { ProjectStatus } from '@prisma/client';

const router = express.Router();

// Tüm projeleri getir
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { status, departmentId, search } = req.query;
  
  const where: any = {};
  if (status) where.status = status as ProjectStatus;
  if (departmentId) where.departmentId = departmentId as string;
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  const projects = await prisma.project.findMany({
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
}));

// Tekil projeyi getir
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const project = await prisma.project.findUnique({
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
}));

// Yeni proje oluştur
router.post('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    description, 
    status, 
    startDate, 
    endDate, 
    budget, 
    departmentId, 
    customerId,
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
  
  const newProject = await prisma.project.create({
    data: {
      name,
      description,
      status: status as ProjectStatus,
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
}));

// Projeyi güncelle
router.put('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    status, 
    startDate, 
    endDate, 
    budget, 
    departmentId, 
    customerId,
    // projectCode, //TODO: Prisma şemasında kontrol et
    location,
    // projectManagerId //TODO: Prisma şemasında kontrol et
  } = req.body;
  // Yukarıdaki destructuring işleminde yorum satırına alınan alanlar:
  const projectCode_update = req.body.projectCode;
  const projectManagerId_update = req.body.projectManagerId;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status as ProjectStatus;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : undefined;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null; // null olabilmeli
  if (budget !== undefined) updateData.budget = budget;
  if (departmentId !== undefined) updateData.departmentId = departmentId;
  if (customerId !== undefined) updateData.customerId = customerId;
  if (location !== undefined) updateData.location = location;
  // if (projectManagerId_update !== undefined) updateData.projectManagerId = projectManagerId_update; //TODO: Prisma şemasında kontrol et
  
  const updatedProject = await prisma.project.update({
    where: { id },
    data: updateData,
    include: {
        department: true,
        customer: true,
        // projectManager: true, //TODO: Prisma şemasında kontrol et
    }
  });
  
  res.json({ success: true, data: updatedProject });
}));

// Projeyi sil
router.delete('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // İlgili görevlerin projectId alanını null yap (veya isteğe bağlı olarak görevleri de sil)
  await prisma.task.updateMany({
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


  await prisma.project.delete({
    where: { id },
  });
  
  res.status(204).end();
}));

export default router; 