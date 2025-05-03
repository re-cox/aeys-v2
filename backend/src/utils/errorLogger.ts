/**
 * Hata durumlarında loglama yapmak için yardımcı fonksiyon
 * 
 * @param message Hata mesajı
 * @param error Yakalanan hata nesnesi
 */
export const errorLogger = (message: string, error: unknown): void => {
  console.error(`[ERROR] ${message}`);
  
  if (error instanceof Error) {
    console.error(`[ERROR] Mesaj: ${error.message}`);
    console.error(`[ERROR] Stack: ${error.stack}`);
  } else {
    console.error(`[ERROR] Bilinmeyen hata: ${error}`);
  }
}; 