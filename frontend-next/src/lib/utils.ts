import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Verilen sayıyı Türkçe para birimi formatına çevirir.
 * @param amount Formatlanacak sayı
 * @param minimumFractionDigits Minimum ondalık basamak sayısı (varsayılan: 2)
 * @param maximumFractionDigits Maksimum ondalık basamak sayısı (varsayılan: 2)
 * @returns Formatlanmış para birimi string'i (örn: "₺1.234,56") veya geçersizse "₺0,00"
 */
export function formatCurrency(
  amount: number | null | undefined,
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return "₺0,00"; // veya isteğe bağlı olarak '-' gibi bir değer
  }
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Verilen tarih değerini Türkçe formatında görüntüler
 * @param date Formatlanacak tarih (string, Date veya null/undefined olabilir)
 * @param includeTime Saat bilgisinin dahil edilip edilmeyeceği (varsayılan: false)
 * @returns Formatlanmış tarih string'i veya geçersizse "-"
 */
export function formatDate(
  date: string | Date | null | undefined,
  includeTime: boolean = false
): string {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "-";
    }
    
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat('tr-TR', options).format(dateObj);
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return "-";
  }
}

/**
 * Dosya boyutunu insan tarafından okunabilir formata dönüştürür
 * @param bytes Bayt cinsinden dosya boyutu
 * @returns İnsan tarafından okunabilir dosya boyutu (örn. 1.5 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * ISO tarih formatını gün.ay.yıl formatına dönüştürür
 * @param dateString ISO formatında tarih string'i
 * @returns dd.mm.yyyy formatında tarih (örn. 01.01.2023)
 */
export function formatSimpleDate(dateString?: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
}
