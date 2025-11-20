import { RSSFeed, RSSItem } from './types/rss';

// Parse RSS/XML feed content
export async function parseRSSFeed(xmlContent: string): Promise<RSSFeed> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        reject(new Error("Invalid XML/RSS format"));
        return;
      }

      // Handle different RSS formats (RSS 2.0, Atom, etc.)
      let channelTitle = "";
      let channelLink = "";
      let channelDescription = "";
      let items: RSSItem[] = [];

      // Try RSS 2.0 format first
      const channel = xmlDoc.querySelector("channel");
      if (channel) {
        const titleElement = channel.querySelector("title");
        const linkElement = channel.querySelector("link");
        const descriptionElement = channel.querySelector("description");
        
        channelTitle = titleElement?.textContent?.trim() || "";
        channelLink = linkElement?.textContent?.trim() || "";
        channelDescription = descriptionElement?.textContent?.trim() || "";

        // Parse items
        const itemElements = channel.querySelectorAll("item");
        items = Array.from(itemElements).map(item => {
          const title = item.querySelector("title")?.textContent?.trim() || "";
          const link = item.querySelector("link")?.textContent?.trim() || "";
          const description = item.querySelector("description")?.textContent?.trim();
          const pubDate = item.querySelector("pubDate")?.textContent?.trim();
          const guid = item.querySelector("guid")?.textContent?.trim();
          
          return {
            title,
            link,
            description,
            pubDate,
            guid
          };
        });
      } else {
        // Try Atom format
        const feedTitle = xmlDoc.querySelector("feed > title");
        const feedLink = xmlDoc.querySelector("feed > link[href]");
        const feedDescription = xmlDoc.querySelector("feed > subtitle");
        
        channelTitle = feedTitle?.textContent?.trim() || "";
        channelLink = feedLink?.getAttribute("href") || "";
        channelDescription = feedDescription?.textContent?.trim() || "";

        // Parse Atom entries
        const entryElements = xmlDoc.querySelectorAll("entry");
        items = Array.from(entryElements).map(entry => {
          const title = entry.querySelector("title")?.textContent?.trim() || "";
          const linkElement = entry.querySelector("link[href]");
          const link = linkElement?.getAttribute("href") || "";
          const description = entry.querySelector("summary")?.textContent?.trim() ||
                            entry.querySelector("content")?.textContent?.trim();
          const pubDate = entry.querySelector("published")?.textContent?.trim() ||
                         entry.querySelector("updated")?.textContent?.trim();
          const guid = entry.querySelector("id")?.textContent?.trim();
          
          return {
            title,
            link,
            description,
            pubDate,
            guid
          };
        });
      }

      // Filter out empty titles and links
      const validItems = items.filter(item => item.title && item.link);

      resolve({
        title: channelTitle || "RSS Feed",
        link: channelLink,
        description: channelDescription,
        items: validItems.slice(0, 20) // Limit to 20 items for performance
      });
      
    } catch (error) {
      reject(new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}