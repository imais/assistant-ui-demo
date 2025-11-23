"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { CloudIcon, DropletsIcon, WindIcon } from "lucide-react";

type WeatherToolArgs = {
  location: string;
  unit?: string;
};

type WeatherToolResult = {
  location: string;
  temperature: number;
  unit: string;
  condition: string;
  humidity: number;
  windSpeed: number;
  description?: string;
};

export const WeatherToolCard = makeAssistantToolUI<
  WeatherToolArgs,
  string
>({
  toolName: "get_weather",
  render: function WeatherToolCard({ args, result }) {
    // Parse the result if it's a JSON string
    let weatherData: WeatherToolResult | undefined;
    
    if (result) {
      try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        weatherData = parsed as WeatherToolResult;
      } catch (e) {
        console.error("Failed to parse weather data:", e);
      }
    }

    // Use weather data if available, otherwise use args
    const displayLocation = weatherData?.location || args?.location || "Unknown";
    const displayUnit = weatherData?.unit || args?.unit || "celsius";
    const temperature = weatherData?.temperature;
    const condition = weatherData?.condition;
    const humidity = weatherData?.humidity;
    const windSpeed = weatherData?.windSpeed;

    // Get condition emoji/icon
    const getConditionIcon = (cond: string | undefined) => {
      if (!cond) return "🌤️";
      const lower = cond.toLowerCase();
      if (lower.includes("sunny")) return "☀️";
      if (lower.includes("cloudy")) return "☁️";
      if (lower.includes("rainy") || lower.includes("rain")) return "🌧️";
      if (lower.includes("partly")) return "⛅";
      return "🌤️";
    };

    return (
    <div className="mb-4 w-full rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{getConditionIcon(condition)}</span>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {displayLocation}
              </h3>
              {weatherData?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {weatherData.description}
                </p>
              )}
            </div>
          </div>

          {temperature !== undefined && (
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {temperature}°
              </span>
              <span className="text-lg text-gray-600 dark:text-gray-400">
                {displayUnit === "celsius" ? "C" : "F"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            {condition && (
              <div className="flex items-center gap-2 text-sm">
                <CloudIcon className="size-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {condition}
                </span>
              </div>
            )}
            {humidity !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <DropletsIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {humidity}% humidity
                </span>
              </div>
            )}
            {windSpeed !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <WindIcon className="size-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {windSpeed} km/h
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  },
});


