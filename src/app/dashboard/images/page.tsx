'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { roomFolderMap, getMappedRoomSlugs } from '@/lib/room-folder-map'

interface RoomImage {
  url: string
  filename: string
  size?: number
  uploadedAt?: string
  storage: 'blob' | 'public'
}

interface UploadProgress {
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export default function ImagesPage() {
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [images, setImages] = useState<RoomImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const availableRooms = getMappedRoomSlugs()

  // Load images for selected room
  const loadImages = async (roomSlug: string) => {
    if (!roomSlug) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/images/list?room=${roomSlug}`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      } else {
        console.error('Failed to load images:', response.status)
        setImages([])
      }
    } catch (error) {
      console.error('Error loading images:', error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  // Handle room selection
  useEffect(() => {
    if (selectedRoom) {
      loadImages(selectedRoom)
    } else {
      setImages([])
    }
  }, [selectedRoom])

  // Handle file upload
  const uploadFiles = async (files: FileList) => {
    if (!selectedRoom || files.length === 0) return

    setUploading(true)
    const newProgress: UploadProgress[] = Array.from(files).map(file => ({
      filename: file.name,
      progress: 0,
      status: 'uploading' as const
    }))

    setUploadProgress(newProgress)

    // Upload each file
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomSlug', selectedRoom)

      try {
        const response = await fetch('/api/admin/images/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          newProgress[index] = {
            ...newProgress[index],
            progress: 100,
            status: 'completed'
          }
        } else {
          const errorData = await response.json()
          newProgress[index] = {
            ...newProgress[index],
            progress: 100,
            status: 'error',
            error: errorData.error || 'Upload failed'
          }
        }
      } catch (error: any) {
        newProgress[index] = {
          ...newProgress[index],
          progress: 100,
          status: 'error',
          error: error.message || 'Upload failed'
        }
      }

      setUploadProgress([...newProgress])
    })

    await Promise.all(uploadPromises)

    // Reload images after upload
    setTimeout(() => {
      loadImages(selectedRoom)
      setUploading(false)
      setUploadProgress([])
    }, 1000)
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
    }
  }

  // Handle image delete
  const handleDeleteImage = async (image: RoomImage) => {
    if (!confirm(`Are you sure you want to delete "${image.filename}"?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/images/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: image.url,
          roomSlug: selectedRoom,
          filename: image.filename
        })
      })

      if (response.ok) {
        // Remove from local state
        setImages(images.filter(img => img.url !== image.url))
      } else {
        const errorData = await response.json()
        alert(`Delete failed: ${errorData.error}`)
      }
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-gray-800">Images</h1>
          <p className="text-gray-600">Manage room photos and upload new images</p>
        </div>
        {selectedRoom && (
          <button
            onClick={() => loadImages(selectedRoom)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Room Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Room
        </label>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lavender-medium"
        >
          <option value="">Choose a room...</option>
          {availableRooms.map(roomSlug => {
            const roomName = roomFolderMap[roomSlug] || roomSlug
            return (
              <option key={roomSlug} value={roomSlug}>
                {roomName} ({roomSlug})
              </option>
            )
          })}
        </select>
      </div>

      {selectedRoom && (
        <>
          {/* Upload Area */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Upload Images</h2>

            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-lavender-medium bg-lavender-pale/20'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />

              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drag and drop images here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports JPG, PNG up to 10MB each
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-lavender-deep text-white rounded-md hover:bg-lavender-medium transition-colors"
                  disabled={uploading}
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Upload Progress</h3>
                {uploadProgress.map((progress, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{progress.filename}</span>
                        <span className={`${
                          progress.status === 'completed' ? 'text-green-600' :
                          progress.status === 'error' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {progress.status === 'uploading' && `${progress.progress}%`}
                          {progress.status === 'completed' && '✓'}
                          {progress.status === 'error' && '✗'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progress.status === 'completed' ? 'bg-green-600' :
                            progress.status === 'error' ? 'bg-red-600' :
                            'bg-blue-600'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      {progress.error && (
                        <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images Grid */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">
                Images ({images.length})
              </h2>
              {images.length > 0 && (
                <span className="text-sm text-gray-500">
                  Storage: {images[0]?.storage || 'unknown'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender-deep"></div>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2">No images found for this room</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={image.url}
                        alt={image.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    </div>

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                      <button
                        onClick={() => window.open(image.url, '_blank')}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        title="View full size"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => navigator.clipboard.writeText(image.url)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        title="Copy URL"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleDeleteImage(image)}
                        className="p-2 bg-red-500/80 hover:bg-red-600/80 rounded-full transition-colors"
                        title="Delete image"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Image info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg">
                      <p className="text-xs truncate">{image.filename}</p>
                      {image.size && (
                        <p className="text-xs opacity-75">
                          {(image.size / 1024 / 1024).toFixed(1)}MB
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}