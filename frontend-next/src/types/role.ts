// types/role.ts
export interface Role {
  id: string;
  name: string;
  description?: string | null;
  // Prisma'dan gelen permissions alanı genellikle JSON veya Record<string, boolean> olabilir
  permissions?: Record<string, boolean> | any; 
  createdAt?: string | Date; // String veya Date olabilir
  updatedAt?: string | Date; // String veya Date olabilir
} 