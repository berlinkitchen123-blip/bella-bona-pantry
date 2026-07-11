// Catalog images are either:
//   - external URLs (http/https) → resize via weserv.nl CDN proxy
//   - base64 data URIs (data:image/...) → use directly; CDN can't fetch these
export function thumbnailUrl(url: string, size = 200): string {
    if (!url || url.startsWith('data:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${size}&h=${size}&fit=cover&q=75`;
}
