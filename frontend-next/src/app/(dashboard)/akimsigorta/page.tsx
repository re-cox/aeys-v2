import { Metadata } from 'next';
import AkimSigortaIstemci from './AkimSigortaIstemci';

export const metadata: Metadata = {
  title: 'Akım ve Kablo Kesiti Hesaplama | Aydem Elektrik',
  description: 'Trifaze ve monofaze sistemler için akım ve kablo kesiti hesaplama aracı',
};

export default function AkimSigortaPage() {
  return <AkimSigortaIstemci />;
} 