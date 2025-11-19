import "@logseq/libs";
import { showRSSInputDialog } from './ui-dialogs';
import { handleRSSFeedReload } from './rss-handler';

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

  // Register command palette command
  logseq.App.registerUIItem('toolbar', {
    key: 'rss-reload-toolbar',
    template: `
      <button id="rss-toolbar-reload" style="
        background: none;
        border: none;
        color: var(--ls-link-text-color);
        cursor: pointer;
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      " title="Reload RSS feeds on current page">
        🔄
      </button>
    `
  });

  // Register command palette command
  logseq.App.registerCommand('rss-reload-current-page', {
    key: 'rss-reload-current-page',
    label: 'RSS: Reload feeds on current page'
  }, async () => {
    await handlePageRSSReload();
  });


  // Add event listener for toolbar button
  setTimeout(() => {
    const toolbarBtn = parent.document.getElementById("rss-toolbar-reload");
    if (toolbarBtn) {
      toolbarBtn.addEventListener("click", handlePageRSSReload);
    }
  }, 1000);
}


// Handle reload of RSS feeds on current page
async function handlePageRSSReload() {
  try {
    const currentPage = await logseq.Editor.getCurrentPage();
    if (!currentPage) {
      logseq.UI.showMsg("No active page found", "warning");
      return;
    }

    // Handle both page object and page name
    let pageName: string;
    if (typeof currentPage === 'string') {
      pageName = currentPage;
    } else if (currentPage && typeof currentPage === 'object' && 'name' in currentPage) {
      pageName = (currentPage as any).name;
    } else {
      logseq.UI.showMsg("Invalid page format", "error");
      return;
    }

    // Get all blocks on current page
    const blocks = await logseq.Editor.getPageBlocksTree(pageName);
    
    // Find RSS feed blocks by looking for blocks with data-rss-url attribute
    const rssBlocks = findRSSBlocks(blocks);
    
    if (rssBlocks.length === 0) {
      logseq.UI.showMsg("No RSS feeds found on this page", "info");
      return;
    }

    logseq.UI.showMsg(`Reloading ${rssBlocks.length} RSS feed(s)...`, "info");
    
    let successCount = 0;
    let errorCount = 0;

    for (const block of rssBlocks) {
      try {
        // Extract RSS URL from block content
        const rssUrl = extractRSSUrlFromBlock(block);
        if (rssUrl) {
          await handleRSSFeedReload(rssUrl);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to reload RSS feed from block:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      logseq.UI.showMsg(`Successfully reloaded ${successCount} RSS feed(s)`, "success");
    }
    if (errorCount > 0) {
      logseq.UI.showMsg(`Failed to reload ${errorCount} RSS feed(s)`, "error");
    }

  } catch (error) {
    console.error("Error reloading RSS feeds:", error);
    logseq.UI.showMsg("Failed to reload RSS feeds", "error");
  }
}

// Recursively find blocks containing RSS feed data
function findRSSBlocks(blocks: any[]): any[] {
  const rssBlocks: any[] = [];
  
  function traverse(block: any) {
    // Check if this block contains RSS feed data
    if (block.content && block.content.includes('data-rss-url')) {
      rssBlocks.push(block);
    }
    
    // Check child blocks
    if (block.children && block.children.length > 0) {
      block.children.forEach(traverse);
    }
  }
  
  blocks.forEach(traverse);
  return rssBlocks;
}

// Extract RSS URL from block content
function extractRSSUrlFromBlock(block: any): string | null {
  try {
    // Look for data-rss-url in the block content
    const match = block.content.match(/data-rss-url="([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Alternative: extract URL from the main feed block link
    const urlMatch = block.content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
    if (urlMatch && urlMatch[2]) {
      return urlMatch[2];
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting RSS URL from block:", error);
    return null;
  }
}



logseq.ready(main).catch(console.error);