import "@logseq/libs";

// RSS Feed item interface
interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

// RSS Feed interface
interface RSSFeed {
  title: string;
  link: string;
  description?: string;
  items: RSSItem[];
}

// Parse RSS/XML feed content
async function parseRSSFeed(xmlContent: string): Promise<RSSFeed> {
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

// Fetch RSS feed content from URL
async function fetchRSSFeed(feedUrl: string): Promise<RSSFeed> {
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

async function main() {
  console.log("RSS Feed List plugin loaded");

  // Register slash command
  logseq.Editor.registerSlashCommand("rsslist", async () => {
    try {
      await showRSSInputDialog();
    } catch (error) {
      console.error("Error handling RSS feed addition:", error);
      logseq.UI.showMsg("Failed to add RSS feed", "error");
    }
  });
}

async function showRSSInputDialog() {
  const key = "rss-feed-input-modal";
  
  // Create the UI for input
  logseq.provideUI({
    key,
    path: "body",
    template: `
      <div id="${key}" class="rss-feed-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="background: var(--ls-primary-background-color); padding: 20px; border-radius: 8px; min-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: var(--ls-primary-text-color);">Add RSS Feed</h3>
          <input id="rss-url-input" type="text" placeholder="Enter RSS feed URL (e.g., https://example.com/feed.xml)"
                 style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid var(--ls-border-color); border-radius: 4px; background: var(--ls-secondary-background-color); color: var(--ls-primary-text-color);" />
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
            <button id="rss-cancel-btn" style="padding: 8px 16px; border-radius: 4px; border: 1px solid var(--ls-border-color); background: var(--ls-secondary-background-color); color: var(--ls-primary-text-color); cursor: pointer;">Cancel</button>
            <button id="rss-submit-btn" style="padding: 8px 16px; border-radius: 4px; border: none; background: var(--ls-link-text-color); color: white; cursor: pointer;">Add Feed</button>
          </div>
        </div>
      </div>
    `,
  });

  // Wait a bit for the UI to be rendered
  await new Promise(resolve => setTimeout(resolve, 100));

  const inputEl = parent.document.getElementById("rss-url-input") as HTMLInputElement;
  const submitBtn = parent.document.getElementById("rss-submit-btn");
  const cancelBtn = parent.document.getElementById("rss-cancel-btn");

  if (!inputEl || !submitBtn || !cancelBtn) {
    logseq.UI.showMsg("Failed to show input dialog", "error");
    logseq.provideUI({ key, template: "" });
    return;
  }

  // Focus the input
  inputEl.focus();

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      logseq.provideUI({ key, template: "" });
      resolve();
    };

    const handleSubmit = async () => {
      const feedUrl = inputEl.value.trim();
      cleanup();
      
      if (feedUrl) {
        await handleRSSFeedAddition(feedUrl);
      } else {
        logseq.UI.showMsg("No URL provided", "warning");
      }
    };

    const handleCancel = () => {
      cleanup();
    };

    // Handle submit on button click
    submitBtn.addEventListener("click", handleSubmit);
    
    // Handle cancel on button click
    cancelBtn.addEventListener("click", handleCancel);
    
    // Handle Enter key
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    });
  });
}

async function handleRSSFeedAddition(feedUrl: string) {
  try {
    const cleanUrl = feedUrl.trim();
    
    // Validate URL
    try {
      new URL(cleanUrl);
    } catch {
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

async function getCurrentTimestamp(): Promise<string> {
  try {
    // Get user's date format preference from Logseq settings
    const userConfigs = await logseq.App.getUserConfigs();
    const dateFormat = userConfigs?.preferredDateFormat || "yyyy-MM-dd";
    
    const now = new Date();
    
    // Format date according to user's preference
    return formatDateToUserPreference(now, dateFormat);
  } catch (error) {
    console.warn("Could not get user date format, using fallback:", error);
    // Fallback to ISO format
    const now = new Date();
    return formatDateToUserPreference(now, "yyyy-MM-dd");
  }
}

function formatDateToUserPreference(date: Date, dateFormat: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Map Logseq date format tokens to actual formatting
  switch (dateFormat) {
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'yyyy/MM/dd':
      return `${year}/${month}/${day}`;
    case 'MM-dd-yyyy':
      return `${month}-${day}-${year}`;
    case 'dd-MM-yyyy':
      return `${day}-${month}-${year}`;
    case 'dd.MM.yyyy':
      return `${day}.${month}.${year}`;
    case 'yyyy.MM.dd':
      return `${year}.${month}.${day}`;
    case 'yyyyMMdd':
      return `${year}${month}${day}`;
    case 'ddMMyyyy':
      return `${day}${month}${year}`;
    case 'MMddyyyy':
      return `${month}${day}${year}`;
    default:
      // Fallback to ISO format
      return `${year}-${month}-${day}`;
  }
}

async function insertRSSEntry(rssEntry: string): Promise<any> {
  try {
    // Get the current page/block where user is editing
    const currentBlock = await logseq.Editor.getCurrentBlock();
    
    if (currentBlock) {
      // Insert as a sibling block after current block
      const result = await logseq.Editor.insertBlock(currentBlock.uuid, rssEntry, {
        sibling: true
      });
      return result;
    } else {
      // If no current block, insert at the beginning of the current page
      const currentPage = await logseq.Editor.getCurrentPage();
      if (currentPage) {
        const result = await logseq.Editor.prependBlockInPage(currentPage.uuid, rssEntry);
        return result;
      } else {
        // Last resort: insert at editing cursor
        const result = await logseq.Editor.insertAtEditingCursor(rssEntry);
        return result;
      }
    }
  } catch (error) {
    console.error("Error inserting RSS entry:", error);
    throw new Error("Failed to insert RSS entry into graph");
  }
}

// Utility function to validate RSS URL (basic check)
function isValidRSSUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Basic checks for common RSS/feed indicators
    const validExtensions = ['.rss', '.xml', '.atom', '.feed'];
    const validPaths = ['/rss', '/feed', '/feeds', '/atom'];
    
    const pathname = urlObj.pathname.toLowerCase();
    
    return validExtensions.some(ext => pathname.endsWith(ext)) ||
           validPaths.some(path => pathname.includes(path));
  } catch {
    return false;
  }
}

logseq.ready(main).catch(console.error);