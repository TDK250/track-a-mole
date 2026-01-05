/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
    output: 'export',
    basePath: isGithubActions ? '/track-a-mole' : '',
    assetPrefix: isGithubActions ? '/track-a-mole/' : '',
    images: {
        unoptimized: true,
    },
    env: {
        NEXT_PUBLIC_BASE_PATH: isGithubActions ? '/track-a-mole' : '',
    },
};

module.exports = nextConfig;
