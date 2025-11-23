# Wiki Editor Chrome Extension

Chrome extension for quickly editing GitHub Pages wiki.

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder

### Usage

1. Click the extension icon
2. Select a file (todo, tenets, strategy, constitution)
3. Enter content
4. Click "追加" to add

### Features

- Quick memo addition
- File selection
- Recent history
- Right-click context menu (select text → "Wikiに追加")

## Configuration

Edit `popup.js` to set your API endpoint:

```javascript
const API_ENDPOINT = 'https://your-backend.vercel.app/api';
const API_KEY = 'your-api-key';
```

## Build for Production

```bash
# Create zip for Chrome Web Store
zip -r wiki-editor.zip . -x "*.git*" "node_modules/*"
```

## Icons

Place icon files in `icons/` folder:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)
