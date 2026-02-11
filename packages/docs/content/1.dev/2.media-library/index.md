---
title: Media Library
description: Unified asset management for OpenPress with deep editor integration.
---

The OpenPress Media Library provides a central hub for managing all your digital assets. It's designed to be driver-agnostic, supporting local storage by default while allowing for cloud integrations like Cloudinary.

## Features

- **Unified Interface**: A consistent API for file operations across different storage backends.
- **Visual Explorer**: Integrated file browser for the OpenPress Editor.
- **Smart Uploads**: Drag-and-drop support with automatic metadata extraction.
- **Driver System**: Pluggable architecture for diverse storage needs.

## Driver System

OpenPress uses a driver-based approach for media storage.

### Local Driver
Stores files in the `public/_openpress/media` directory. These assets are tracked by Git, making them ideal for small to medium projects where content is deployed alongside code.

### Cloud Drivers (Planned)
Support for external providers like **Cloudinary**, **S3**, or **Imgix** to handle high-volume media and on-the-fly transformations.

## Usage

### In Components

Use the `OpImage` component to render assets. It automatically handles path resolution based on the active driver.

```vue
<OpImage src="/_openpress/media/hero.jpg" alt="Hero Image" />
```

### Editor Integration

When editing a block that contains an image or file field, the Media Picker overlay is triggered.

1. **Selection**: Browse existing assets in the library.
2. **Upload**: Drop files directly into the picker to upload them to the current driver.
3. **Metadata**: The library extracts dimensions, format, and size automatically.

::callout{icon="i-heroicons-light-bulb" color="primary"}
The Media Library is designed to be extensible. You can register your own drivers to support custom storage backends.
::
