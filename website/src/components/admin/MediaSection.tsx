import { useId } from 'react'
import { X } from '@phosphor-icons/react'
import { uploadImage } from '../../api/uploads'
import { ApiError } from '../../lib/api'
import { ImageDropzone } from './ImageDropzone'
import { UrlAddField } from './FormControls'

/** Hero image + gallery image editor shared by the Safari Package and Region Safari admin forms. */
export function MediaSection({
  image,
  onImageChange,
  imageAlt,
  onImageAltChange,
  galleryImages,
  onGalleryImagesChange,
  uploadError,
  onUploadError,
}: {
  image: string
  onImageChange: (url: string) => void
  imageAlt: string
  onImageAltChange: (value: string) => void
  galleryImages: string[]
  onGalleryImagesChange: (updater: (list: string[]) => string[]) => void
  uploadError: string | null
  onUploadError: (error: string | null) => void
}) {
  const uploadInputId = useId()
  const imageUrlId = useId()
  const imageAltId = useId()

  return (
    <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-sand-stone/50 space-y-5">
      <h3 className="font-headline-md text-[18px] text-on-surface">Media</h3>
      <div>
        <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Hero Image</span>
        {image ? (
          <div className="relative h-48 rounded-xl overflow-hidden bg-surface-container border border-sand-stone group">
            <img src={image} alt="" className="w-full h-full object-cover" />
            <label
              htmlFor={uploadInputId}
              className="absolute inset-0 flex items-center justify-center bg-deep-earth/0 group-hover:bg-deep-earth/50 text-white text-sm font-label-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              Replace image
            </label>
            <input
              id={uploadInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  onImageChange(await uploadImage(file))
                } catch (err) {
                  onUploadError(err instanceof ApiError ? err.message : 'Failed to upload image.')
                } finally {
                  e.target.value = ''
                }
              }}
            />
          </div>
        ) : (
          <ImageDropzone onUploaded={onImageChange} onError={onUploadError} />
        )}
        {uploadError && <p className="text-error text-xs mt-2">{uploadError}</p>}
      </div>
      <div>
        <label htmlFor={imageUrlId} className="block font-label-sm text-label-sm mb-1.5">
          Or paste an image URL
        </label>
        <input
          id={imageUrlId}
          required
          value={image}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://..."
          className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
        />
      </div>
      <div>
        <label htmlFor={imageAltId} className="block font-label-sm text-label-sm mb-1.5">
          Image Alt Text
        </label>
        <input
          id={imageAltId}
          required
          value={imageAlt}
          onChange={(e) => onImageAltChange(e.target.value)}
          className="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
        />
      </div>
      <div>
        <span className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
          Gallery Images (optional)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {galleryImages.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-24 rounded-lg overflow-hidden bg-surface-container border border-sand-stone group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onGalleryImagesChange((list) => list.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-deep-earth/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <ImageDropzone
            variant="tile"
            onUploaded={(url) => onGalleryImagesChange((list) => [...list, url])}
            onError={onUploadError}
          />
        </div>
      </div>
      <UrlAddField
        label="Or paste a gallery image URL"
        placeholder="https://..."
        onAdd={(v) => onGalleryImagesChange((list) => [...list, v])}
      />
    </section>
  )
}
