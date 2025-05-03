export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  parentId?: string | null;
  parent?: Department | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    employees: number;
  };
} 