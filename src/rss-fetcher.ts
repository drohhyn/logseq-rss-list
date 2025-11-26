import { RSSFeed } from './types/rss';
import { parseRSSFeed } from './rss-parser';

// Fetch RSS feed content from URL
export async function fetchRSSFeed(feedUrl: string): Promise<RSSFeed> {
  try {
    // Add cache-busting timestamp and headers to ensure fresh content
    const cacheBusterUrl = `${feedUrl}${feedUrl.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
    
    const response = await fetch(cacheBusterUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlContent = await response.text();
    
    return await parseRSSFeed(xmlContent);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error(`CORS error: Unable to fetch RSS feed directly. Please try a different feed URL or check if the feed supports CORS.`);
    }
    throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : 'Network error'}`);
  }
}