export async function getCurrentTimestamp(): Promise<string> {
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

export function formatDateToUserPreference(date: Date, dateFormat: string): string {
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