# Image Storage Setup Guide

This guide explains how to set up and manage image storage for room photos in the Lavender Moon Villas application.

## Overview

The application uses a hybrid approach for image storage:

1. **Current**: Images stored in `public/Pictures/` folder (served statically)
2. **Future**: Vercel Blob Storage for scalable, optimized image delivery

## Current Setup (Public Folder)

Images are currently organized in the `public/Pictures/` folder with the following structure:

```
public/Pictures/
├── 106-JW/           # Room 106 images
├── 108-JA/           # Room 108 images
├── 109-LS/           # Room 109 images
├── Alexander-Suite/  # Alexander Suite images
├── Renee-Suite/      # Renee Suite images
├── Room 107-CF/      # Room 107 images
├── Room 206-B/       # Room 206-B images
├── Victoria-Suite/   # Victoria Suite images
└── [other folders...]
```

### Room-to-Folder Mapping

Rooms are mapped to folders using the configuration in `src/lib/room-folder-map.ts`:

```typescript
export const roomFolderMap: Record<string, string> = {
  // Suites
  'victoria-suite': 'Victoria-Suite',
  'alexander-suite': 'Alexander-Suite',
  'renee-suite': 'Renee-Suite',

  // Standard Rooms
  'room-106': '106-JW',
  'room-107-cf': 'Room 107-CF',
  'room-108': '108-JA',
  'room-109-ls': '109-LS',
  'room-207-a': '207-A',
  // ... more mappings
}
```

## Future Setup (Vercel Blob Storage)

For better performance and scalability, images can be migrated to Vercel Blob Storage.

### Setup Instructions

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Enable Blob Storage** in your Vercel project:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Enable Blob Storage in the Storage tab
   - Copy the `BLOB_READ_WRITE_TOKEN`

3. **Add Environment Variable**:
   In your `.env.local` file:
   ```env
   BLOB_READ_WRITE_TOKEN=your_blob_token_here
   ```

4. **Environment Configuration**:
   The application automatically detects if blob storage is configured and uses it when available.

### API Endpoints

#### Fetch Room Images
```http
GET /api/rooms/{slug}/images
```

Returns:
```json
{
  "images": ["/Pictures/106-JW/image1.jpg", "/Pictures/106-JW/image2.jpg"],
  "folder": "106-JW",
  "count": 2,
  "storage": "public"
}
```

#### Upload Room Images (Admin Only)
```http
POST /api/admin/images/upload
Content-Type: multipart/form-data

Form Data:
- file: Image file
- roomSlug: Room slug (e.g., "room-106")
```

### File Upload Constraints

- **Supported formats**: JPG, JPEG, PNG
- **Maximum file size**: 10MB
- **Authentication**: Requires admin session

### Migration Path

1. **Current State**: All images served from `public/Pictures/`
2. **Transition State**: Images served from blob storage when available, fallback to public folder
3. **Future State**: All images migrated to blob storage, public folder removed

### Benefits of Vercel Blob Storage

- **Performance**: Optimized image delivery with CDN
- **Scalability**: No storage limits, automatic scaling
- **Cost-effective**: Pay only for what you use
- **Reliability**: High availability and durability
- **Integration**: Seamless integration with Vercel deployments

### Image Organization in Blob Storage

Images will be organized as:
```
rooms/{roomSlug}/{filename}
```

Example:
```
rooms/room-106/image1.jpg
rooms/victoria-suite/suite-view.jpg
```

## Troubleshooting

### Common Issues

1. **Images not loading**: Check folder name mapping in `room-folder-map.ts`
2. **Blob storage not working**: Verify `BLOB_READ_WRITE_TOKEN` is set correctly
3. **Upload failures**: Check file size limits and authentication

### Debugging

- Check browser console for API errors
- Verify folder permissions in `public/Pictures/`
- Test API endpoints directly: `/api/rooms/room-106/images`

## Development Notes

- The application gracefully falls back to public folder storage if blob storage is unavailable
- Room pages dynamically fetch all images from the configured folder
- Image galleries support both static and dynamic image loading
- Admin upload functionality is ready for future implementation