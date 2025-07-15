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