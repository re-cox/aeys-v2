// Döviz kurları için servis
export async function getCurrencyRates() {
  try {
    const response = await fetch('https://api.genelpara.com/embed/doviz.json');
    
    if (!response.ok) {
      throw new Error('Currency data fetch failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Currency fetch error:', error);
    return null;
  }
} 