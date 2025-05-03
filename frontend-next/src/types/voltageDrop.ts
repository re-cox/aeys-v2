/**
 * Gerilim Düşümü Hesaplaması için tip tanımlamaları
 */

export type CircuitType = 'TRIFAZE' | 'MONOFAZE';

export type ConductorType = 'COPPER' | 'ALUMINUM';

export interface VoltageDropInput {
  circuitType: CircuitType; // Devre tipi (Trifaze veya Monofaze)
  distance: number;        // Hat mesafesi (metre)
  power: number;           // Güç (kW)
  conductorSection: number; // İletken kesiti (mm²)
  conductorType: ConductorType; // İletken tipi (bakır veya alüminyum)
}

export interface VoltageDropResult {
  voltageDrop: number;      // Hesaplanan gerilim düşümü değeri
  voltageDropPercentage: number; // Yüzde olarak gerilim düşümü
  formula: string;         // Kullanılan formül
  isAcceptable: boolean;   // Gerilim düşümünün kabul edilebilir olup olmadığı (<%3)
}

// Formül sabitleri
export interface ConductorCoefficients {
  trifazeCoefficient: number; // Trifaze için katsayı
  monofazeCoefficient: number; // Monofaze için katsayı
}

export interface VoltageDropConstants {
  copper: ConductorCoefficients; // Bakır iletken katsayıları (K=56)
  aluminum: ConductorCoefficients; // Alüminyum iletken katsayıları (K=35)
  maxAcceptableDropPercentage: number; // Maksimum kabul edilebilir düşüm yüzdesi (%3)
}