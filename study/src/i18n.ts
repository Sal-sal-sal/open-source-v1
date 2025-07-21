import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// The translations
const resources = {
  en: {
    translation: {
      "Project": "Project",
      "Search": "Search",
      "Chat": "Chat",
      "Tasks": "Tasks",
      "Projects": "Books",
      "History": "History",
      "AskSomething": "Ask something!",
      "Video": "Video",
      "Document": "Document",
      "DescribeGame": "Describe the game you want...",
      "GenerateGame": "Generate Game",
      "Transcribe": "Transcribe",
      "Processing": "Processing...",
      "InsertYoutubeLink": "Insert a YouTube video link...",
      "UploadDocument": "Upload a Document to Analyze",
      "SelectPDF": "Select a PDF to begin chatting with it.",
      "AskQuestionAboutDoc": "Ask a question about the document...",
      "AskYourQuestion": "Ask your question...",
      "PrevPages": "Previous {{count}}",
      "NextPages": "Next {{count}}",
      "Pages": "Pages",
      "Notes": "Notes",
      "Audio": "Audio"
    }
  },
  ru: {
    translation: {
        "Project": "Проект",
        "Search": "Поиск",
        "Chat": "Чат",
        "Tasks": "Задачи",
        "Projects": "Книги",
        "History": "История",
        "AskSomething": "Спроси что-нибудь!",
        "Video": "Видео",
        "Document": "Документ",
        "DescribeGame": "Опишите игру, которую вы хотите...",
        "GenerateGame": "Создать игру",
        "Transcribe": "Транскрибировать",
        "Processing": "Обработка...",
        "InsertYoutubeLink": "Вставьте ссылку на YouTube видео...",
        "UploadDocument": "Загрузите документ для анализа",
        "SelectPDF": "Выберите PDF, чтобы начать чат с ним.",
        "AskQuestionAboutDoc": "Задайте вопрос о документе...",
        "AskYourQuestion": "Задайте свой вопрос...",
        "PrevPages": "Предыдущие {{count}}",
        "NextPages": "Следующие {{count}}",
        "Pages": "Страницы",
        "Notes": "Заметки",
        "Audio": "Аудио"
    }
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass the i18n instance to react-i18next.
  .init({
    resources,
    fallbackLng: 'en', // Use en if detected lng is not available
    interpolation: {
      escapeValue: false // React already safes from xss
    }
  });

export default i18n; 