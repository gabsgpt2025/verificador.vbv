/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.infrastructureLogging = {
        ...(config.infrastructureLogging ?? {}),
        level: "error",
      }
    }

    return config
  },
}

export default nextConfig
