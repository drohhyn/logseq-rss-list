import { RSSFeed } from './types';
import { parseRSSFeed } from './rss-parser';

// Fetch RSS feed content from URL
export async function fetchRSSFeed(feedUrl: string): Promise<RSSFeed> {
  try {
    // Try fetching directly first
    const response = await fetch(feedUrl);
    
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