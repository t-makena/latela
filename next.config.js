/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_APP_NAME: 'Latela',
  },
}

module.exports = nextConfig