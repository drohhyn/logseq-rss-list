import "@logseq/libs";

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

    // Get current timestamp in user's preferred format
    const timestamp = await getCurrentTimestamp();
    
    // Create RSS entry block content
    const rssEntry = `[[RSS Feed]] ${cleanUrl} (added: ${timestamp})`;
    
    // Insert the block into the graph
    await insertRSSEntry(rssEntry);
    
    logseq.UI.showMsg("RSS feed added successfully!", "success");
    
  } catch (error) {
    console.error("Error in handleRSSFeedAddition:", error);
    if (error instanceof Error && error.message !== "Input cancelled") {
      logseq.UI.showMsg("Failed to add RSS feed", "error");
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

async function insertRSSEntry(rssEntry: string): Promise<void> {
  try {
    // Get the current page/block where user is editing
    const currentBlock = await logseq.Editor.getCurrentBlock();
    
    if (currentBlock) {
      // Insert as a sibling block after current block
      await logseq.Editor.insertBlock(currentBlock.uuid, rssEntry, {
        sibling: true
      });
    } else {
      // If no current block, insert at the beginning of the current page
      const currentPage = await logseq.Editor.getCurrentPage();
      if (currentPage) {
        await logseq.Editor.prependBlockInPage(currentPage.uuid, rssEntry);
      } else {
        // Last resort: insert at editing cursor
        await logseq.Editor.insertAtEditingCursor(rssEntry);
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