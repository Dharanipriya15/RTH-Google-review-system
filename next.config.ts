import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Customers opening the root link land directly on the rating page and never
  // see the landing page. The landing page component (src/app/page.tsx) is
  // kept intact, just not reachable at "/".
  async redirects() {
    return [
      {
        source: "/",
        destination: "/review/raades-tea-house",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
