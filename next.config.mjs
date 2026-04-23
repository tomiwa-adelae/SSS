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
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/vi/**",
      },
    ],
  },
}

export default nextConfig
