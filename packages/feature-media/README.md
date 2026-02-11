# Media Library (Nuxt Studio Style)

OpenPress Media Library provides a unified interface for asset management. It supports multiple drivers (local filesystem by default) and deep integration with the Visual Editor.

## Features
- **File Explorer**: Browse, search, and organize assets.
- **Unified API**: Abstracted media operations (`get`, `upload`, `delete`).
- **Driver System**: 
  - `local`: Store assets in `public/_openpress/media` (Git-tracked).
  - `cloudinary`: (Planned) Seamless cloud integration.

## Usage in Components
Assets are resolved via their path or ID:

```vue
<OpImage src="/_openpress/media/hero.jpg" alt="Hero Image" />
```

## Editor Integration
When editing a block with an image field, the Media Picker overlay allows:
1. Selecting an existing asset.
2. Drag-and-dropping new files to upload.
3. Automatic metadata extraction (size, format).
