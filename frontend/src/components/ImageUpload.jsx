import { useState, useRef } from 'react';

/**
 * Compact clickable avatar upload control.
 * Replaces the oversized drag-drop area with a small circular avatar
 * that opens the file picker on click.
 */
const ImageUpload = ({ currentPhotoUrl, onUploadSuccess, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WEBP are allowed';
    if (file.size > MAX_FILE_SIZE) return 'File must be under 5 MB';
    return null;
  };

  const uploadToCloudinary = async (file) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary not configured — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    fd.append('folder', 'projectops/profiles');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error?.message || 'Upload failed'); }
    return (await res.json()).secure_url;
  };

  const handleFileSelect = async (file) => {
    setError('');
    const err = validateFile(file);
    if (err) { setError(err); return; }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onUploadSuccess(url);
    } catch (e) {
      setError(e.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview || currentPhotoUrl;
  const initials = '📷';

  return (
    <div className="flex items-center gap-4">
      {/* Compact avatar button */}
      <button
        type="button"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload profile photo"
        title="Click to change photo"
        className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex-shrink-0"
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl flex items-center justify-center w-full h-full">{initials}</span>
        )}
        {/* Overlay on hover */}
        <span className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-medium">
          {uploading ? '…' : 'Change'}
        </span>
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        className="hidden"
        disabled={uploading}
      />

      <div className="min-w-0">
        <p className="text-xs text-slate-500">JPG, PNG, WEBP · max 5 MB</p>
        {displayUrl && (
          <button type="button" onClick={() => { setPreview(null); setError(''); if (fileInputRef.current) fileInputRef.current.value=''; onRemove?.(); }}
            className="text-xs text-red-500 hover:text-red-700 mt-0.5">
            Remove photo
          </button>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
};

export default ImageUpload;
