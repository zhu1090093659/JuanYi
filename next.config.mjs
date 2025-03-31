/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // 添加这些属性避免buildId和deploymentId未定义错误
  generateBuildId: async () => {
    return 'my-build-id'
  },
  // 设置一个deploymentId值
  env: {
    NEXT_DEPLOYMENT_ID: 'my-deployment-id'
  }
}

export default nextConfig
