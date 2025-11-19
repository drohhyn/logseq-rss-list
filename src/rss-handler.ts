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
    const mainFeedBlock = `[${rssFeed.title}](${cleanUrl}) <span style="font-size: 0.8em; color: var(--ls-secondary-text-color);" data-rss-url="${cleanUrl}">⏳ ${timestamp}</span>`;
    
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

// RSS feed reload handler - reloads an existing RSS feed
export async function handleRSSFeedReload(feedUrl: string) {
  try {
    const cleanUrl = feedUrl.trim();
    
    // Validate URL
    if (!isValidUrl(cleanUrl)) {
      throw new Error("Invalid URL format");
    }

    console.log(`Reloading RSS feed: ${cleanUrl}`);
    
    // Fetch and parse RSS feed
    const rssFeed = await fetchRSSFeed(cleanUrl);
    
    // Get current timestamp in user's preferred format
    const timestamp = await getCurrentTimestamp();
    
    // Find existing feed blocks on current page
    const currentPage = await logseq.Editor.getCurrentPage();
    if (!currentPage) {
      throw new Error("No active page found");
    }

    // Handle both page object and page name
    let pageName: string;
    if (typeof currentPage === 'string') {
      pageName = currentPage;
    } else if (currentPage && typeof currentPage === 'object' && 'name' in currentPage) {
      pageName = (currentPage as any).name;
    } else {
      throw new Error("Invalid page format");
    }

    const blocks = await logseq.Editor.getPageBlocksTree(pageName);
    const feedBlocks = findFeedBlocksByUrl(blocks, cleanUrl);
    
    if (feedBlocks.length === 0) {
      throw new Error("RSS feed block not found on current page");
    }

    // Update the main feed block with new timestamp
    const mainFeedBlock = feedBlocks[0];
    const updatedMainBlock = `[${rssFeed.title}](${cleanUrl}) <span style="font-size: 0.8em; color: var(--ls-secondary-text-color);" data-rss-url="${cleanUrl}">⏳ ${timestamp}</span>`;
    
    await logseq.Editor.updateBlock(mainFeedBlock.uuid, updatedMainBlock);
    
    // Remove all existing item blocks
    if (mainFeedBlock.children && mainFeedBlock.children.length > 0) {
      // Remove all child blocks (RSS items)
      for (let i = mainFeedBlock.children.length - 1; i >= 0; i--) {
        const child = mainFeedBlock.children[i];
        if (child && child.uuid) {
          try {
            await logseq.Editor.delete(child.uuid);
          } catch (error) {
            console.warn("Failed to delete old feed item block:", error);
          }
        }
      }
    }
    
    // Add new feed items
    const mainBlockUuid = mainFeedBlock.uuid;
    if (rssFeed.items.length > 0) {
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
    }
    
    console.log(`RSS feed "${rssFeed.title}" reloaded with ${rssFeed.items.length} items`);
    
  } catch (error) {
    console.error("Error in handleRSSFeedReload:", error);
    throw error;
  }
}

// Helper function to find feed blocks by URL
function findFeedBlocksByUrl(blocks: any[], feedUrl: string): any[] {
  const foundBlocks: any[] = [];
  
  function traverse(block: any) {
    // Check if this block contains the feed URL
    if (block.content &&
        (block.content.includes(`](${feedUrl})`) ||
         block.content.includes(`data-rss-url="${feedUrl}"`))) {
      foundBlocks.push(block);
    }
    
    // Check child blocks
    if (block.children && block.children.length > 0) {
      block.children.forEach(traverse);
    }
  }
  
  if (blocks) {
    blocks.forEach(traverse);
  }
  
  return foundBlocks;
}