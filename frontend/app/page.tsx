"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { WeatherToolCard } from "@/components/assistant-ui/weather-tool-card";

export default function Home() {
  return (
    <MyRuntimeProvider>
      <div className="h-full">
        <Thread />
        <WeatherToolCard />
      </div>
    </MyRuntimeProvider>
  );
}
