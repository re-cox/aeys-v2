/**
 * Gerilim Düşümü Hesaplama Servisi
 * Trifaze ve Monofaze sistemler için gerilim düşümü hesaplamalarını yapar
 */

import { CircuitType, VoltageDropInput, VoltageDropResult, VoltageDropConstants } from "@/types/voltageDrop";

// Gerilim düşümü hesaplama sabitleri
const VOLTAGE_DROP_CONSTANTS: VoltageDropConstants = {
  // Bakır iletken için katsayılar (K=56)
  copper: {
    trifazeCoefficient: 0.0124,      // Trifaze için katsayı
    monofazeCoefficient: 0.074,      // Monofaze için katsayı
  },
  // Alüminyum iletken için katsayılar (K=35)
  aluminum: {
    trifazeCoefficient: 0.0198,      // Trifaze için katsayı (0.0124 * 56/35)
    monofazeCoefficient: 0.1184,     // Monofaze için katsayı (0.074 * 56/35)
  },
  maxAcceptableDropPercentage: 3   // Maksimum kabul edilebilir düşüm yüzdesi (%3)
};

/**
 * Gerilim düşümü hesaplama fonksiyonu
 * @param input Hesaplama için gerekli parametreler
 * @returns Hesaplama sonucu
 */
export function calculateVoltageDrop(input: VoltageDropInput): VoltageDropResult {
  const { circuitType, distance, power, conductorSection, conductorType } = input;
  
  // İletken tipine göre katsayı seçimi
  const conductorConstants = conductorType === 'COPPER' 
    ? VOLTAGE_DROP_CONSTANTS.copper 
    : VOLTAGE_DROP_CONSTANTS.aluminum;
  
  // Devre tipine göre katsayı seçimi
  const coefficient = circuitType === 'TRIFAZE' 
    ? conductorConstants.trifazeCoefficient 
    : conductorConstants.monofazeCoefficient;
  
  // Gerilim düşümü hesaplama (bu değer doğrudan yüzde değeridir)
  const voltageDropPercentage = coefficient * distance * power / conductorSection;
  
  // Baz gerilim değeri (trifaze için 380V, monofaze için 220V)
  const baseVoltage = circuitType === 'TRIFAZE' ? 380 : 220;
  
  // Volt cinsinden gerilim düşümü
  const voltageDrop = (voltageDropPercentage * baseVoltage) / 100;
  
  // İletken katsayısı
  const conductorK = conductorType === 'COPPER' ? 56 : 35;
  
  // Kullanılan formül metni
  const formula = circuitType === 'TRIFAZE'
    ? `%e = (100*L*N) / (K*S*U²) = (10*L*N(kW)) / (${conductorK}*S(mm²)) = ${coefficient.toFixed(4)} * ${distance} * ${power} / ${conductorSection} = ${voltageDropPercentage.toFixed(4)}`
    : `%e = (200*L*N) / (K*S*U²) = (2*10*L*N(kW)) / (${conductorK}*S(2*20)) = ${coefficient.toFixed(4)} * ${distance} * ${power} / ${conductorSection} = ${voltageDropPercentage.toFixed(4)}`;
  
  // Gerilim düşümünün kabul edilebilir olup olmadığı
  const isAcceptable = voltageDropPercentage <= VOLTAGE_DROP_CONSTANTS.maxAcceptableDropPercentage;
  
  return {
    voltageDrop,
    voltageDropPercentage,
    formula,
    isAcceptable
  };
}

/**
 * Örnek hesaplama (görseldeki örneğe göre)
 * @param segment Hesaplanacak segment (e1, e2, e3)
 * @returns Hesaplama sonucu
 */
export function calculateExampleSegment(segment: 'e1' | 'e2' | 'e3'): number {
  switch(segment) {
    case 'e1':
      return 0.0124 * 15 * 8 / 6; // 0.248
    case 'e2':
      return 0.0124 * 5 * 8 / 6;  // 0.08267
    case 'e3':
      return 0.0124 * 15 * 7 / 6; // 0.217
    default:
      return 0;
  }
}

/**
 * Toplam gerilim düşümü hesaplama (örnek için)
 * @returns Toplam gerilim düşümü
 */
export function calculateTotalExampleDrop(): number {
  return calculateExampleSegment('e1') + calculateExampleSegment('e2') + calculateExampleSegment('e3');
}