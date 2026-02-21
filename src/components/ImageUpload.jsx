import { useRef, useState, useCallback } from 'react'
import { compressAndConvertToBase64 } from '../utils/imageUtils'
import { CameraIcon } from './Icons'

export default function ImageUpload({ onImageReady, disabled }) {
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const processFile = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith('image/')) return
      try {
        const base64 = await compressAndConvertToBase64(file)
        setPreview(base64)
        onImageReady(base64)
      } catch (err) {
        console.error('Failed to process image:', err)
      }
    },
    [onImageReady]
  )

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleChange = () => {
    setPreview(null)
    onImageReady(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (preview) {
    return (
      <div className="relative rounded-md overflow-hidden border-2 border-ink bg-card">
        <img
          src={preview}
          alt="Food preview"
          className="w-full h-48 object-cover"
        />
        <button
          onClick={handleChange}
          disabled={disabled}
          className="absolute top-2 right-2 bg-card text-ink text-sm font-bold px-3 py-1.5 rounded-md border-2 border-ink hover:bg-cream transition-colors disabled:opacity-50"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-8 transition-all cursor-pointer ${
        disabled
          ? 'border-ink-faint bg-cream-dark cursor-not-allowed opacity-60'
          : isDragging
            ? 'border-ink bg-cream-dark'
            : 'border-ink-faint bg-card hover:border-ink'
      }`}
    >
      <CameraIcon className="w-10 h-10 text-ink-light" />
      <div className="text-center">
        <p className="text-sm font-bold text-ink">
          Tap to take a photo or upload
        </p>
        <p className="text-xs text-ink-faint mt-1">
          or drag and drop an image here
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
