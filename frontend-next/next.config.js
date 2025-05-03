/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sunucu hataları için yeniden yönlendirme
  onDemandEntries: {
    // Sayfaları daha uzun süre önbellekte tut
    maxInactiveAge: 25 * 1000,
    // Aynı anda önbellekte sayfa sayısı
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig; 