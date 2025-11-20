// RSS Feed item interface
export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

// RSS Feed interface
export interface RSSFeed {
  title: string;
  link: string;
  description?: string;
  items: RSSItem[];
}