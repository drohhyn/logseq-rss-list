# Logseq RSS List Plugin

A modern Logseq plugin to fetch and display RSS feed entries as linked lists in your notes.

## Purpose

This plugin integrates RSS feed consumption directly into your Logseq workflow. Simply enter any RSS feed URL and the plugin will parse and display the entries as clickable links in your current page, making it easy to reference and track content from your favorite sources.

## Usage

1. Open any page in Logseq
2. Type `/rsslist` in the editor to activate the slash command
3. Enter the RSS feed URL when prompted
4. The plugin will fetch and display recent (20) entries as clickable links
5. Reload the entries of feeds in the current page from the toolbar

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) package manager

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Building

Build the plugin for production:
```bash
pnpm build
```

The built files will be available in the `dist/` directory.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Credits

- **Original Author**: drohhyn
- **Plugin Icon**: Original by [Tabler Icons](https://tabler.io/icons), colors modified.
- **UI Icons**: Influenced by [Tabler Icons](https://tabler.io/icons).
