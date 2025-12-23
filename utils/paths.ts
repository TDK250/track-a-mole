export const getAssetPath = (path: string): string => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${normalizedPath}`;
};
