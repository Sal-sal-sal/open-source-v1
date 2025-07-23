# LearnTug Frontend

This is the frontend application for LearnTug, built with React, TypeScript, and Vite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment variables:
Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Google Analytics 4
VITE_GOOGLE_MEASUREMENT_ID=G-B8ENB375WH

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Firebase (for landing page)
VITE_FIREBASE_URL=https://landing-44432-default-rtdb.firebaseio.com
```

**Important**: 
- Replace `G-B8ENB375WH` with your actual Google Analytics 4 Measurement ID
- Replace `your-google-client-id.apps.googleusercontent.com` with your actual Google OAuth Client ID

**Note**: If you don't have Google OAuth set up yet, the Google sign-in buttons will appear disabled with a "(Not Configured)" label.

3. Start development server:
```bash
npm run dev
```

## Google OAuth Setup

To enable Google sign-in functionality:

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (alternative dev port)
     - Your production domain
   - Add authorized redirect URIs:
     - `http://localhost:5173`
     - `http://localhost:3000`
     - Your production domain

4. **Get Client ID:**
   - Copy the generated Client ID
   - Add it to your `.env` file as `VITE_GOOGLE_CLIENT_ID`

5. **Backend Configuration:**
   - Add the same Client ID to your backend `.env` file as `GOOGLE_CLIENT_ID`

### Troubleshooting Google OAuth

If you see the error "Missing required parameter client_id":

1. **Check your `.env` file** - Make sure `VITE_GOOGLE_CLIENT_ID` is set correctly
2. **Restart the development server** - Environment variables need a restart to take effect
3. **Check the browser console** - Look for the warning message about Google OAuth not being configured
4. **Verify the Client ID format** - It should look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

## Analytics Setup

The application includes comprehensive Google Analytics 4 tracking. To set up analytics:

1. Create a GA4 property in Google Analytics
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Add it to your `.env` file as `VITE_GOOGLE_MEASUREMENT_ID`
4. The analytics will automatically start tracking:
   - User registrations and logins (email and Google)
   - API requests and performance
   - Page views and user engagement
   - Feature usage and errors

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- **Authentication**: Email and Google OAuth login
- **Chat Interface**: AI-powered chat with streaming responses
- **Document Processing**: PDF upload and analysis
- **Notes System**: Structured note creation and management
- **Analytics**: Comprehensive user behavior tracking
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Google Analytics 4
- Google OAuth 2.0
- React PDF
- Lucide React Icons

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── utils/         # Utility functions
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── api/           # API client and types
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_GOOGLE_MEASUREMENT_ID` | GA4 Measurement ID | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `VITE_FIREBASE_URL` | Firebase Realtime Database URL | No |

## Analytics Events

The application tracks the following events:

- `sign_up` - User registration (email/Google)
- `login` - User login (email/Google)
- `api_request` - API calls with performance metrics
- `note_created` - Note creation
- `chat_message_sent` - Chat interactions
- `file_uploaded` - File uploads
- `page_view` - Page navigation
- `user_engagement` - User activity
- `error` - Error tracking

## Development

For local development, analytics events are logged to the browser console. Check the console to verify that events are being tracked correctly.

## Production

In production, analytics data will be available in your Google Analytics 4 dashboard under:
- **Realtime** reports for immediate data
- **Reports** for historical analysis
- **Explore** for custom reports
