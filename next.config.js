/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
    output: 'export',
    basePath: isGithubActions ? '/holymoley' : '',
    assetPrefix: isGithubActions ? '/holymoley/' : '',
    images: {
        unoptimized: true,
    },
    env: {
        NEXT_PUBLIC_BASE_PATH: isGithubActions ? '/holymoley' : '',
    },
};

module.exports = nextConfig;
