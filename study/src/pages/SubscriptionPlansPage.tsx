import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import CommonHeader from '../components/CommonHeader';

// Создаем простой компонент анимации для этой страницы
const AnimatedElement: React.FC<{children: React.ReactNode, delay?: number}> = ({ children, delay = 0 }) => {
  return (
    <div 
      className="transform transition-all duration-600 ease-out opacity-100 translate-y-0 scale-100"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const plans = [
  {
    name: 'PRO-подписка',
    price: '499₽/мес',
    features: [
      'Безлимитное создание AI заметок',
      'Доступ к аудиочату и PDF-экспорту',
      'Приоритетная поддержка',
      'Доступ к новым функциям первым',
      'Расширенные лимиты на загрузку файлов',
    ],
    highlight: true,
    button: {
      text: 'Оформить PRO',
      link: '/register',
    },
  },
  {
    name: 'Базовая подписка',
    price: 'Бесплатно',
    features: [
      'Ограниченное создание AI заметок',
      'Доступ к базовому чату',
      'Ограниченный экспорт заметок',
      'Ограничения на размер файлов',
    ],
    highlight: false,
    button: {
      text: 'Начать бесплатно',
      link: '/register',
    },
  },
];

const SubscriptionPlansPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-gray-100">
      <CommonHeader currentPage="pricing" />
      <div className="flex flex-col items-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center">Тарифные планы</h1>
        <p className="text-lg text-gray-300 mb-12 text-center max-w-2xl">Выберите подходящий тариф и получите максимум от LearnTug!</p>
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {plans.map((plan, idx) => (
            <AnimatedElement key={plan.name} delay={200 * idx}>
              <div className={`rounded-3xl shadow-xl p-8 border-2 transition-all duration-300 ${plan.highlight ? 'border-blue-500 bg-blue-900/60' : 'border-gray-700 bg-gray-900/60'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-2xl font-bold ${plan.highlight ? 'text-blue-300' : 'text-gray-200'}`}>{plan.name}</h2>
                  <span className={`text-xl font-semibold ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>{plan.price}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-base">
                      <CheckCircle className={`w-5 h-5 ${plan.highlight ? 'text-blue-400' : 'text-gray-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.button.link}
                  className={`inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'} shadow-md w-full`}
                >
                  {plan.button.text}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;