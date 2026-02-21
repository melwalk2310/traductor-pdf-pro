/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  serverExternalPackages: ["pdf-parse", "pdf-lib", "epub-gen-memory"],
};

export default nextConfig;
