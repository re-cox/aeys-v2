import { Employee } from './employee';
import { Customer } from './customer';

// Pazarlama Aktivite Tipleri
export enum ActivityType {
  EMAIL = 'EMAIL',                // E-posta Gönderimi/Alımı
  CALL = 'CALL',                  // Telefon Görüşmesi
  MEETING = 'MEETING',            // Toplantı (Online/Yüz yüze)
  SITE_VISIT = 'SITE_VISIT',      // Şantiye/Müşteri Ziyareti
  POTENTIAL_VISIT = 'POTENTIAL_VISIT', // Potansiyel Müşteri Ziyareti Planı
  FOLLOW_UP = 'FOLLOW_UP',        // Takip Gerektiren Durum
  OTHER = 'OTHER'                 // Diğer
}

// Pazarlama Aktivite Durumları
export enum ActivityStatus {
  PLANNED = 'PLANNED',            // Planlandı
  COMPLETED = 'COMPLETED',        // Tamamlandı
  CANCELLED = 'CANCELLED',        // İptal Edildi
  NEEDS_FOLLOW_UP = 'NEEDS_FOLLOW_UP' // Takip Gerekiyor
}

// Pazarlama Aktivitesi Modeli
export interface MarketingActivity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  activityDate: string; // ISO Date String
  title?: string;
  description?: string;
  outcome?: string;
  nextStep?: string;
  nextStepDate?: string; // ISO Date String
  locationLink?: string;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  customerId: string;
  customer?: Customer; // İlişkili müşteri bilgisi
  employeeId: string;
  employee?: Employee; // Aktiviteyi yapan çalışan bilgisi
}

// Yeni Aktivite Oluşturma Verisi
export interface NewMarketingActivityData {
  type: ActivityType;
  status?: ActivityStatus;
  activityDate: string; // ISO Date String
  title?: string;
  description?: string;
  outcome?: string;
  nextStep?: string;
  nextStepDate?: string; // ISO Date String
  locationLink?: string;
  customerId: string;
  employeeId: string; // Genellikle giriş yapan kullanıcı ID'si olacak
}

// Aktivite Güncelleme Verisi
export interface UpdateMarketingActivityData {
  id: string;
  type?: ActivityType;
  status?: ActivityStatus;
  activityDate?: string; // ISO Date String
  title?: string;
  description?: string;
  outcome?: string;
  nextStep?: string;
  nextStepDate?: string; // ISO Date String
  locationLink?: string;
  customerId?: string;
  employeeId?: string;
}

// Aktivite Sorgulama Parametreleri
export interface MarketingActivityQueryParams {
  type?: ActivityType;
  status?: ActivityStatus;
  employeeId?: string;
  customerId?: string;
  startDate?: string; // ISO Date String
  endDate?: string;   // ISO Date String
  searchQuery?: string;
} 