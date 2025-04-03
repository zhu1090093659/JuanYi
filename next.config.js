/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // 只在客户端构建时处理canvas和pdf.js
    if (!isServer) {
      // 处理canvas模块错误
      config.resolve.alias.canvas = false;

      // 处理pdf.js相关模块
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
      
      // 特殊处理一些需要在浏览器中运行的模块
      config.resolve.alias['fs'] = false;
      config.resolve.alias['path'] = false;
    } else {
      // 在服务器端完全跳过pdf.js的导入
      config.resolve.alias['pdfjs-dist'] = false;
      config.resolve.alias['react-pdf'] = false;
    }

    return config;
  },
  // 禁用服务器端的图像优化（可能会引起额外问题）
  images: {
    unoptimized: true
  },
  // 配置特定的文件导入处理
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
        ],
      },
    ]
  },
  typescript: {
    // !! WARN !!
    // 临时禁用类型检查以解决 Next.js 15.2.x 的类型问题
    // 这是一个临时解决方案，应该在 Next.js 修复这个问题后移除
    ignoreBuildErrors: true,
  },
  // 为Cloudflare Pages配置输出
  output: 'standalone',
};

module.exports = nextConfig;
