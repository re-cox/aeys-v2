// Monofaze kablo kesitleri
export const monofazeKesitler = [
  '2x1.5', '2x2.5', '2x4', '2x6', '2x10', '2x16', '2x25', '2x35',
  '3x1.5', '3x2.5', '3x4', '3x6', '3x10', '3x16', '3x25', '3x35'
];

// Kablo tipleri
export const kabloTipleri = [
  { id: 'NYFGBY', name: 'NYFGBY - Bakır İletkenli, Çelik Zırhlı' },
  { id: 'NA2XH', name: 'NA2XH - Alüminyum İletkenli, XLPE İzoleli' },
  { id: 'N2XH_FE180', name: 'N2XH FE180 - Yangına Dayanıklı' },
  { id: 'NHXMH', name: 'NHXMH - Halojensiz' },
  { id: 'NYY', name: 'NYY - Bakır İletkenli, PVC İzoleli' },
  { id: 'NAYFGBY', name: 'NAYFGBY - Alüminyum İletkenli, Çelik Zırhlı' },
  { id: 'N2XH', name: 'N2XH - Bakır İletkenli, XLPE İzoleli' }
];

// NYFGBY Kablo akım değerleri
export const NYFGBY = {
  kesitler: [
    '3x16/10', '3x25/16', '3x35/16', '3x50/25', '3x70/35', '3x95/50', '3x120/70', '3x150/70', '3x185/95', '3x240/120', '3x300/150', '3x400/185',
    '4x10', '4x16', '4x25', '4x35', '4x50', '4x70', '4x95', '4x120', '4x150', '4x185', '4x240', '4x300', '4x400',
    '5x10', '5x16'
  ],
  akimDegerleri: [
    102, 133, 159, 188, 232, 280, 318, 359, 406, 473, 535, 613,
    79, 102, 133, 159, 188, 232, 280, 318, 359, 406, 473, 535, 613,
    79, 102
  ]
};

// NA2XH Kablo akım değerleri
export const NA2XH = {
  kesitler: [
    '3x25/16', '3x35/16', '3x50/25', '3x70/35', '3x95/50', '3x120/70', '3x150/70', '3x185/95', '3x240/120', '3x300/150', '3x400/185',
    '4x25', '4x35', '4x50', '4x70', '4x95', '4x120', '4x150', '4x185', '4x240', '4x300', '4x400'
  ],
  akimDegerleri: [
    100, 122, 147, 189, 232, 270, 308, 357, 435, 501, 592,
    100, 122, 147, 189, 232, 270, 308, 357, 435, 501, 592
  ]
};

// N2XH_FE180 Kablo akım değerleri
export const N2XH_FE180 = {
  kesitler: [
    '3x2.5', '3x4', '3x6', '3x16/10', '3x25/16', '3x35/16', '3x50/25', '3x70/35', '3x95/50', '3x120/70', '3x150/70', '3x185/95', '3x240/120', '3x300/150', '3x400/185',
    '5x4', '5x6', '5x10', '5x16', '5x25', '5x35', '5x50', '5x70', '5x95', '5x120', '5x150', '5x185', '5x240'
  ],
  akimDegerleri: [
    32, 42, 53, 98, 126, 156, 190, 245, 297, 346, 398, 455, 535, 630, 740,
    42, 53, 73, 98, 126, 156, 190, 245, 297, 346, 398, 455, 535
  ]
};

// NHXMH Kablo akım değerleri
export const NHXMH = {
  kesitler: [
    '2x1.5', '2x2.5', '2x4', '2x6', '2x10', '2x16', '2x25', '2x35',
    '3x1.5', '3x2.5', '3x4', '3x6', '3x10', '3x16', '3x25', '3x35',
    '4x1.5', '4x2.5', '4x4', '4x6', '4x10', '4x16',
    '5x1.5', '5x2.5', '5x4', '5x6', '5x10'
  ],
  akimDegerleri: [
    22, 30, 40, 50, 70, 93, 108, 135,
    22, 30, 40, 50, 70, 93, 108, 135,
    18, 24, 32, 42, 60, 80,
    18, 24, 32, 42, 60
  ]
};

// NYY Kablo akım değerleri
export const NYY = {
  kesitler: [
    '3x1.5', '3x2.5', '3x4', '3x6', '3x10', '3x16/10', '3x25/16', '3x35/16', '3x50/25', '3x70/35', '3x95/50', '3x120/70', '3x150/70', '3x185/95', '3x240/120', '3x300/150', '3x400/185',
    '5x4', '5x6', '5x10', '5x16'
  ],
  akimDegerleri: [
    19, 25, 34, 43, 59, 79, 100, 125, 153, 195, 238, 275, 320, 364, 430, 510, 595,
    34, 43, 59, 79
  ]
};

// NAYFGBY Kablo akım değerleri
export const NAYFGBY = {
  kesitler: [
    '3x25/16', '3x35/16', '3x50/25', '3x70/35', '3x95/50', '3x120/70', '3x150/70', '3x185/95', '3x240/120', '3x300/150', '3x400/185',
    '4x25', '4x35', '4x50', '4x70', '4x95', '4x120', '4x150', '4x185', '4x240', '4x300', '4x400'
  ],
  akimDegerleri: [
    83, 102, 124, 158, 190, 221, 252, 289, 339, 377, 444,
    83, 102, 124, 158, 190, 221, 252, 289, 339, 377, 444
  ]
};

// N2XH Kablo akım değerleri
export const N2XH = {
  kesitler: [
    '3x2.5', '3x4', '3x6', '3x16/10', '3x25/16', '3x35/16', '3x50/25', '3x70/35', '3x95/50', '3x120/70', '3x150/70', '3x185/95', '3x240/120', '3x300/150', '3x400/185',
    '5x4', '5x6', '5x10', '5x16', '5x25', '5x35', '5x50', '5x70', '5x95', '5x120', '5x150', '5x185', '5x240'
  ],
  akimDegerleri: [
    32, 42, 53, 98, 126, 156, 190, 245, 297, 346, 398, 455, 535, 630, 740,
    42, 53, 73, 98, 126, 156, 190, 245, 297, 346, 398, 455, 535
  ]
};

// NAYY Kablo akım değerleri
export const NAYY = {
  kesitler: [
    '3x25/16', '3x35/16', '3x50/25', '3x70/35', '3x95/50', '3x120/70', '3x150/70', '3x185/95', '3x240/120', '3x300/150', '3x400/185',
    '4x25', '4x35', '4x50', '4x70', '4x95', '4x120', '4x150', '4x185', '4x240', '4x300', '4x400'
  ],
  akimDegerleri: [
    99, 118, 142, 176, 211, 242, 270, 308, 363, 412, 475,
    99, 118, 142, 176, 211, 242, 270, 308, 363, 412, 475
  ]
};

// Kablo tipine göre veri getirme
export function getKabloData(kabloTipi: string) {
  switch (kabloTipi) {
    case 'NYFGBY':
      return NYFGBY;
    case 'NA2XH':
      return NA2XH;
    case 'N2XH_FE180':
      return N2XH_FE180;
    case 'NHXMH':
      return NHXMH;
    case 'NYY':
      return NYY;
    case 'NAYFGBY':
      return NAYFGBY;
    case 'N2XH':
      return N2XH;
    case 'NAYY':
      return NAYY;
    default:
      return NYFGBY;
  }
}

// Belirli bir akım değeri için kablo kesiti önerisi
export function onerilenKabloKesiti(kabloTipi: string, akimDegeri: number, sistemTipi: 'trifaze' | 'monofaze'): string {
  // Monofaze sistemler için özel kablo kesitleri
  if (sistemTipi === 'monofaze') {
    return onerilenMonofazeKablo(akimDegeri);
  }
  
  const kabloData = getKabloData(kabloTipi);
  const { kesitler, akimDegerleri } = kabloData;
  
  // Akımdan büyük ilk değeri bulalım
  for (let i = 0; i < akimDegerleri.length; i++) {
    if (akimDegerleri[i] >= akimDegeri) {
      return kesitler[i];
    }
  }
  
  // Eğer tüm değerlerden büyükse, en büyük kesiti önerelim
  return kesitler[kesitler.length - 1];
}

// Kablonun akım taşıma kapasitesini döndüren fonksiyon
export function getKabloAkimKapasitesi(kabloTipi: string, kesit: string, sistemTipi: 'trifaze' | 'monofaze'): number {
  if (sistemTipi === 'monofaze') {
    return getMonofazeKabloAkimKapasitesi(kesit);
  }
  
  const kabloData = getKabloData(kabloTipi);
  const { kesitler, akimDegerleri } = kabloData;
  
  // Kesiti bulalım
  const index = kesitler.findIndex(k => k === kesit);
  if (index !== -1) {
    return akimDegerleri[index];
  }
  
  // Kesit bulunamadıysa -1 döndürelim
  return -1;
}

// Monofaze kablonun akım taşıma kapasitesini döndüren fonksiyon
function getMonofazeKabloAkimKapasitesi(kesit: string): number {
  const akimKapasiteleri = [
    16, 25, 32, 40, 50, 63, 80, 100, // 2x... serileri
    16, 25, 32, 40, 50, 63, 80, 100  // 3x... serileri
  ];
  
  const index = monofazeKesitler.findIndex(k => k === kesit);
  if (index !== -1) {
    return akimKapasiteleri[index];
  }
  
  return -1;
}

// Monofaze sistem için kablo kesiti önerisi
function onerilenMonofazeKablo(akimDegeri: number): string {
  // Monofaze kablolar için yaklaşık akım taşıma kapasiteleri
  const akimKapasiteleri = [
    16, 25, 32, 40, 50, 63, 80, 100, // 2x... serileri
    16, 25, 32, 40, 50, 63, 80, 100  // 3x... serileri
  ];
  
  // Akımdan büyük ilk değeri bulalım
  for (let i = 0; i < akimKapasiteleri.length; i++) {
    if (akimKapasiteleri[i] >= akimDegeri) {
      return monofazeKesitler[i];
    }
  }
  
  // Eğer tüm değerlerden büyükse, en büyük monofaze kesiti önerelim
  return monofazeKesitler[monofazeKesitler.length - 1];
} 