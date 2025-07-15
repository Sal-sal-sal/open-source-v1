import { Route, Routes as Switch } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import ChatPage from '../pages/ChatPage';
import BookChatPage from '../pages/BookChatPage';
import RequireAuth from './RequireAuth';
import SidebarLayout from '../layouts/SidebarLayout';

const AppRoutes: React.FC = () => {
    return (
        <Switch>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth><SidebarLayout /></RequireAuth>}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/book-chat/:chatId" element={<BookChatPage />} />
            </Route>
        </Switch>
    );
};

export default AppRoutes;