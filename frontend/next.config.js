/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@assistant-ui/react",
    "@assistant-ui/react-langgraph",
    "@assistant-ui/react-markdown",
  ],
  experimental: {
    optimizePackageImports: ["@assistant-ui/react"],
  },
  async rewrites() {
    return [
      {
        source: "/assistant/:path*",
        destination: "http://localhost:8000/assistant/:path*",
      },
    ];
  },
};

export default nextConfig;
