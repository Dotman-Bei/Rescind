/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A separate output folder lets a production build run beside the dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
