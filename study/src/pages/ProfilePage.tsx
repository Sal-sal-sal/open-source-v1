import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import ActivityCalendar, { type ThemeInput } from 'react-activity-calendar';

type Activity = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const ProfilePage: React.FC = () => {
  const { userInfo, loading, error, addStudyMinutes } = useProfile();
  const [minutes, setMinutes] = useState<number>(0);

  const handleAddMinutes = async () => {
    if (minutes > 0) {
      await addStudyMinutes(minutes);
      setMinutes(0);
    }
  };

  const getLevel = (minutes: number): 0 | 1 | 2 | 3 | 4 => {
    if (minutes <= 0) return 0;
    if (minutes <= 30) return 1;
    if (minutes <= 60) return 2;
    if (minutes <= 120) return 3;
    return 4;
  };

  const today = new Date();
  const currentYear = today.getFullYear();

  const allDays = [];
  for (let d = new Date(currentYear, 0, 1); d <= today; d.setDate(d.getDate() + 1)) {
    allDays.push({
      date: d.toISOString().slice(0, 10),
      count: 0,
      level: 0,
    });
  }

  if (userInfo?.daily_study_history) {
    const userActivity = userInfo.daily_study_history.reduce((acc, study) => {
      acc[study.date.slice(0, 10)] = study.minutes_studied;
      return acc;
    }, {} as Record<string, number>);

    allDays.forEach(day => {
      if (userActivity[day.date]) {
        const minutesStudied = userActivity[day.date];
        day.count = minutesStudied;
        day.level = getLevel(minutesStudied);
      }
    });
  }

  const explicitTheme: ThemeInput = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#374151', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full text-white">Загрузка профиля...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full text-red-500">Ошибка: {error}</div>;
  }

  if (!userInfo) {
    return <div className="flex justify-center items-center h-full text-white">Профиль не найден.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-4xl w-full mb-8">
        <h1 className="text-3xl font-bold text-center mb-6">Мой Профиль</h1>
        <div className="space-y-4">
          <p className="text-lg"><span className="font-semibold">Имя пользователя:</span> {userInfo.username}</p>
          <p className="text-lg"><span className="font-semibold">Email:</span> {userInfo.email}</p>
          <p className="text-lg"><span className="font-semibold">Текущий стрик:</span> {userInfo.current_streak} дней</p>
          <p className="text-lg"><span className="font-semibold">Всего минут обучения:</span> {userInfo.total_study_minutes}</p>
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Добавить Время Обучения</h2>
            <div className="flex space-x-4">
              <input
                type="number"
                className="flex-grow p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Минуты"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
              <button
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200"
                onClick={handleAddMinutes}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-center mb-4">Активность</h2>
        <div className="flex justify-center">
            <ActivityCalendar
                data={allDays}
                theme={explicitTheme}
                blockSize={12}
                blockMargin={2}
                fontSize={14}
                showWeekdayLabels
            />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
