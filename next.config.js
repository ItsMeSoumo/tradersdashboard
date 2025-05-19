/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Use the default output mode instead of standalone
  // output: 'standalone',
  distDir: '.next',
  // Ensure routes manifest is generated correctly
  experimental: {
    // These settings help with proper route manifest generation
    serverComponentsExternalPackages: [],
    appDir: true,
  },
  // Add any environment variables you need here
  env: {
    // Add your environment variables here if needed
  },
  // This ensures that Next.js generates the routes-manifest.json file
  generateBuildId: async () => {
    return 'my-build-id'
  },
}

module.exports = nextConfig
