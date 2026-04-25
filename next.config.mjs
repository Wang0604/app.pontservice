/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    instrumentationHook: true,
    // 让 Next.js 不去打包这些原生 / WASM 依赖，运行时直接从 node_modules require
    serverComponentsExternalPackages: ['@electric-sql/pglite', 'postgres'],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'nodejs') {
      config.externals = [
        ...(config.externals || []),
        '@electric-sql/pglite',
      ];
    }
    // Edge runtime 没法用 node 内置模块。我们的 instrumentation 在
    // process.env.NEXT_RUNTIME !== 'nodejs' 时 return，所以 edge 端的引用其实
    // 永远不会执行；但 webpack 静态分析仍要求能 resolve。给个 false 让它把
    // 这些 native 模块替换成空模块。
    if (nextRuntime === 'edge') {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        os: false,
        perf_hooks: false,
        events: false,
        zlib: false,
        '@electric-sql/pglite': false,
        postgres: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
  },
};

export default nextConfig;
