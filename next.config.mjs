/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "securesurv.pythonanywhere.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      // Fixed localhost entry
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000", // Required because your backend is on 8000
        pathname: "/**", // Allows /faces/, /media/, etc.
      },
    ],
  },
}

export default nextConfig