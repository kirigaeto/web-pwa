/* Работа с локальным хранилищем и данными */

export function saveData(key, value) {
  // Здесь будет код сохранения данных
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadData(key) {
  // Здесь будет код загрузки данных
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}
