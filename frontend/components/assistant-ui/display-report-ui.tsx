"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DisplayReportToolArgs = Record<string, never>;

type DisplayReportResult = {
  images_base64: string[];
  analysis_report?: string;
};

export const DisplayReportUI = makeAssistantToolUI<
  DisplayReportToolArgs,
  string
>({
  toolName: "display_report",
  render: function DisplayReportUI({ args, result }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    let reportData: DisplayReportResult | undefined;

    if (result) {
      try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        reportData = parsed as DisplayReportResult;
      } catch (e) {
        console.error("Failed to parse report data:", e);
      }
    }

    const images = reportData?.images_base64 || [];
    const analysisReport = reportData?.analysis_report || "";

    const totalImages = images.length;
    const hasMultipleImages = totalImages > 1;

    const goToPreviousImage = () => {
      setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    };

    const goToNextImage = () => {
      setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    };

    const currentImage = images[currentImageIndex];
    const imageUrl = currentImage
      ? `data:image/png;base64,${currentImage}`
      : null;

    return (
      <div className="mb-4 w-full rounded-lg border bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-4 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileTextIcon className="size-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Analysis Report
              </h3>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        {totalImages > 0 && (
          <div className="mb-4 w-full bg-white dark:bg-gray-900/50 rounded-lg p-4">
            <div className="relative">
              {/* Image Container */}
              <div className="relative w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden min-h-[400px]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Report image ${currentImageIndex + 1} of ${totalImages}`}
                    className="max-w-full max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>画像を読み込めませんでした</p>
                  </div>
                )}

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={goToPreviousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 shadow-lg transition-all hover:scale-110 z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="size-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 shadow-lg transition-all hover:scale-110 z-10"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="size-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </>
                )}
              </div>

              {/* Image Counter */}
              {hasMultipleImages && (
                <div className="mt-3 text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentImageIndex + 1} / {totalImages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Report (Markdown) */}
        {analysisReport && (
          <div className="w-full bg-white dark:bg-gray-900/50 rounded-lg p-4">
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ className, ...props }) => (
                    <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100" {...props} />
                  ),
                  h2: ({ className, ...props }) => (
                    <h2 className="mb-3 mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100" {...props} />
                  ),
                  h3: ({ className, ...props }) => (
                    <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100" {...props} />
                  ),
                  p: ({ className, ...props }) => (
                    <p className="mb-4 text-gray-700 dark:text-gray-300 leading-7" {...props} />
                  ),
                  ul: ({ className, ...props }) => (
                    <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300" {...props} />
                  ),
                  ol: ({ className, ...props }) => (
                    <ol className="mb-4 ml-6 list-decimal text-gray-700 dark:text-gray-300" {...props} />
                  ),
                  li: ({ className, ...props }) => (
                    <li className="mt-2 text-gray-700 dark:text-gray-300" {...props} />
                  ),
                  code: ({ className, ...props }) => (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...props} />
                  ),
                  pre: ({ className, ...props }) => (
                    <pre className="mb-4 overflow-x-auto bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm" {...props} />
                  ),
                  blockquote: ({ className, ...props }) => (
                    <blockquote className="mb-4 border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400" {...props} />
                  ),
                  a: ({ className, ...props }) => (
                    <a className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300" {...props} />
                  ),
                }}
              >
                {analysisReport}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {totalImages === 0 && !analysisReport && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>レポートデータがありません</p>
          </div>
        )}
      </div>
    );
  },
});

