import { getJson } from 'serpapi';
import type { NewsItem, Category } from '../src/types/news.js';

// Default user key provided for SerpNews
const DEFAULT_KEY = '5f46046abd773a2cbeed710ebfe0bdcb309b30736770fa266d7d731c920c2d05';

/**
 * Clean and unquote API key in case of surrounding quotes or whitespace
 */
export function getSanitizedSerpApiKey(): string {
  const raw = process.env.SERPAPI_API_KEY || DEFAULT_KEY;
  const cleaned = raw.replace(/^["'\s]+|["'\s]+$/g, '').trim();
  return cleaned || DEFAULT_KEY;
}

interface SerpApiNewsResult {
  title?: string;
  link?: string;
  source?: {
    name?: string;
    icon?: string;
  } | string;
  date?: string;
  snippet?: string;
  thumbnail?: string;
  stories?: Array<{
    title?: string;
    link?: string;
    source?: { name?: string; icon?: string } | string;
    date?: string;
    snippet?: string;
  }>;
}

export function isSerpApiConfigured(): boolean {
  const key = getSanitizedSerpApiKey();
  return Boolean(key.length > 10 && !key.includes('MY_SERPAPI_API_KEY'));
}

/**
 * Fetch news from SerpAPI using the official getJson({ engine: 'google_news', ... }) API
 */
export async function fetchSerpApiNews(query: string, category: Category = 'All'): Promise<NewsItem[]> {
  const apiKey = getSanitizedSerpApiKey();
  if (!apiKey || apiKey.includes('MY_SERPAPI_API_KEY')) {
    return [];
  }

  const searchQuery = query || (
    category === 'India' ? 'India national news' :
    category === 'Trending' ? 'top news headlines' :
    category === 'All' ? 'top breaking news' :
    `${category} news`
  );

  const glParam = category === 'India' ? 'in' : 'us';

  try {
    console.log(`[SerpAPI] Querying engine="google_news" for q="${searchQuery}" (gl=${glParam}) using official SDK...`);
    
    // Call the official getJson SDK method
    const data: any = await getJson({
      engine: 'google_news',
      q: searchQuery,
      api_key: apiKey,
      hl: 'en',
      gl: glParam,
    });

    if (data.error) {
      console.warn(`[SerpAPI] Warning response from SerpAPI: ${data.error}`);
      return [];
    }

    const results: SerpApiNewsResult[] = data.news_results || [];
    const items: NewsItem[] = [];
    const nowIso = new Date().toISOString();

    for (const r of results.slice(0, 20)) {
      if (!r.title || !r.link) continue;

      const sourceName = typeof r.source === 'string' ? r.source : r.source?.name || 'News Source';
      const sourceIcon = typeof r.source === 'object' ? r.source?.icon : undefined;

      items.push({
        id: 'serp_' + Math.random().toString(36).substring(2, 10),
        headline: r.title,
        source: {
          name: sourceName,
          icon: sourceIcon,
        },
        url: r.link,
        publishedAt: r.date || 'Recent',
        category,
        snippet: r.snippet || r.title,
        aiSummary: r.snippet ? `Key Report: ${r.snippet}` : r.title,
        verificationStatus: 'verified',
        statusReason: `Live report retrieved via SerpAPI from ${sourceName}.`,
        fetchedAt: nowIso,
      });

      // Also process sub-stories if present in SerpAPI cluster
      if (r.stories && Array.isArray(r.stories)) {
        for (const sub of r.stories.slice(0, 2)) {
          if (!sub.title || !sub.link) continue;
          const subSourceName = typeof sub.source === 'string' ? sub.source : sub.source?.name || sourceName;
          items.push({
            id: 'serp_sub_' + Math.random().toString(36).substring(2, 10),
            headline: sub.title,
            source: { name: subSourceName },
            url: sub.link,
            publishedAt: sub.date || r.date || 'Recent',
            category,
            snippet: sub.snippet || sub.title,
            aiSummary: sub.snippet || sub.title,
            verificationStatus: 'verified',
            statusReason: `Corroborated reporting from ${subSourceName}.`,
            fetchedAt: nowIso,
          });
        }
      }
    }

    console.log(`[SerpAPI] Successfully fetched and processed ${items.length} live articles from SerpAPI Google News engine.`);
    return items;
  } catch (error) {
    console.error('[SerpAPI] Error fetching news via SerpAPI SDK:', error);
    return [];
  }
}
