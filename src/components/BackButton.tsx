'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-6 left-6 z-50 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all group cursor-pointer"
      aria-label="Go back"
    >
      <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
    </button>
  );
};

