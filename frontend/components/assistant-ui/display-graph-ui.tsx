"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { BarChart3Icon, LineChartIcon, PieChartIcon } from "lucide-react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { PlotParams } from "react-plotly.js";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(
  () => import("react-plotly.js"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
        <p>グラフを読み込み中...</p>
      </div>
    ),
  }
) as ComponentType<PlotParams>;

type DisplayGraphToolArgs = {
  plot_type: string;
};

type BarChartData = {
  labels: string[];
  values: number[];
  title?: string;
  xlabel?: string;
  ylabel?: string;
};

type LineChartData = {
  labels: string[];
  values: number[];
  title?: string;
  xlabel?: string;
  ylabel?: string;
};

type PieChartData = {
  labels: string[];
  values: number[];
  title?: string;
};

export const DisplayGraphUI = makeAssistantToolUI<
  DisplayGraphToolArgs,
  string
>({
  toolName: "display_graph",
  render: function DisplayGraphUI({ args, result }) {
    const plotType = args?.plot_type || "bar";
    let chartData: BarChartData | LineChartData | PieChartData | undefined;

    if (result) {
      try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        chartData = parsed as BarChartData | LineChartData | PieChartData;
      } catch (e) {
        console.error("Failed to parse graph data:", e);
      }
    }

    const getPlotIcon = (type: string) => {
      switch (type) {
        case "bar":
          return <BarChart3Icon className="size-5 text-blue-600 dark:text-blue-400" />;
        case "line":
          return <LineChartIcon className="size-5 text-green-600 dark:text-green-400" />;
        case "pie":
          return <PieChartIcon className="size-5 text-purple-600 dark:text-purple-400" />;
        default:
          return <BarChart3Icon className="size-5 text-gray-600 dark:text-gray-400" />;
      }
    };

    const renderChart = () => {
      if (!chartData) {
        return (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>グラフデータがありません</p>
          </div>
        );
      }

      if (plotType === "bar") {
        const barData = chartData as BarChartData;
        if (!barData.labels || !barData.values) {
          return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>バーチャートのデータが不完全です</p>
            </div>
          );
        }

        return (
          <Plot
            data={[
              {
                x: barData.labels,
                y: barData.values,
                type: "bar",
                marker: {
                  color: "rgb(59, 130, 246)",
                },
              },
            ]}
            layout={{
              title: barData.title || "Bar Chart",
              xaxis: {
                title: barData.xlabel || "",
              },
              yaxis: {
                title: barData.ylabel || "",
              },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: {
                color: "rgb(107, 114, 128)",
              },
              autosize: true,
              margin: { l: 50, r: 50, t: 50, b: 50 },
            }}
            config={{
              displayModeBar: false,
              responsive: true,
            }}
            style={{ width: "100%", height: "400px" }}
          />
        );
      }

      if (plotType === "line") {
        const lineData = chartData as LineChartData;
        if (!lineData.labels || !lineData.values) {
          return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>ラインチャートのデータが不完全です</p>
            </div>
          );
        }

        return (
          <Plot
            data={[
              {
                x: lineData.labels,
                y: lineData.values,
                type: "scatter",
                mode: "lines+markers",
                marker: {
                  color: "rgb(34, 197, 94)",
                },
                line: {
                  color: "rgb(34, 197, 94)",
                  width: 2,
                },
              },
            ]}
            layout={{
              title: lineData.title || "Line Chart",
              xaxis: {
                title: lineData.xlabel || "",
              },
              yaxis: {
                title: lineData.ylabel || "",
              },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: {
                color: "rgb(107, 114, 128)",
              },
              autosize: true,
              margin: { l: 50, r: 50, t: 50, b: 50 },
            }}
            config={{
              displayModeBar: false,
              responsive: true,
            }}
            style={{ width: "100%", height: "400px" }}
          />
        );
      }

      if (plotType === "pie") {
        const pieData = chartData as PieChartData;
        if (!pieData.labels || !pieData.values) {
          return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>円グラフのデータが不完全です</p>
            </div>
          );
        }

        return (
          <Plot
            data={[
              {
                labels: pieData.labels,
                values: pieData.values,
                type: "pie",
                marker: {
                  colors: [
                    "rgb(147, 51, 234)",
                    "rgb(59, 130, 246)",
                    "rgb(34, 197, 94)",
                    "rgb(251, 146, 60)",
                    "rgb(236, 72, 153)",
                  ],
                },
              },
            ]}
            layout={{
              title: pieData.title || "Pie Chart",
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: {
                color: "rgb(107, 114, 128)",
              },
              autosize: true,
              margin: { l: 50, r: 50, t: 50, b: 50 },
            }}
            config={{
              displayModeBar: false,
              responsive: true,
            }}
            style={{ width: "100%", height: "400px" }}
          />
        );
      }

      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>サポートされていないグラフタイプ: {plotType}</p>
        </div>
      );
    };

    return (
      <div className="mb-4 w-full rounded-lg border bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-4 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getPlotIcon(plotType)}
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {chartData && "title" in chartData && chartData.title
                  ? chartData.title
                  : `${plotType.charAt(0).toUpperCase() + plotType.slice(1)} Chart`}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Plot type: <span className="font-medium">{plotType}</span>
            </p>
          </div>
        </div>

        <div className="w-full bg-white dark:bg-gray-900/50 rounded-lg p-4">
          {renderChart()}
        </div>
      </div>
    );
  },
});

