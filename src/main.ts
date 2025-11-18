import "@logseq/libs";
import { showRSSInputDialog } from './ui-dialogs';

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

logseq.ready(main).catch(console.error);