"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { WeatherToolUI } from "@/components/assistant-ui/weather-tool-ui";
import { SearchProductsUI } from "@/components/assistant-ui/search-products-ui";
import { DisplayGraphUI } from "@/components/assistant-ui/display-graph-ui";

export default function Home() {
  return (
    <MyRuntimeProvider>
      <div className="h-full">
        <Thread />
        <WeatherToolUI />
        <SearchProductsUI />
        <DisplayGraphUI />
      </div>
    </MyRuntimeProvider>
  );
}
