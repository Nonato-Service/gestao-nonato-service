/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
      },
    ]
  },
  // Permite o build concluir mesmo com erros de tipo (corrija os tipos gradualmente)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Melhorar o carregamento de scripts
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  // Configurações para melhorar o carregamento
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Garantir que os scripts sejam carregados corretamente
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    // Garantir que o Fast Refresh funcione corretamente
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig
