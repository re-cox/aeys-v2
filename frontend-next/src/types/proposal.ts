// Enum'lar
export enum ProposalStatus {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED'
}

export enum Currency {
    TL = 'TL',
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP'
}

export enum ProposalItemType {
    MATERIAL = 'MATERIAL',
    LABOR = 'LABOR',
    OVERHEAD = 'OVERHEAD',
    PROFIT = 'PROFIT',
    OVERHEAD_PROFIT = 'OVERHEAD_PROFIT'
}

// Frontend'de kullanılacak ProposalAttachment tipi
export interface ProposalAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedAt: Date;
  proposalId: string;
}

// Frontend'de kullanılacak ProposalItem tipi
export interface ProposalItem {
  id: string;
  proposalId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  type: ProposalItemType;
  unit?: string | null;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend'de kullanılacak Proposal tipi
export interface Proposal {
  id: string;
  proposalNo: string;
  title: string;
  description?: string | null;
  status: ProposalStatus;
  customerId: string;
  createdById: string;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: ProposalItem[];
  attachments: ProposalAttachment[];
  customer?: {
    id: string;
    name: string;
  };
  totals?: { [key in Currency]?: number };
  totalQuantity?: number;
}

// Yeni ProposalItem oluşturmak için veri (Form içinde kullanılacak)
export type NewProposalItemData = {
  id?: string; // Geçici ID için (listede key olarak kullanmak üzere)
  type: ProposalItemType;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  unit?: string; // Birim eklendi
};

// Yeni ProposalAttachment oluşturmak için veri (API'ye gönderilecek)
export type NewProposalAttachmentData = {
  fileName: string;
  fileUrl: string; // Yükleme sonrası alınan URL
  fileType?: string | null;
  fileSize?: number | null;
}

// Yeni Proposal oluşturmak için veri (API'ye gönderilecek)
export type NewProposalData = {
  title: string;
  customerId: string;
  status?: ProposalStatus;
  validUntil?: string | null; // ISO string formatında
  items: Omit<NewProposalItemData, 'id'>[]; // Kalemler (geçici ID olmadan)
  attachments?: NewProposalAttachmentData[]; // Eklenecek dosyalar (opsiyonel)
  description?: string; // Açıklama eklendi
};

// Proposal güncellemek için veri (API'ye gönderilecek)
export type UpdateProposalData = {
    title?: string; // Güncellemede alanlar opsiyonel olabilir
    customerId?: string;
    status?: ProposalStatus;
    validUntil?: string | null;
    items?: Omit<NewProposalItemData, 'id'>[];
    attachments?: NewProposalAttachmentData[]; // Attachment alanı eklendi
    description?: string; // Açıklama eklendi
}; 