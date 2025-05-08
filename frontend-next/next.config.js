/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sunucu hataları için yeniden yönlendirme
  onDemandEntries: {
    // Sayfaları daha uzun süre önbellekte tut
    maxInactiveAge: 25 * 1000,
    // Aynı anda önbellekte sayfa sayısı
    pagesBufferLength: 2,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'plus.unsplash.com',
      'source.unsplash.com',
      'cloudflare-ipfs.com',
      'loremflickr.com',
      'picsum.photos'
    ],
  },
};

module.exports = nextConfig; 