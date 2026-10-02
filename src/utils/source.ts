/**
 * Safe helper to extract a display name from any source representation.
 * Handles undefined, string, or { name: string, icon?: string } object.
 */
export function getSourceName(source: unknown, fallback = 'News Wire'): string {
  if (!source) return fallback;
  if (typeof source === 'string') return source.trim() || fallback;
  if (typeof source === 'object' && source !== null) {
    const s = source as Record<string, unknown>;
    if (typeof s.name === 'string' && s.name.trim().length > 0) {
      return s.name.trim();
    }
  }
  return fallback;
}

/**
 * Safe helper to extract a display url from any source/article representation.
 */
export function getSourceUrl(sourceOrArticle: unknown, fallback = '#'): string {
  if (!sourceOrArticle) return fallback;
  if (typeof sourceOrArticle === 'string') return sourceOrArticle.trim() || fallback;
  if (typeof sourceOrArticle === 'object' && sourceOrArticle !== null) {
    const s = sourceOrArticle as Record<string, unknown>;
    if (typeof s.url === 'string' && s.url.trim().length > 0) {
      return s.url.trim();
    }
    if (typeof s.link === 'string' && s.link.trim().length > 0) {
      return s.link.trim();
    }
  }
  return fallback;
}
