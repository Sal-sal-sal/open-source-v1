import { Route, Routes as Switch } from 'react-router-dom';
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
import VideoChatView from '../pages/VideoChatView'; // Import the video chat view
import StarsPage from '../pages/StarsPage';
import NotesPage from '../pages/NotesPage';
import PdfToAudioPage from '../pages/PdfToAudioPage';
import LibraryPage from '../pages/LibraryPage';
import VideoPage from '../pages/VideoPage';
import VideoPlayerPage from '../pages/VideoPlayerPage';
import SubscriptionPage from '../pages/SubscriptionPage';
import SubscriptionPlansPage from '../pages/SubscriptionPlansPage';
import AnalyticsPage from '../pages/AnalyticsPage';

const AppRoutes: React.FC = () => {
    return (
        <Switch>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pricing" element={<SubscriptionPlansPage />} />
            <Route path="/stars" element={<StarsPage />} />            
            <Route element={<RequireAuth><SidebarLayout /></RequireAuth>}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/book-chat/:chatId" element={<BookChatPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path='/audio' element={<AudioPage />} />
              <Route path='/audio-chat/:chatId' element={<AudioChatView />} />
              <Route path='/video-chat/:chatId' element={<VideoChatView />} />
              <Route path='/audiobooks' element={<AudioBooksPage />} />
              <Route path='/pdf-to-audio' element={<PdfToAudioPage />} />
              <Route path='/library' element={<LibraryPage />} />
              <Route path='/video' element={<VideoPage />} />
              <Route path='/video/:videoId' element={<VideoPlayerPage />} />
              <Route path='/notes' element={<NotesPage />} />
              <Route path='/subscription' element={<SubscriptionPage />} />
              <Route path='/analytics' element={<AnalyticsPage />} />
            </Route>
        </Switch>
    );
};

export default AppRoutes;