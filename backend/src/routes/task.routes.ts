import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/error-handler';
import { prisma } from '../lib/prisma';
import { Priority, TaskStatus } from '@prisma/client';

const router = express.Router();

// Tüm görevleri getir
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, projectId } = req.query;
  
  // Filtreleme koşullarını oluştur
  const where: any = {};
  if (status) where.status = status as TaskStatus;
  if (priority) where.priority = priority as Priority;
  if (projectId) where.projectId = projectId as string;
  
  const tasks = await prisma.task.findMany({
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
}));

// Tekil görevi getir
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const task = await prisma.task.findUnique({
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
}));

// Yeni görev oluştur
router.post('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { title, description, status, priority, dueDate, projectId, assigneeIds } = req.body;
  
  if (!title) {
    return res.status(400).json({ success: false, error: 'Görev başlığı zorunludur' });
  }
  // Proje ID kontrolü kaldırıldı, çünkü artık opsiyonel.
  // if (!projectId) {
  //   return res.status(400).json({ success: false, error: 'Proje seçimi zorunludur' });
  // }
  
  const assigneesInput = Array.isArray(assigneeIds) ? assigneeIds : [];
  let validAssigneeConnects: { id: string }[] = [];
  if (assigneesInput.length > 0) {
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: assigneesInput } },
      select: { id: true }
    });
    validAssigneeConnects = existingUsers.map(user => ({ id: user.id }));
    if (assigneesInput.length !== validAssigneeConnects.length) {
      console.warn(`[Task Create] Bazı atanan kullanıcı ID'leri bulunamadı. Gelen: ${assigneesInput.length}, Bulunan: ${validAssigneeConnects.length}`);
    }
  }

  const dataToCreate: any = {
    title,
    description,
    status: status as TaskStatus || TaskStatus.TODO,
    priority: priority as Priority || Priority.MEDIUM,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy: { 
      connect: { id: (req as any).user.id }
    },
    assignees: {
      connect: validAssigneeConnects
    }
  };

  if (projectId && projectId !== "other") { // "other" değeri projesiz anlamına gelebilir, kontrol edelim
    dataToCreate.project = { connect: { id: projectId } };
  }
  // Eğer projectId yoksa veya "other" ise, project alanı dataToCreate'e eklenmeyecek, Prisma opsiyonel olduğu için null atayacak

  const newTask = await prisma.task.create({
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
}));

// Görevi güncelle
router.put('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, projectId, assigneeIds } = req.body;
  
  const assigneeInputIds = Array.isArray(assigneeIds) ? assigneeIds : [];
  let validAssigneeIdsToSet: { id: string }[] = [];
  if (assigneeInputIds.length > 0) {
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: assigneeInputIds } },
      select: { id: true }
    });
    validAssigneeIdsToSet = existingUsers.map(user => ({ id: user.id }));
    if (assigneeInputIds.length !== validAssigneeIdsToSet.length) {
        console.warn(`[Task Update] Bazı atanan kullanıcı ID'leri bulunamadı. Gelen: ${assigneeInputIds.length}, Bulunan: ${validAssigneeIdsToSet.length}. Sadece geçerli olanlar atanacak.`);
    }
  }
  
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status as TaskStatus;
  if (priority !== undefined) updateData.priority = priority as Priority;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  
  // projectId undefined ise dokunma, null veya "other" ise bağlantıyı kes, geçerli ID ise bağlan.
  if (projectId === null || projectId === "other") {
    updateData.project = { disconnect: true };
  } else if (projectId) { // projectId dolu ve geçerli bir string ise (null veya "other" değilse)
    updateData.project = { connect: { id: projectId } };
  }
  // Eğer projectId frontend'den hiç gelmezse (undefined), bu alan güncellenmeyecek.

  if (Array.isArray(assigneeIds)) {
    updateData.assignees = {
        set: validAssigneeIdsToSet 
    };
  }
  
  const updatedTask = await prisma.task.update({
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
}));

// Görev durumunu güncelle (PATCH)
router.patch('/:id/status', protect, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const updatedTask = await prisma.task.update({
    where: { id },
    data: { status: status as TaskStatus },
    include: {
      assignees: {
        select: { id: true, name: true, surname: true, profilePictureUrl: true },
      },
      project: { select: { id: true, name: true } }
    },
  });
  
  res.json({ success: true, data: updatedTask });
}));

// Görevi sil
router.delete('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await prisma.task.delete({
    where: { id },
  });
  
  res.status(204).end();
}));

export default router; 