import { 
  FileIcon, 
  FileTextIcon, 
  ImageIcon, 
  FileSpreadsheetIcon, 
  FileArchiveIcon, 
  FileX2Icon,
  Briefcase,
  UserIcon,
  FileCheck,
  Building,
  Landmark,
  Receipt,
  BadgeCheck,
  Calendar,
  GraduationCap,
  Inbox,
  File,
  FileText,
  FileCode,
  FileCog,
  FileDigit,
  Scroll,
  ClipboardList,
  ScrollText,
  Award,
  Newspaper,
  BookOpen
} from 'lucide-react';
import { DocumentCategory, DocumentType } from '@/types/document';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Doküman tipi konfigürasyonu
 * Belge türlerine göre ikon ve etiketleri içerir
 */
export const documentTypeConfig: Record<DocumentType, { label: string; icon: any; colorClass?: string }> = {
  [DocumentType.INVOICE]: { 
    label: "Fatura", 
    icon: Receipt,
    colorClass: "text-amber-500"
  },
  [DocumentType.CONTRACT]: { 
    label: "Sözleşme", 
    icon: FileText,
    colorClass: "text-blue-500"
  },
  [DocumentType.REPORT]: { 
    label: "Rapor", 
    icon: ClipboardList,
    colorClass: "text-emerald-500"
  },
  [DocumentType.LETTER]: { 
    label: "Mektup", 
    icon: Scroll,
    colorClass: "text-indigo-500"
  },
  [DocumentType.MEMO]: { 
    label: "Memo", 
    icon: Newspaper,
    colorClass: "text-cyan-500"
  },
  [DocumentType.FORM]: { 
    label: "Form", 
    icon: FileCheck,
    colorClass: "text-violet-500"
  },
  [DocumentType.RECEIPT]: { 
    label: "Makbuz", 
    icon: Receipt,
    colorClass: "text-amber-500"
  },
  [DocumentType.POLICY]: { 
    label: "Politika", 
    icon: BookOpen,
    colorClass: "text-rose-500"
  },
  [DocumentType.CERTIFICATE]: { 
    label: "Sertifika", 
    icon: Award,
    colorClass: "text-yellow-500"
  },
  [DocumentType.OTHER]: { 
    label: "Diğer", 
    icon: File,
    colorClass: "text-gray-500"
  },
};

/**
 * Doküman kategorisi konfigürasyonu
 * Belge kategorilerine göre ikon ve etiketleri içerir
 */
export const documentCategoryConfig: Record<DocumentCategory, { label: string; icon: any; colorClass?: string }> = {
  [DocumentCategory.FINANCE]: { 
    label: "Finans",
    icon: Receipt,
    colorClass: "text-emerald-500"
  },
  [DocumentCategory.LEGAL]: { 
    label: "Hukuki",
    icon: Briefcase,
    colorClass: "text-rose-500"
  },
  [DocumentCategory.HR]: { 
    label: "İnsan Kaynakları",
    icon: FileDigit,
    colorClass: "text-blue-500"
  },
  [DocumentCategory.MARKETING]: { 
    label: "Pazarlama",
    icon: Newspaper,
    colorClass: "text-violet-500"
  },
  [DocumentCategory.OPERATIONS]: { 
    label: "Operasyon",
    icon: FileCog,
    colorClass: "text-amber-500"
  },
  [DocumentCategory.IT]: { 
    label: "Bilgi Teknolojileri",
    icon: FileCode,
    colorClass: "text-cyan-500"
  },
  [DocumentCategory.GENERAL]: { 
    label: "Genel",
    icon: FileText,
    colorClass: "text-gray-500"
  },
};

/**
 * Dosya URL'ini formatlar
 * - http ile başlıyorsa olduğu gibi bırakır
 * - /uploads ile başlıyorsa window.location.origin ekler
 * - uploads ile başlıyorsa başına / ve window.location.origin ekler
 * - hiçbiri değilse /uploads ve window.location.origin ekler
 * 
 * @param fileUrl - Ham dosya URL'i
 * @returns Formatlanmış, tam dosya URL'i
 */
export const getFileUrl = (fileUrl: string | undefined) => {
  if (!fileUrl) {
    console.warn('[Documents] Eksik fileUrl değeri');
    return '#'; // Varsayılan güvenli URL
  }
  
  try {
    // URL doğru biçimde mi?
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    } else if (fileUrl.startsWith('/uploads/')) {
      // Relative URL - window.location.origin ekle
      return `${window.location.origin}${fileUrl}`;
    } else if (fileUrl.startsWith('uploads/')) {
      // Başında slash eksikse ekle
      return `${window.location.origin}/${fileUrl}`;
    } else {
      // Tam bir URL yolu değilse, varsayılan olarak /uploads dizini ekle
      // Dosya tipine göre alt klasör kontrolü yap
      if (fileUrl.includes('documents/')) {
        return `${window.location.origin}/${fileUrl}`;
      }
      
      console.warn('[Documents] Düzensiz dosya yolu:', fileUrl);
      return `${window.location.origin}/uploads/${fileUrl}`;
    }
  } catch (error) {
    console.error('[Documents] URL işlenirken hata:', error);
    return '#'; // Hata durumunda güvenli URL
  }
};

/**
 * Dosya boyutunu okunabilir formata dönüştürür
 * @param bytes Byte cinsinden dosya boyutu
 * @returns Formatlanmış dosya boyutu (KB, MB, GB)
 */
export const formatFileSize = (bytes: number = 0): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

/**
 * Tarih değerini okunabilir formata dönüştürür
 * @param date Tarih değeri (Date veya string)
 * @returns Formatlanmış tarih (GG.AA.YYYY)
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Mime tipine göre dosya türünü belirler
 * @param mimeType Mime tipi
 * @returns Uygun DocumentType değeri
 */
export const getDocumentTypeFromMime = (mimeType: string): DocumentType => {
  if (!mimeType) return DocumentType.OTHER;
  
  const mime = mimeType.toLowerCase();
  
  if (mime.includes('pdf')) {
    return DocumentType.REPORT;
  } else if (mime.includes('word') || mime.includes('doc')) {
    return DocumentType.LETTER;
  } else if (mime.includes('excel') || mime.includes('sheet') || mime.includes('xls')) {
    return DocumentType.INVOICE;
  } else if (mime.includes('image')) {
    return DocumentType.FORM;
  } else if (mime.includes('text')) {
    return DocumentType.MEMO;
  } else {
    return DocumentType.OTHER;
  }
};

// Dosya türünü mime type'a göre belirleme
export function getFileTypeFromMimeType(mimeType: string): string {
  if (!mimeType) return 'Bilinmeyen';
  
  if (mimeType.startsWith('image/')) return 'Resim';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'Excel';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint';
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'Arşiv';
  if (mimeType.includes('text/')) return 'Metin';
  
  return 'Dosya';
}

// Dosya uzantısına göre ikon belirleme
export function getIconFromMimeType(mimeType: string) {
  if (!mimeType) return FileX2Icon;
  
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('pdf')) return FileTextIcon;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileTextIcon;
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return FileSpreadsheetIcon;
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return FileArchiveIcon;
  
  return FileIcon;
}

// Tarih formatlaması (ne kadar zaman önce)
export function formatRelativeTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: tr
  });
}

/**
 * Returns readable document type from enum
 */
export const formatDocumentType = (type?: DocumentType): string => {
  if (!type) return 'Belirtilmemiş';
  
  const typeMap: Record<DocumentType, string> = {
    [DocumentType.INVOICE]: 'Fatura',
    [DocumentType.CONTRACT]: 'Sözleşme',
    [DocumentType.REPORT]: 'Rapor',
    [DocumentType.FORM]: 'Form',
    [DocumentType.CERTIFICATE]: 'Sertifika',
    [DocumentType.PRESENTATION]: 'Sunum',
    [DocumentType.LETTER]: 'Mektup',
    [DocumentType.RECEIPT]: 'Makbuz',
    [DocumentType.OTHER]: 'Diğer'
  };
  
  return typeMap[type] || 'Belirtilmemiş';
};

/**
 * Returns readable document category from enum
 */
export const formatDocumentCategory = (category?: DocumentCategory): string => {
  if (!category) return 'Belirtilmemiş';
  
  const categoryMap: Record<DocumentCategory, string> = {
    [DocumentCategory.FINANCIAL]: 'Finansal',
    [DocumentCategory.LEGAL]: 'Hukuki',
    [DocumentCategory.HUMAN_RESOURCES]: 'İnsan Kaynakları',
    [DocumentCategory.MARKETING]: 'Pazarlama',
    [DocumentCategory.TECHNICAL]: 'Teknik',
    [DocumentCategory.ADMINISTRATIVE]: 'İdari',
    [DocumentCategory.PROJECT]: 'Proje',
    [DocumentCategory.PERSONAL]: 'Kişisel',
    [DocumentCategory.OTHER]: 'Diğer'
  };
  
  return categoryMap[category] || 'Belirtilmemiş';
};

/**
 * Returns icon based on file mime type
 */
export const getFileIconByMimeType = (mimeType?: string): string => {
  if (!mimeType) return 'file';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  const mimeTypeMap: Record<string, string> = {
    'application/pdf': 'file-pdf',
    'application/msword': 'file-word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file-word',
    'application/vnd.ms-excel': 'file-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file-excel',
    'application/vnd.ms-powerpoint': 'file-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'file-powerpoint',
    'application/zip': 'file-archive',
    'application/x-rar-compressed': 'file-archive',
    'application/x-7z-compressed': 'file-archive',
    'text/plain': 'file-text',
    'text/html': 'file-code',
    'text/css': 'file-code',
    'application/javascript': 'file-code',
    'application/json': 'file-code'
  };
  
  return mimeTypeMap[mimeType] || 'file';
};

/**
 * Downloads a file from URL
 */
export const downloadFile = async (fileUrl: string, fileName: string): Promise<void> => {
  try {
    const response = await fetch(getFileUrl(fileUrl));
    
    if (!response.ok) {
      throw new Error(`Dosya indirme hatası: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Dosya indirme hatası:', error);
    throw new Error('Dosya indirilemedi. Lütfen tekrar deneyin.');
  }
};

// Dosya boyutlarını formatlamak için yardımcı fonksiyon
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// MIME tipine göre dosya tipini tahmin etme
export function getMimeCategory(mimeType: string | null | undefined): string {
  if (!mimeType) return 'OTHER';
  
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/vnd.ms-excel' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'text/csv') return 'SPREADSHEET';
  if (mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'text/plain') return 'DOCUMENT';
  if (mimeType === 'application/vnd.ms-powerpoint' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PRESENTATION';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z')) return 'ARCHIVE';
  
  return 'OTHER';
} 