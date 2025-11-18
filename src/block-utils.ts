export async function insertRSSEntry(rssEntry: string): Promise<any> {
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