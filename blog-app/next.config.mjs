/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.pexels.com" },
    ],
  },
  async redirects() {
    return [
      // Preserve historical GHL URLs: /post/<slug> -> /<slug>
      { source: "/post/:slug", destination: "/:slug", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
