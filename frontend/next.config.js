/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable WebRTC and camera access
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, geolocation=*, gyroscope=*, accelerometer=*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

