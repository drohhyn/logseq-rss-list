// Utility function to validate RSS URL (basic check)
export function isValidRSSUrl(url: string): boolean {
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

// Utility function to validate URL format
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}