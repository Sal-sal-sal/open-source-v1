# Настройка градиентов для Video страниц

## Где настроить градиенты

### 1. Файл настроек градиентов
Основные настройки градиентов находятся в файле:
```
study/src/utils/gradients.ts
```

### 2. Video Player Page (страница просмотра видео с AI чатом)
Градиент настраивается в файле:
```
study/src/pages/VideoPlayerPage.tsx
```

### 3. Video Search Page (страница поиска видео)
Градиент настраивается в файле:
```
study/src/pages/VideoPage.tsx
```

## Как изменить градиент

### Вариант 1: Изменить в файле gradients.ts (рекомендуется)

Откройте файл `study/src/utils/gradients.ts` и измените нужный градиент:

```typescript
export const gradients = {
  videoPlayer: {
    primary: "bg-gradient-to-br from-[#000000] to-[#ffffff]", // ← Измените здесь
    // Другие варианты...
  },
  videoSearch: {
    primary: "bg-gradient-to-br from-red-50 to-orange-100", // ← Или здесь
    // Другие варианты...
  }
};
```

### Вариант 2: Использовать готовые варианты

В файле `gradients.ts` уже есть готовые варианты градиентов:

**Для Video Player (темные градиенты):**
- `primary` - текущий: `#000000` → `#ffffff` (черно-белый)
- `dark` - фиолетово-зеленый: `#2d1b69` → `#11998e`
- `purple` - фиолетовый: `#667eea` → `#764ba2`
- `blue` - синий: `#4facfe` → `#00f2fe`
- `green` - зеленый: `#43e97b` → `#38f9d7`
- `red` - красно-желтый: `#fa709a` → `#fee140`
- `orange` - оранжево-розовый: `#ff9a9e` → `#fecfef`
- `sunset` - закат: `#ffecd2` → `#fcb69f`
- `night` - ночной: `#a8edea` → `#fed6e3`
- `ocean` - океан: `#667eea` → `#764ba2`
- `forest` - лес: `#d299c2` → `#fef9d7`

**Для Video Search:**
- `videoSearch` - видео-фон: `videomarie.mp4` (автоматическое воспроизведение, зацикленное)

**Для PDF to Audio:**
- `pdfToAudio` - черно-белый: `#000000` → `#ffffff`

**Для Library:**
- `library` - видео-фон: `library.mp4` (автоматическое воспроизведение, зацикленное)

**Для Audio Page:**
- `audio` - видео-фон: `audiobook.mp4` (автоматическое воспроизведение, зацикленное)

**Для Audio Books Page:**
- `audioBooks` - видео-фон: `audiobook.mp4` (автоматическое воспроизведение, зацикленное)

**Для Audio Chat Page:**
- `audioChat` - видео-фон: `audiobook.mp4` (автоматическое воспроизведение, зацикленное)

**Для Notes Page:**
- `notes` - видео-фон: `notes.mp4` (автоматическое воспроизведение, зацикленное)

### Вариант 3: Изменить прямо в компоненте

Если хотите быстро изменить градиент, откройте файл `VideoPlayerPage.tsx` и найдите строку:

```typescript
<div className={`min-h-screen ${getGradient('videoPlayer')} flex`}>
```

И замените на:

```typescript
<div className={`min-h-screen ${getGradient('videoPlayer', 'dark')} flex`}>
```

Или используйте любой другой вариант: `purple`, `blue`, `green`, `red`, `orange`, `sunset`, `night`, `ocean`, `forest`.

## Примеры использования

### Изменить на темный градиент:
```typescript
getGradient('videoPlayer', 'dark')
```

### Изменить на синий градиент:
```typescript
getGradient('videoPlayer', 'blue')
```

### Изменить на океанский градиент:
```typescript
getGradient('videoPlayer', 'ocean')
```

### Создать свой градиент:
```typescript
// В файле gradients.ts добавьте новый вариант:
videoPlayer: {
  primary: "bg-gradient-to-br from-[#5a4d52] to-[#151415]",
  myCustom: "bg-gradient-to-br from-[#ff0000] to-[#00ff00]", // ← Ваш градиент
  // ...
}

// Затем используйте:
getGradient('videoPlayer', 'myCustom')
```

## Направления градиентов

Вы можете изменить направление градиента, заменив `bg-gradient-to-br` на:

- `bg-gradient-to-r` - слева направо
- `bg-gradient-to-l` - справа налево
- `bg-gradient-to-t` - снизу вверх
- `bg-gradient-to-b` - сверху вниз
- `bg-gradient-to-tr` - снизу-слева вверх-справа
- `bg-gradient-to-tl` - снизу-справа вверх-слева
- `bg-gradient-to-br` - сверху-слева вниз-справа (текущий)
- `bg-gradient-to-bl` - сверху-справа вниз-слева

## Цветовые коды

Для создания своих градиентов используйте:

- **Hex коды**: `#ff0000`, `#00ff00`, `#0000ff`
- **Tailwind цвета**: `red-500`, `blue-600`, `green-400`
- **RGB**: `rgb(255, 0, 0)`, `rgba(0, 255, 0, 0.5)`

## Быстрая замена

Чтобы быстро поменять градиент, просто замените в файле `gradients.ts`:

```typescript
// Было:
primary: "bg-gradient-to-br from-[#000000] to-[#ffffff]",

// Стало (например, синий градиент):
primary: "bg-gradient-to-br from-[#4facfe] to-[#00f2fe]",
```

Все изменения применятся автоматически! 