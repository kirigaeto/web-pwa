/* Управление данными приложения */

export const categories = [
  { id: 'bar', title: 'Бар', icon: '☕' },
  { id: 'expendables', title: 'Расходники', icon: '🥤' },
  { id: 'household', title: 'Хозтовары', icon: '🧹' },
];

export const initialProducts = [
  {
    id: 'bar-1',
    category: 'bar',
    name: 'Капучино',
    description: 'Свежее кофе с кремовой пенкой и мягкой текстурой.',
    status: 'have',
  },
  {
    id: 'bar-2',
    category: 'bar',
    name: 'Чай',
    description: 'Зелёный, чёрный или травяной — идеальный выбор.',
    status: 'have',
  },
  {
    id: 'bar-3',
    category: 'bar',
    name: 'Сэндвич',
    description: 'Лёгкий перекус для барменов и персонала.',
    status: 'have',
  },
  {
    id: 'expendables-1',
    category: 'expendables',
    name: 'Стаканы',
    description: 'Удобные стаканы для напитков на вынос.',
    status: 'have',
  },
  {
    id: 'expendables-2',
    category: 'expendables',
    name: 'Салфетки',
    description: 'Мягкие бумажные салфетки для любых задач.',
    status: 'have',
  },
  {
    id: 'expendables-3',
    category: 'expendables',
    name: 'Антисептик',
    description: 'Чтобы поддерживать чистоту рук и поверхностей.',
    status: 'have',
  },
  {
    id: 'household-1',
    category: 'household',
    name: 'Метла',
    description: 'Лёгкая и прочная для ежедневной уборки.',
    status: 'have',
  },
  {
    id: 'household-2',
    category: 'household',
    name: 'Мыло',
    description: 'Нейтральный аромат для комфортной уборки.',
    status: 'have',
  },
  {
    id: 'household-3',
    category: 'household',
    name: 'Ведро',
    description: 'Практичный помощник для мытья полов.',
    status: 'have',
  },
];
