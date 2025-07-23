- Исправлена синтаксическая ошибка в package.json: удалена лишняя запятая после последнего элемента в объекте dependencies, из-за чего npm не мог прочитать файл. 
- Для устранения конфликта peer dependencies между react-pdf и @types/react при установке зависимостей был использован флаг --legacy-peer-deps (npm install --legacy-peer-deps). 
- Версия @types/react понижена до 18.3.6 для устранения конфликтов зависимостей с react-pdf. 
- Эндпоинт видео-сводки изменён на `${API_BASE}/video/summary` (удалён префикс /api). 

## Idle Animation Feature

A sophisticated idle animation has been implemented to enhance the user experience. After 10 seconds of inactivity, a mesmerizing field of twinkling, orbiting stars will fade in, filling the background. This animation is designed to be both beautiful and performant, using an HTML5 Canvas for smooth rendering.

### Key Components:

-   **`useIdle.ts`**: A custom React hook that detects user inactivity by monitoring mouse movements, clicks, and key presses.
-   **`Starfield.tsx`**: A new component that renders the starfield animation on a `<canvas>` element.
-   **`App.tsx`**: The main application component has been updated to use the `useIdle` hook and conditionally render the `Starfield` component with a fade-in transition.

This feature adds a touch of elegance to the application, making it feel more alive and engaging, especially during pauses in user interaction.

## Sliding Window PDF Pagination

The PDF viewer has been completely overhauled to implement a high-performance "sliding window" pagination system. This addresses the issue where multiple pages were displayed side-by-side and improves performance for large documents.

### Key Changes:

-   **`PDFViewer.tsx`**: Completely rewritten to use Intersection Observers for automatic page loading/unloading
    - Renders 10 pages at a time (configurable via `WINDOW_SIZE`)
    - Loads/unloads 5 pages at a time when scrolling (configurable via `LOAD_STEP`)
    - Uses sentinel elements to detect when user approaches the top/bottom of visible pages
    - Maintains scroll position when pages are added/removed to prevent jumping
    - Added visual feedback with loading indicators
    - Shows current page range indicator at bottom-right

-   **`DocumentView.tsx`**: Updated to use the new PDFViewer component
    - Added missing imports for `authFetch` and `API_BASE`
    - Replaced inline PDF rendering with the PDFViewer component
    - Creates object URLs for uploaded files to work with the PDFViewer
    - Properly cleans up object URLs when component unmounts

This implementation provides a smooth, modern PDF viewing experience that can handle large documents efficiently without overwhelming the browser's memory.

## Sign In/Sign Up Accessibility Fix

Fixed an issue where authenticated users were automatically redirected from the Sign In and Sign Up pages, preventing them from accessing these routes.

### Key Changes:

-   **`LoginPage.tsx`**: Removed the `useEffect` hook that checked for an existing authentication token and redirected the user.
-   **`RegisterPage.tsx`**: Removed the corresponding `useEffect` hook to ensure the registration page is always accessible.

This change allows all users, regardless of their authentication status, to view the login and registration pages.

## Page-Specific Document Questions

A new feature has been added that allows users to ask questions about a specific range of pages within a PDF document.

### Key Changes:

-   **`PageRangeModal.tsx`**: A new modal component was created to allow users to input a start and end page. It includes validation to ensure the page range is valid.
-   **`PDFViewer.tsx`**: Updated to report the total number of pages of a loaded document to its parent component.
-   **`DocumentView.tsx`**: 
    -   A new button has been added to the chat input area, which opens the page range modal.
    -   The component now manages the state for the modal's visibility and the document's total page count.
    -   When a page range is submitted, the user's question is prepended with a context string (e.g., "Based on pages X to Y, ...") before being sent to the AI.

This enhancement provides users with more granular control over the document analysis, enabling more focused and relevant answers from the AI.

## Fixed Document Chat Logic and 422 Error

Addressed a critical bug that caused a "422 Unprocessable Entity" error when chatting with a document. The issue stemmed from the frontend not uploading the document file to the backend before attempting to start a chat.

### Key Changes:

-   **`src/utils/chat.ts`**:
    -   A new `uploadDocumentAndStartChat` function was created. This function sends the selected file via `multipart/form-data` to the `/api/doc_chat` endpoint to properly initialize a chat session and returns a `chat_id`.
-   **`src/pages/DocumentView.tsx`**:
    -   The file upload logic (`handleFileChange`) was updated to use the new `uploadDocumentAndStartChat` function instead of the generic `createChat`.
    -   The message sending logic (`handleSendMessage`) was reverted to use the standard `/api/chat/{chat_id}/message` endpoint, which is the correct endpoint for sending messages once a chat is established.
-   The previous incorrect log entry about updating to `/api/doc_chat` for messaging was removed.

This fix ensures that the document is correctly processed by the backend, allowing the chat functionality to work as intended.

## Fixed "Failed to fetch" Error for File Uploads

Resolved a `TypeError: Failed to fetch` error that occurred during document uploads. The error was likely caused by incorrect `Content-Type` header management when sending `FormData`.

### Key Changes:
- **`src/utils/auth.ts`**: The `authFetch` helper function was updated to explicitly remove the `Content-Type` header from requests that use `FormData`. This change forces the browser to correctly set the header, including the necessary `boundary` parameter, which is critical for `multipart/form-data` requests and often resolves CORS-related fetch errors.

## Landing Page Visual Cohesion Update

A series of updates were made to the landing page to create a more consistent visual theme across different sections.

### Key Changes:
- **Feature Card Styling**: The CSS classes for the feature cards were modified to match the aesthetic of the FAQ section, creating a more unified look.
- **Unified Section Backgrounds**: The background of the "Features" section was changed from a gradient to the `starfield-bg` effect, matching the "FAQ" section's background.
- **Layout Restoration**: After an initial attempt to merge the "Features" and "FAQ" sections, the change was reverted based on feedback. The final implementation keeps the sections structurally separate to maintain their original height and spacing, while ensuring they share a consistent background and styling for a cohesive design.

## Comprehensive Analytics Implementation

A comprehensive Google Analytics 4 (GA4) tracking system has been implemented to monitor user behavior, track API usage, and analyze user engagement patterns throughout the LearnTug application.

### Key Components:

- **`src/utils/analytics.ts`**: Created a centralized analytics utility with comprehensive tracking functions:
  - `trackEvent()` - Generic event tracking
  - `trackRegistration()` - User registration tracking (email/Google)
  - `trackLogin()` - User login tracking
  - `trackApiRequest()` - API request monitoring with response times
  - `trackNoteCreated()` - Note creation tracking
  - `trackChatMessage()` - Chat message tracking
  - `trackFileUpload()` - File upload tracking
  - `trackDocumentProcessed()` - Document processing tracking
  - `trackPageView()` - Page view tracking
  - `trackUserAction()` - User action tracking
  - `trackEngagement()` - User engagement tracking
  - `trackError()` - Error tracking
  - `trackFeatureUsage()` - Feature usage tracking

### Enhanced GA4 Configuration:

- **`index.html`**: Enhanced Google Analytics configuration with:
  - Custom dimensions for user properties
  - Enhanced user tracking with user_id support
  - Session timeout configuration (30 minutes)
  - User engagement tracking
  - Debug mode for development

### Tracking Implementation:

- **User Registration & Authentication**:
  - `RegisterPage.tsx` - Tracks email registration events
  - `LoginPage.tsx` - Tracks login events
  - `api/routes/auth.py` - Server-side logging for registration/login events

- **API Request Monitoring**:
  - `utils/auth.ts` - Enhanced `authFetch` function with automatic API request tracking
  - Tracks endpoint, method, status code, and response time
  - Error tracking for failed requests

- **Feature-Specific Tracking**:
  - **Notes**: `utils/notes.ts` and `components/notes/Create_notes.tsx` - Track note creation
  - **Chat**: `pages/ChatPage.tsx` and `pages/BookChatPage.tsx` - Track chat interactions
  - **Documents**: `pages/DocumentView.tsx` - Track file uploads and document processing
  - **File Uploads**: `api/client.tsx` - Track file upload operations

- **Session & Engagement Tracking**:
  - `App.tsx` - Tracks app initialization, session start, and user idle states
  - Page view tracking across all major pages
  - User engagement monitoring

### Analytics Events Tracked:

1. **User Registration**: `sign_up` events with method (email/Google)
2. **User Login**: `login` events with method
3. **API Requests**: `api_request` events with endpoint, method, status, and response time
4. **Note Creation**: `note_created` events with source (manual/ai_generated)
5. **Chat Messages**: `chat_message_sent` events with chat type (regular/book/audio)
6. **File Uploads**: `file_uploaded` events with file type and size
7. **Document Processing**: `document_processed` events with document type and pages
8. **Page Views**: `page_view` events with page name
9. **User Engagement**: `user_engagement` events with engagement type and duration
10. **Errors**: `error` events with error type and message
11. **Feature Usage**: `feature_used` events with feature name and action

### Expected Analytics Data:

- **Reports → Users**: Unique users and user engagement metrics
- **Explore → Free Form**: Time-based analytics and custom reports
- **Realtime → User snapshot**: Real-time user activity monitoring
- **Custom Events**: Detailed tracking of all user interactions and API usage

This implementation provides comprehensive analytics coverage for monitoring user behavior, identifying usage patterns, tracking performance issues, and optimizing the user experience based on data-driven insights.

## Environment Variable Configuration for Analytics

The Google Analytics 4 Measurement ID has been moved to environment variables for better security and configuration management.

### Key Changes:

- **`index.html`**: Updated to use `%VITE_GOOGLE_MEASUREMENT_ID%` placeholder for GA4 ID
- **`src/utils/analytics.ts`**: Updated `setUserProperties()` function to use `import.meta.env.VITE_GOOGLE_MEASUREMENT_ID`
- **Environment Setup**: GA4 ID now needs to be set in `.env` file as `VITE_GOOGLE_MEASUREMENT_ID=G-B8ENB375WH`

### Benefits:

- **Security**: GA4 ID is no longer hardcoded in source code
- **Flexibility**: Easy to switch between different GA4 properties for development/staging/production
- **Best Practices**: Follows environment variable conventions for configuration management

### Setup Instructions:

1. Create a `.env` file in the `study/` directory
2. Add the line: `VITE_GOOGLE_MEASUREMENT_ID=G-B8ENB375WH`
3. Replace `G-B8ENB375WH` with your actual GA4 Measurement ID
4. The `.env` file is already in `.gitignore` for security

This change ensures that the analytics configuration is properly managed across different environments while maintaining security best practices.

## Google OAuth Integration

A complete Google OAuth 2.0 integration has been implemented to allow users to sign in and register using their Google accounts.

### Key Components:

- **`src/components/GoogleLoginButton.tsx`**: Created a reusable Google OAuth button component with:
  - Google branding and styling
  - Error handling and loading states
  - Analytics tracking for Google auth events
  - Support for both login and registration modes

- **`src/App.tsx`**: Added `GoogleOAuthProvider` wrapper for OAuth functionality

- **`src/pages/LoginPage.tsx`**: Integrated Google login button with:
  - Visual separator between email and Google options
  - Proper error handling
  - Analytics tracking

- **`src/pages/RegisterPage.tsx`**: Integrated Google registration button with:
  - Same styling and functionality as login page
  - Support for new user registration flow

### Backend Integration:

- **`api/routes/auth.py`**: Enhanced Google authentication endpoint with:
  - Improved error handling and validation
  - Automatic user creation for new Google users
  - Username conflict resolution
  - Server-side logging for analytics
  - Response includes `is_new_user` flag for frontend tracking

- **`core/config.py`**: Added `google_client_id` configuration support

### Features:

- **Seamless Authentication**: Users can sign in with Google without creating a separate account
- **Automatic Registration**: New Google users are automatically registered
- **Username Handling**: Automatic username generation with conflict resolution
- **Analytics Integration**: Tracks Google auth events separately from email auth
- **Error Handling**: Comprehensive error handling for OAuth failures
- **Security**: Proper token validation and verification

### Setup Requirements:

1. **Google Cloud Console Configuration**:
   - Create OAuth 2.0 credentials
   - Configure authorized JavaScript origins
   - Set up authorized redirect URIs

2. **Environment Variables**:
   - `VITE_GOOGLE_CLIENT_ID` (frontend)
   - `GOOGLE_CLIENT_ID` (backend)

3. **Dependencies**:
   - `@react-oauth/google` for React OAuth integration
   - `google-auth-library` for backend token verification

### Analytics Events:

- `sign_up` with method: 'google' for new Google users
- `login` with method: 'google' for existing Google users
- `google_auth_failed` for authentication errors
- `google_oauth_error` for OAuth flow errors

This implementation provides a modern, secure, and user-friendly authentication experience while maintaining comprehensive analytics tracking for both email and Google authentication methods.

## Google OAuth Error Handling and Graceful Degradation

Fixed the "Missing required parameter client_id" error that occurred when Google OAuth was not properly configured, implementing graceful degradation for better user experience.

### Key Changes:

- **`src/App.tsx`**: Added fallback handling for missing Google Client ID:
  - Uses `'dummy-client-id'` as fallback to prevent OAuth errors
  - Added console warning when Google OAuth is not configured
  - Prevents application crashes when OAuth is not set up

- **`src/components/GoogleLoginButton.tsx`**: Enhanced with graceful degradation:
  - Checks for valid Google Client ID before rendering functional button
  - Shows disabled button with "(Not Configured)" label when OAuth is not set up
  - Provides helpful tooltip explaining the configuration requirement
  - Maintains visual consistency while clearly indicating the disabled state

- **`study/README.md`**: Added comprehensive troubleshooting section:
  - Step-by-step instructions for resolving "Missing required parameter client_id" error
  - Clear guidance on environment variable setup
  - Verification steps for Client ID format
  - Development server restart requirements

### Benefits:

- **Error Prevention**: Application no longer crashes when Google OAuth is not configured
- **User Experience**: Clear visual feedback about OAuth configuration status
- **Development Friendly**: Allows development without immediate OAuth setup
- **Graceful Degradation**: Application remains functional even without Google OAuth
- **Clear Documentation**: Comprehensive troubleshooting guide for common setup issues

### Error Resolution:

The error was caused by the Google OAuth library requiring a valid `client_id` parameter. The solution implements:

1. **Fallback Client ID**: Uses a dummy ID to prevent library errors
2. **Configuration Detection**: Checks for valid Client ID before enabling OAuth
3. **Visual Feedback**: Shows disabled state with clear indication
4. **Console Warnings**: Provides helpful debugging information

This ensures that the application can be developed and tested even without complete OAuth setup, while providing clear guidance for proper configuration. 

## Fixed Google OAuth 401 Unauthorized Error

Resolved the "Invalid Google token" 401 error that occurred during Google authentication. The issue was caused by missing backend configuration for Google Client ID and incorrect token type usage.

### Problem Analysis:
- **Frontend**: Successfully obtained Google OAuth token using `@react-oauth/google`
- **Backend**: Returned 401 "Invalid Google token" error
- **Root Cause**: 
  1. Backend `google_client_id` configuration was missing
  2. Frontend was sending `access_token` instead of `id_token`

### Solution Implemented:

1. **Backend Environment Configuration**:
   - Created `.env` file in root directory with `GOOGLE_CLIENT_ID`
   - Used the same Client ID as frontend: `954983544251-hcuvt7evocqlf026ghrv83aa9t6pbec8.apps.googleusercontent.com`
   - Verified backend can read the environment variable using `core.config.get_settings()`

2. **Frontend Token Type Fix**:
   - **Before**: Used `useGoogleLogin` hook with `response.access_token`
   - **After**: Used `GoogleLogin` component with `credentialResponse.credential` (ID token)
   - Backend expects ID tokens for verification, not access tokens

3. **Server Startup Fix**:
   - Fixed PowerShell command syntax (used `;` instead of `&&`)
   - Activated virtual environment before running server
   - Started backend server with proper environment variables

4. **OAuth Flow Verification**:
   - Confirmed client-side OAuth flow is working correctly
   - Backend now properly validates Google ID tokens
   - Authentication flow completes successfully

### Key Changes:
- **Root `.env`**: Added `GOOGLE_CLIENT_ID` for backend
- **Frontend Component**: Replaced `useGoogleLogin` with `GoogleLogin` component
- **Token Type**: Changed from `access_token` to `credential` (ID token)
- **Server Startup**: Fixed PowerShell command syntax
- **Environment**: Activated virtual environment for proper Python execution

### Technical Details:
- **ID Token vs Access Token**: 
  - ID tokens contain user identity information and are signed by Google
  - Access tokens are for API access and don't contain user info
  - Backend uses `google.oauth2.id_token.verify_oauth2_token()` which expects ID tokens
- **GoogleLogin Component**: Provides proper ID token through `credentialResponse.credential`

### Testing:
- Backend server starts successfully with Google Client ID loaded
- Google authentication endpoint `/auth/google` now works correctly
- Frontend can successfully authenticate with Google OAuth using ID tokens

This fix ensures that both frontend and backend use the same Google Client ID, and the correct token type (ID token) is sent for proper validation.

### Troubleshooting Notes:
- **PowerShell**: Use `;` instead of `&&` for command chaining
- **Virtual Environment**: Always activate `.venv\Scripts\Activate.ps1` before running Python
- **Environment Variables**: Ensure `.env` file is in root directory for backend access
- **Google Cloud Console**: Verify Authorized JavaScript origins include `http://localhost:5173`
- **Token Type**: Always use ID tokens (`credential`) for authentication, not access tokens 