"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { WeatherToolUI } from "@/components/assistant-ui/weather-tool-ui";
import { SearchProductsUI } from "@/components/assistant-ui/search-products-ui";
import { DisplayGraphUI } from "@/components/assistant-ui/display-graph-ui";
import { DisplayReportUI } from "@/components/assistant-ui/display-report-ui";
import { DevToolsModal } from "@assistant-ui/react-devtools";

export default function Home() {
  return (
    <MyRuntimeProvider>
      <DevToolsModal />
      <div className="h-full">
        <Thread />
        <WeatherToolUI />
        <SearchProductsUI />
        <DisplayGraphUI />
        <DisplayReportUI />
      </div>
    </MyRuntimeProvider>
  );
}
