/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
    output: 'export',
    basePath: isGithubActions ? '/holymoley' : '',
    assetPrefix: isGithubActions ? '/holymoley/' : '',
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
