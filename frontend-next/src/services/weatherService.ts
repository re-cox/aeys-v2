import axios from 'axios';

// API anahtarı
const API_KEY = 'e7a0838c9e1668629f03565245e12bca';
// Esenyurt'un koordinatları
const LATITUDE = 41.0307;  // Esenyurt'un enlem değeri
const LONGITUDE = 28.6764; // Esenyurt'un boylam değeri

/**
 * OpenWeatherMap API'si üzerinden İstanbul, Esenyurt lokasyonu için hava durumu verisi çeker
 */
export const getWeatherData = async () => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LATITUDE}&lon=${LONGITUDE}&units=metric&lang=tr&appid=${API_KEY}`
    );

    // API yanıtını daha kullanışlı bir formata dönüştürüyoruz
    return {
      location: 'İstanbul, Esenyurt',
      temperature: response.data.main.temp,
      feels_like: response.data.main.feels_like,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      humidity: response.data.main.humidity,
      wind_speed: response.data.wind.speed,
      pressure: response.data.main.pressure,
      sunrise: response.data.sys.sunrise,
      sunset: response.data.sys.sunset,
      timestamp: response.data.dt
    };
  } catch (error) {
    console.error('Hava durumu verileri alınırken hata oluştu:', error);
    throw error;
  }
}; 