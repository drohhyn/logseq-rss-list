import { fetchRSSFeed } from './rss-fetcher';
import { insertRSSEntry } from './block-utils';
import { getCurrentTimestamp } from './date-utils';
import { isValidUrl } from './validation';
import { RSSFeed } from './types';

// RSS feed addition handler - main business logic
export async function handleRSSFeedAddition(feedUrl: string) {
  try {
    const cleanUrl = feedUrl.trim();
    
    // Validate URL
    if (!isValidUrl(cleanUrl)) {
      logseq.UI.showMsg("Invalid URL format", "error");
      return;
    }

    logseq.UI.showMsg("Fetching RSS feed...", "info");
    
    // Fetch and parse RSS feed
    const rssFeed = await fetchRSSFeed(cleanUrl);
    
    // Get current timestamp in user's preferred format
    const timestamp = await getCurrentTimestamp();
    
    // Create the main feed block with channel title as link to the feed URL
    const mainFeedBlock = `[${rssFeed.title}](${cleanUrl}) (added: ${timestamp})`;
    
    // Insert the main feed block into the graph
    const mainBlock = await insertRSSEntry(mainFeedBlock);
    
    // Create nested blocks for each feed item
    if (mainBlock && rssFeed.items.length > 0) {
      // Get the UUID from the main block
      const mainBlockUuid = mainBlock.uuid || mainBlock;
      
      for (const item of rssFeed.items) {
        const itemBlockContent = `[${item.title}](${item.link})`;
        
        try {
          await logseq.Editor.insertBlock(mainBlockUuid, itemBlockContent, {
            properties: {
              pubDate: item.pubDate || null
            }
          });
        } catch (error) {
          console.warn("Failed to insert feed item block:", item.title, error);
        }
      }
      
      // Add an empty line after all items to move cursor to next line (at same level as main feed block)
      try {
        await logseq.Editor.insertBlock(mainBlockUuid, "", {
          sibling: true
        });
      } catch (error) {
        console.warn("Failed to add empty line:", error);
      }
    }
    
    logseq.UI.showMsg(`RSS feed "${rssFeed.title}" added with ${rssFeed.items.length} items!`, "success");
    
  } catch (error) {
    console.error("Error in handleRSSFeedAddition:", error);
    if (error instanceof Error && error.message !== "Input cancelled") {
      logseq.UI.showMsg(`Failed to add RSS feed: ${error.message}`, "error");
    }
  }
}