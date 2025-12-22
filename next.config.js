/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/holymoley',
    assetPrefix: '/holymoley/',
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
