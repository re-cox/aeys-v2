import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Aydem Elektrik Yönetim Sistemi
        </h1>
        <p className="text-lg mb-8 text-muted-foreground">
          Kurumsal düzeyde, veritabanı odaklı, hızlı ve mobil uyumlu yönetim sistemi
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/login" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Giriş Yap
          </Link>
          <Link 
            href="/about" 
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Hakkında
          </Link>
        </div>
      </div>
    </main>
  );
}
