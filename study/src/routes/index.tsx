import { Route, Routes as Switch, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import ChatPage from '../pages/ChatPage';
import DocumentView from '../pages/DocumentView';
import BookChatPage from '../pages/BookChatPage';
import BookChatView from '../pages/BookChatView';
import RequireAuth from './RequireAuth';
import SidebarLayout from '../layouts/SidebarLayout';
import ProfilePage from '../pages/ProfilePage';
import AudioPage from '../pages/AudioPage';
import AudioBooksPage from '../pages/AudioBooksPage'; // Import the new page
import AudioChatView from '../pages/AudioChatView'; // Import the new view
import StarsPage from '../pages/StarsPage';
import NotesPage from '../pages/NotesPage';
import PdfToAudioPage from '../pages/PdfToAudioPage';
import LibraryPage from '../pages/LibraryPage';
import AudioLibraryPage from '../pages/AudioLibraryPage';
import VideoPage from '../pages/VideoPage';
import VideoPlayerPage from '../pages/VideoPlayerPage';

const AppRoutes: React.FC = () => {
    return (
        <Switch>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/stars" element={<StarsPage />} />            
            <Route element={<RequireAuth><SidebarLayout /></RequireAuth>}>
              <Route path="/chat" element={<Navigate to="/audio" replace />} />
              <Route path="/book-chat/:chatId" element={<BookChatPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path='/audio' element={<AudioPage />} />
              <Route path='/audio-chat/:chatId' element={<AudioChatView />} />
              <Route path='/audiobooks' element={<AudioBooksPage />} />
              <Route path='/pdf-to-audio' element={<PdfToAudioPage />} />
              <Route path='/library' element={<LibraryPage />} />
              <Route path='/audio-library' element={<AudioLibraryPage />} />
              <Route path='/video' element={<VideoPage />} />
              <Route path='/video/:videoId' element={<VideoPlayerPage />} />
              <Route path='/notes' element={<NotesPage />} />
            </Route>
        </Switch>
    );
};

export default AppRoutes;