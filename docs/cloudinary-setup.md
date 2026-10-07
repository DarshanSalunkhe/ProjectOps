# Cloudinary Setup Guide for Profile Photo Uploads

This guide explains how to set up Cloudinary for profile photo uploads in ProjectOps.

## Why Cloudinary?

Cloudinary provides:
- Free tier (25GB storage, 25GB bandwidth/month)
- Image optimization and transformation
- CDN delivery for fast loading
- No server storage needed
- Secure unsigned uploads (no API secret in frontend)
- **No SDK required** - uses native browser fetch() API

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account
3. Verify your email address
4. Log in to the Cloudinary dashboard

### 2. Create Upload Preset

An upload preset allows secure uploads without exposing your API secret.

1. In Cloudinary dashboard, go to **Settings** (gear icon in top right)
2. Click **Upload** tab
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Configure the preset:
   - **Preset name**: Choose a name (e.g., `projectops_profiles`)
   - **Signing Mode**: Select **Unsigned** (important!)
   - **Folder**: Enter `projectops/profiles` (optional, keeps uploads organized)
   - **Upload control**:
     - Max file size: `5000000` (5MB)
     - Allowed formats: `jpg,jpeg,png,webp`
   - **Eager transformations** (optional for optimization):
     - Add transformation: `c_fill,w_500,h_500,q_auto,f_auto`
     - This resizes to 500x500 and auto-optimizes quality/format
6. Click **Save**

### 3. Get Your Credentials

1. Go back to the **Dashboard**
2. Find your **Cloud name** (shown in the Account Details section)
3. Copy your cloud name and upload preset name

### 4. Configure Environment Variables

Add these to your `frontend/.env.local` file (create it if it doesn't exist):

```bash
VITE_API_URL=http://localhost:5173/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=projectops_profiles
```

Replace `your_cloud_name_here` with your actual Cloudinary cloud name.

### 5. Restart Frontend

After adding environment variables:

```powershell
cd frontend
npm run dev
```

## Security Notes

### What's Safe in Frontend Code

✅ **Cloud Name**: Public, safe to expose
✅ **Upload Preset Name**: Public, safe to expose (when unsigned)

### What Should NEVER Be in Frontend Code

❌ **API Key**: Keep in backend only
❌ **API Secret**: Keep in backend only
❌ **Signed Upload URLs**: Generate server-side only

### Why Unsigned Upload Is Safe

- Preset restricts file types (only images)
- Preset restricts file size (5MB max)
- Preset restricts destination folder
- No sensitive operations allowed
- Free tier has bandwidth limits preventing abuse

## Testing

1. Go to http://localhost:5173/profile
2. Click the upload area or drag an image
3. Image should upload and preview immediately
4. Click "Save Profile" to persist the photo URL
5. Refresh page - photo should still be there
6. Check your Cloudinary Media Library to see the uploaded image

## Troubleshooting

### "Cloudinary configuration is missing"
- Check that `.env.local` exists in `frontend/` directory
- Verify environment variable names start with `VITE_`
- Restart the frontend dev server

### Upload fails with CORS error
- Ensure upload preset is set to **Unsigned**
- Check that preset exists in your Cloudinary account

### Image doesn't appear after upload
- Check browser console for errors
- Verify the URL returned by Cloudinary is accessible
- Check that you clicked "Save Profile" after upload

### File type rejected
- Only JPG, JPEG, PNG, WEBP allowed
- Check file extension is correct

### File size rejected
- Maximum 5MB per file
- Compress image before uploading if needed

## Production Considerations

### For Production Deployment

1. **Environment Variables**: Add Cloudinary credentials to your production environment
2. **Signed Uploads** (recommended for production):
   - Change preset to "Signed" mode
   - Create backend endpoint to generate signed upload URLs
   - Frontend requests signed URL from backend before upload
   - More secure, prevents direct upload abuse
3. **Rate Limiting**: Add rate limiting to prevent upload spam
4. **Monitoring**: Monitor Cloudinary usage in dashboard

### Optional: Signed Upload Flow (Production)

```javascript
// Backend endpoint: POST /api/auth/generate-upload-signature
export const generateUploadSignature = async (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: 'projectops/profiles',
      upload_preset: 'projectops_profiles_signed'
    },
    process.env.CLOUDINARY_API_SECRET
  );
  
  res.json({ signature, timestamp });
};

// Frontend uploads with signature
const { signature, timestamp } = await authService.generateUploadSignature();
formData.append('signature', signature);
formData.append('timestamp', timestamp);
```

## Cost Monitoring

Free tier limits:
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month

Monitor usage in Cloudinary dashboard. If you approach limits:
1. Enable transformations only for profile photos
2. Add image compression before upload
3. Consider paid tier ($0.004/GB for storage)

## Support

- Cloudinary Docs: https://cloudinary.com/documentation
- Upload API: https://cloudinary.com/documentation/image_upload_api_reference
- React Integration: https://cloudinary.com/documentation/react_integration
