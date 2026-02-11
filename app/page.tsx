"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const SpeakingCoach = dynamic(() => import("../components/SpeakingCoach"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-zinc-400 text-sm">Loading Speaking Coach...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <SpeakingCoach />;
}
