"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { PackageIcon } from "lucide-react";

type SearchProductsToolArgs = {
  query: string;
};

type ProductData = {
  id: number;
  name: string;
  price: number;
  [key: string]: unknown;
};

type SearchProductsToolResult = {
  data: ProductData[];
  columns: string[];
  row_id_key: string;
  description?: string;
};

export const SearchProductsUI = makeAssistantToolUI<
  SearchProductsToolArgs,
  string
>({
  toolName: "search_products",
  render: function SearchProductsUI({ args, result }) {
    // Parse the result if it's a JSON string
    let productsData: SearchProductsToolResult | undefined;

    if (result) {
      try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        productsData = parsed as SearchProductsToolResult;
      } catch (e) {
        console.error("Failed to parse products data:", e);
      }
    }

    const products = productsData?.data || [];
    const columns = productsData?.columns || ["id", "name", "price"];
    const description = productsData?.description || "Products";
    const query = args?.query || "";

    // Format price with currency
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);
    };

    return (
      <div className="mb-4 w-full rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <PackageIcon className="size-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {description}
              </h3>
            </div>
            {query && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search query: <span className="font-medium">"{query}"</span>
              </p>
            )}
          </div>
        </div>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {column === "id" ? "ID" : column === "name" ? "Product Name" : column === "price" ? "Price" : column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                      >
                        {column === "price" ? (
                          <span className="font-semibold text-green-700 dark:text-green-300">
                            {formatPrice(product[column] as number)}
                          </span>
                        ) : (
                          <span>{String(product[column] ?? "")}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <PackageIcon className="size-12 mx-auto mb-2 opacity-50" />
            <p>No products found</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Showing {products.length} product{products.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    );
  },
});
