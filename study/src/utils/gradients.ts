// Градиенты для разных страниц приложения
export const gradients = {
  // Video Player Page - темный градиент
  videoPlayer: {
    primary: "bg-gradient-to-br from-[#000000] to-[#ffffff]",
    // Альтернативные варианты:
    dark: "bg-gradient-to-br from-[#2d1b69] to-[#11998e]",
    purple: "bg-gradient-to-br from-[#667eea] to-[#764ba2]",
    blue: "bg-gradient-to-br from-[#4facfe] to-[#00f2fe]",
    green: "bg-gradient-to-br from-[#43e97b] to-[#38f9d7]",
    red: "bg-gradient-to-br from-[#fa709a] to-[#fee140]",
    orange: "bg-gradient-to-br from-[#ff9a9e] to-[#fecfef]",
    sunset: "bg-gradient-to-br from-[#ffecd2] to-[#fcb69f]",
    night: "bg-gradient-to-br from-[#a8edea] to-[#fed6e3]",
    ocean: "bg-gradient-to-br from-[#667eea] to-[#764ba2]",
    forest: "bg-gradient-to-br from-[#d299c2] to-[#fef9d7]" // white theme
  },
  
  // Video Search Page - видео фон
  videoSearch: "video-background-marie", // Специальный тип для видео-фона Marie
  
  // Другие страницы
  chat: "bg-gradient-to-br from-blue-50 to-indigo-100",
  audio: "video-background", // Специальный тип для видео-фона
  audioBooks: "video-background", // Специальный тип для видео-фона
  audioChat: "video-background", // Специальный тип для видео-фона
  library: "video-background-library", // Специальный тип для видео-фона Library
  notes: "video-background-notes", // Специальный тип для видео-фона Notes
  profile: "bg-gradient-to-br from-slate-50 to-gray-100",
  pdfToAudio: "bg-gradient-to-br from-[#000000] to-[#ffffff]"
};

// Функция для получения градиента по имени страницы
export const getGradient = (page: keyof typeof gradients, variant: string = 'primary') => {
  const pageGradients = gradients[page];
  if (typeof pageGradients === 'string') {
    // Специальная обработка для видео-фона
    if (pageGradients === 'video-background') {
      return 'video-background';
    }
    if (pageGradients === 'video-background-marie') {
      return 'video-background-marie';
    }
    if (pageGradients === 'video-background-library') {
      return 'video-background-library';
    }
    if (pageGradients === 'video-background-notes') {
      return 'video-background-notes';
    }
    return pageGradients;
  }
  return pageGradients[variant as keyof typeof pageGradients] || pageGradients.primary;
};

// Примеры использования:
// getGradient('videoPlayer') // основной градиент для видео плеера
// getGradient('videoPlayer', 'dark') // темный вариант
// getGradient('videoSearch') // основной градиент для поиска видео 