/* Логика поиска товаров */

/**
 * Фильтрует товары по названию.
 * Поиск игнорирует регистр и работает в реальном времени.
 */
export function filterProductsByName(products, query) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return products;
  }

  return products.filter((product) =>
    product.name.toLowerCase().includes(normalizedQuery)
  );
}
