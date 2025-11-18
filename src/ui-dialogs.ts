import "@logseq/libs";
import { handleRSSFeedAddition } from './rss-handler';

export async function showRSSInputDialog(): Promise<void> {
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