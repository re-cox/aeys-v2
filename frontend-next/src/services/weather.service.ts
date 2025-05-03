// OpenWeatherMap API'si için servis
export async function getWeather() {
  const API_KEY = '32b8c5e8d14d5d8e3266d87d2d0ea6c5'; // OpenWeatherMap API key
  const CITY_ID = '738329'; // Esenyurt, Istanbul city ID

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?id=${CITY_ID}&appid=${API_KEY}&units=metric&lang=tr`
    );
    
    if (!response.ok) {
      throw new Error('Weather data fetch failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
} 