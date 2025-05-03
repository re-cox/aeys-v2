import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export const departmentService = {
  // Tüm departmanları getir
  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    orderBy?: { [key: string]: string };
  }) {
    const { skip, take, search, orderBy } = params;

    let whereClause: Prisma.DepartmentWhereInput = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
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
      prisma.department.count({ where: whereClause }),
    ]);

    return {
      data: departments,
      meta: {
        total,
        page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
        pageSize: take || 10,
      },
    };
  },

  // ID'ye göre departman getir
  async findById(id: string) {
    const department = await prisma.department.findUnique({
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
  },

  // Departman oluştur
  async create(data: Prisma.DepartmentCreateInput) {
    return await prisma.department.create({
      data,
      include: {
        parent: true,
      },
    });
  },

  // Departman güncelle
  async update(id: string, data: Prisma.DepartmentUpdateInput) {
    return await prisma.department.update({
      where: { id },
      data,
      include: {
        parent: true,
      },
    });
  },

  // Departman sil
  async delete(id: string) {
    // Alt departmanları kontrol et
    const childDepartments = await prisma.department.findMany({
      where: { parentId: id },
    });

    if (childDepartments.length > 0) {
      throw new Error(
        "Bu departmanı silemezsiniz çünkü alt departmanları bulunmaktadır."
      );
    }

    // Kullanıcıları (Employees) kontrol et
    const employeesInDept = await prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeesInDept > 0) {
      throw new Error(
        "Bu departmanı silemezsiniz çünkü departmana bağlı çalışanlar bulunmaktadır."
      );
    }

    return await prisma.department.delete({
      where: { id },
    });
  },

  // Departman hiyerarşisini getir
  async getHierarchy() {
    const rootDepartments = await prisma.department.findMany({
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
  },
}; 