/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side polyfills
      config.resolve = {
        ...config.resolve,
        fallback: {
          fs: false,
          path: false,
          crypto: false,
          stream: false,
          canvas: false,
          net: false,
          tls: false,
          child_process: false
        }
      };
    }
    return config;
  }
};

module.exports = nextConfig;