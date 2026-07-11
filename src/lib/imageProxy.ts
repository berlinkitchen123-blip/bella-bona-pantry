// Catalog images come from Google/Unsplash search results at whatever resolution the
// source happens to be — often multiple MB. images.weserv.nl resizes on the fly so the
// grid downloads a small crop instead of the full-size original.
export function thumbnailUrl(url: string, size = 200): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${size}&h=${size}&fit=cover&q=75`;
}
