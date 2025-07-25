# Google Cloud Setup Guide

## Overview
This application uses Google Cloud services for:
- **Text-to-Speech (TTS)**: Converting text to audio
- **Cloud Storage (GCS)**: Storing generated audio files

## Prerequisites
1. Google Cloud account
2. Google Cloud project
3. Service account with appropriate permissions

## Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project

## Step 2: Enable Required APIs
Enable these APIs in your Google Cloud project:
- **Cloud Text-to-Speech API**
- **Cloud Storage API**

```bash
# Using gcloud CLI
gcloud services enable texttospeech.googleapis.com
gcloud services enable storage.googleapis.com
```

## Step 3: Create Service Account
1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `pdf-to-audio-service`
4. Description: `Service account for PDF to audio conversion`
5. Click **Create and Continue**

## Step 4: Assign Permissions
Add these roles to your service account:
- **Cloud Text-to-Speech User**
- **Storage Object Admin** (for GCS bucket access)

## Step 5: Create and Download Credentials
1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Download the JSON file

## Step 6: Configure Application

### Option A: Using Credentials File
1. Place the downloaded JSON file in your project
2. Set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
```

### Option B: Using Environment Variable (Recommended for deployment)
1. Open the downloaded JSON file
2. Copy the entire content
3. Set environment variable:
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...",...}'
```

## Step 7: Create GCS Bucket
1. Go to **Cloud Storage** > **Buckets**
2. Click **Create Bucket**
3. Name: `tts-audio-files11` (or your preferred name)
4. Location: Choose closest to your users
5. Class: Standard
6. Access Control: Fine-grained
7. Protection: None (for this demo)

## Step 8: Configure Bucket Permissions
1. Go to your bucket
2. Click **Permissions** tab
3. Add your service account with **Storage Object Admin** role

### For Public Access (Required for direct URLs):
1. Go to your bucket
2. Click **Permissions** tab
3. Click **Grant Access**
4. Add **allUsers** with **Storage Object Viewer** role
5. This allows public read access to all objects in the bucket

### Alternative: Disable Uniform Bucket-Level Access (Recommended for this use case):
1. Go to your bucket
2. Click **Settings** tab
3. Find **Uniform bucket-level access**
4. Click **Edit**
5. Uncheck **Enable uniform bucket-level access**
6. Click **Save**
7. This allows individual object ACLs (which we use with `blob.make_public()`)

**Note**: For production, consider using signed URLs or a CDN instead of public access.

## Step 9: Set Environment Variables
Create a `.env` file in your project root:

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
# OR
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...",...}

# GCS Bucket Configuration
GCS_BUCKET_NAME=tts-audio-files11

# Other configuration...
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your-jwt-secret-key
```

## Step 10: Test Configuration
Run the application and test PDF to audio conversion:

```bash
# Test the converter directly
python -c "
from assistance.pdf_to_audio import PDFToAudioConverter
converter = PDFToAudioConverter()
print('GCS configured:', converter.gcs_client is not None)
print('Bucket name:', converter.bucket_name)
"
```

## Troubleshooting

### Error: "File not found"
- Check the path to your credentials file
- Ensure the file exists and is readable

### Error: "Permission denied"
- Verify service account has correct roles
- Check bucket permissions
- Ensure APIs are enabled

### Error: "Invalid credentials"
- Verify JSON file is not corrupted
- Check service account is active
- Ensure project has billing enabled

### Fallback Mode
If GCS is not configured, the application will:
- Still convert PDF to audio using Google TTS
- Save files locally instead of uploading to GCS
- Return local file paths instead of public URLs

## Security Notes
- Never commit credentials to version control
- Use environment variables in production
- Rotate service account keys regularly
- Follow principle of least privilege

## Cost Considerations
- Google TTS: ~$4 per 1 million characters
- Cloud Storage: ~$0.02 per GB per month
- Network egress: ~$0.12 per GB

Monitor usage in Google Cloud Console to avoid unexpected charges. 