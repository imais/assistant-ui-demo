"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { WeatherToolCard } from "@/components/assistant-ui/weather-tool-card";
import { SearchProductsUI } from "@/components/assistant-ui/search-products-ui";

export default function Home() {
  return (
    <MyRuntimeProvider>
      <div className="h-full">
        <Thread />
        <WeatherToolCard />
        <SearchProductsUI />
      </div>
    </MyRuntimeProvider>
  );
}
