#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { put, list } from '@vercel/blob'
import { roomFolderMap } from '../src/lib/room-folder-map.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local
config({ path: path.join(__dirname, '..', '.env.local') })

// CLI Arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const roomFilter = args.find(arg => arg.startsWith('--room='))?.split('=')[1]

// Environment check
const blobToken = process.env.BLOB_READ_WRITE_TOKEN
if (!blobToken) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is not set')
  console.error('   Please set it in your .env.local file or environment')
  process.exit(1)
}

// Supported image extensions
const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']

// Progress tracking
let totalFiles = 0
let uploadedFiles = 0
let skippedFiles = 0
let errorFiles = 0

/**
 * Check if an image already exists in blob storage
 */
async function imageExistsInBlob(roomSlug, filename) {
  try {
    const { blobs } = await list({
      prefix: `rooms/${roomSlug}/${filename}`,
      token: blobToken
    })
    return blobs.length > 0
  } catch (error) {
    return false
  }
}

/**
 * Upload a single image to Vercel Blob Storage
 */
async function uploadImage(filePath, roomSlug, filename) {
  try {
    const fileBuffer = await fs.readFile(filePath)

    // Check if image already exists (unless dry run)
    if (!dryRun && await imageExistsInBlob(roomSlug, filename)) {
      console.log(`⏭️  Skipping (already exists): ${filename}`)
      skippedFiles++
      return true
    }

    if (dryRun) {
      console.log(`📋 Would upload: rooms/${roomSlug}/${filename}`)
      return true
    }

    // Upload to Vercel Blob
    const blobPath = `rooms/${roomSlug}/${filename}`
    const result = await put(blobPath, fileBuffer, {
      access: 'public',
      token: blobToken
    })

    console.log(`✅ Uploaded: ${filename} → ${result.url}`)
    uploadedFiles++
    return true

  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error.message)
    errorFiles++
    return false
  }
}

/**
 * Process all images for a specific room
 */
async function processRoomImages(roomSlug, folderName) {
  const folderPath = path.join(__dirname, '..', 'public', 'Pictures', folderName)

  try {
    // Check if folder exists
    await fs.access(folderPath)
  } catch (error) {
    console.log(`⚠️  Folder not found: ${folderName} (${folderPath})`)
    return
  }

  console.log(`\n📁 Processing room: ${roomSlug} (folder: ${folderName})`)

  try {
    const files = await fs.readdir(folderPath)

    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return imageExtensions.includes(ext)
    })

    if (imageFiles.length === 0) {
      console.log(`   No image files found in ${folderName}`)
      return
    }

    console.log(`   Found ${imageFiles.length} image files`)

    // Process each image
    for (const filename of imageFiles) {
      const filePath = path.join(folderPath, filename)
      await uploadImage(filePath, roomSlug, filename)
      totalFiles++
    }

  } catch (error) {
    console.error(`❌ Error reading folder ${folderName}:`, error.message)
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Vercel Blob Image Upload Script')
  console.log('=====================================')

  if (dryRun) {
    console.log('📋 DRY RUN MODE - No actual uploads will be performed')
  }

  console.log(`🔑 Using blob token: ${blobToken.substring(0, 10)}...`)
  console.log('')

  // Get rooms to process
  let roomsToProcess = Object.entries(roomFolderMap)

  if (roomFilter) {
    const filtered = roomsToProcess.filter(([slug]) => slug === roomFilter)
    if (filtered.length === 0) {
      console.error(`❌ Error: Room "${roomFilter}" not found in mapping`)
      console.error('Available rooms:', Object.keys(roomFolderMap).join(', '))
      process.exit(1)
    }
    roomsToProcess = filtered
    console.log(`🎯 Processing only room: ${roomFilter}`)
  } else {
    console.log(`🏨 Processing all ${roomsToProcess.length} rooms`)
  }

  console.log('')

  // Process each room
  for (const [roomSlug, folderName] of roomsToProcess) {
    await processRoomImages(roomSlug, folderName)
  }

  // Summary
  console.log('\n📊 Upload Summary')
  console.log('==================')
  console.log(`Total files processed: ${totalFiles}`)
  if (!dryRun) {
    console.log(`✅ Successfully uploaded: ${uploadedFiles}`)
    console.log(`⏭️  Skipped (already exist): ${skippedFiles}`)
    console.log(`❌ Errors: ${errorFiles}`)
  } else {
    console.log(`📋 Would upload: ${totalFiles} files`)
  }

  if (errorFiles > 0) {
    console.log('\n⚠️  Some files had errors. Check the output above for details.')
    process.exit(1)
  } else {
    console.log('\n🎉 All operations completed successfully!')
  }
}

// Handle script execution
main().catch(error => {
  console.error('💥 Script failed:', error.message)
  process.exit(1)
})