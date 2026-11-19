/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*" }],
  },
};

export default nextConfig;
