"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { WeatherToolUI } from "@/components/assistant-ui/weather-tool-ui";
import { SearchProductsUI } from "@/components/assistant-ui/search-products-ui";

export default function Home() {
  return (
    <MyRuntimeProvider>
      <div className="h-full">
        <Thread />
        <WeatherToolUI />
        <SearchProductsUI />
      </div>
    </MyRuntimeProvider>
  );
}
