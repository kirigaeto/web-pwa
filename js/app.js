/* Точка входа JavaScript-приложения */
import { loadData, saveData } from './storage.js';
import { categories, initialProducts } from './data.js';
import { filterProductsByName } from './search.js';
import { isTodayCheckDone, markTodayCheckDone, shouldShowReminder, scheduleRemindLater } from './reminder.js';
import { initSearchInput, showNoResults, initReminderModal, openReminderModal, closeReminderModal } from './ui.js';

const STORAGE_KEY = 'products';
const STATUS_ORDER = ['have', 'need'];
const STATUS_META = {
  have: {
    text: 'Есть',
    icon: '🟢',
    className: 'status-have',
  },
  need: {
    text: 'Нужно заказать',
    icon: '🔴',
    className: 'status-need',
  },
};

let products = [];
let activeCategory = 'bar';
let searchQuery = '';
let reminderTimeout = null;
let reminderPaused = false;

function loadProducts() {
  const stored = loadData(STORAGE_KEY);
  return Array.isArray(stored) && stored.length ? stored : [...initialProducts];
}

function saveProducts(items) {
  saveData(STORAGE_KEY, items);
}

function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId) || categories[0];
}

function getNextStatus(currentStatus) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  return STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
}

function renderStatus(card, status) {
  const statusElement = card.querySelector('.product-status');
  const meta = STATUS_META[status] || STATUS_META.have;

  card.dataset.status = status;
  card.classList.remove('status-have', 'status-need');
  card.classList.add(meta.className);

  if (statusElement) {
    statusElement.textContent = `${meta.icon} ${meta.text}`;
  }
}

function createCardElement(product) {
  const category = getCategoryById(product.category);
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = product.id;
  card.dataset.category = product.category;
  card.dataset.status = product.status;

  const productUnit = product.unit || 'шт';
  card.innerHTML = `
    <div class="card-actions">
      <button class="icon-button edit-card" type="button" aria-label="Редактировать товар">✎</button>
      <button class="icon-button delete-card" type="button" aria-label="Удалить товар">🗑</button>
    </div>
    <div class="product-icon">${category.icon}</div>
    <h3>${product.name}</h3>
    <p>${product.description}</p>
    <div class="product-unit">${productUnit}</div>
    <div class="status-row"><span class="product-status"></span></div>
  `;

  renderStatus(card, product.status);
  return card;
}

function renderProducts(items) {
  const barContainer = document.getElementById('bar-cards');
  const expendablesContainer = document.getElementById('expendables-cards');
  const householdContainer = document.getElementById('household-cards');
  const kitchenContainer = document.getElementById('kitchen-cards');

  barContainer.innerHTML = '';
  expendablesContainer.innerHTML = '';
  householdContainer.innerHTML = '';
  kitchenContainer.innerHTML = '';

  items.forEach((product) => {
    const card = createCardElement(product);
    if (product.category === 'bar') {
      barContainer.appendChild(card);
    } else if (product.category === 'expendables') {
      expendablesContainer.appendChild(card);
    } else if (product.category === 'household') {
      householdContainer.appendChild(card);
    } else if (product.category === 'kitchen') {
      kitchenContainer.appendChild(card);
    }
  });
}

function getVisibleProducts() {
  const filteredProducts = filterProductsByName(products, searchQuery);
  return filteredProducts.filter((product) => product.category === activeCategory);
}

function updateProductView() {
  const visibleProducts = getVisibleProducts();
  renderProducts(visibleProducts);
  attachCardEvents();
  showNoResults(visibleProducts.length === 0);
}

function updateSearch(query) {
  searchQuery = query;
  updateProductView();
}

function updateProductStatus(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  product.status = getNextStatus(product.status);
  saveProducts(products);
  updateProductView();
}

function attachCardEvents() {
  const cards = Array.from(document.querySelectorAll('.product-card'));

  cards.forEach((card) => {
    const productId = card.dataset.productId;

    card.addEventListener('click', (event) => {
      if (event.target.closest('.card-actions')) {
        return;
      }
      updateProductStatus(productId);
    });

    const editButton = card.querySelector('.edit-card');
    const deleteButton = card.querySelector('.delete-card');

    if (editButton) {
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        openProductModal(productId);
      });
    }

    if (deleteButton) {
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteProduct(productId);
      });
    }
  });
}

function getNeedItems() {
  return products
    .filter((product) => product.status === 'need')
    .map((product) => ({
      id: product.id,
      name: product.name,
      quantity: 1,
      unit: product.unit || 'шт',
    }));
}

function getCurrentRequestItems() {
  const list = document.getElementById('request-list');
  if (!list) {
    return [];
  }

  return Array.from(list.querySelectorAll('.request-item')).map((item) => {
    const name = item.dataset.productName || '';
    const unit = item.dataset.productUnit || 'шт';
    const quantityInput = item.querySelector('.request-quantity-input');
    const quantity = Math.max(1, parseInt(quantityInput?.value, 10) || 1);
    return { name, quantity, unit };
  });
}

function formatRequestItem(item) {
  const unit = item.unit || 'шт';
  if (item.quantity === 1) {
    return unit === 'шт' ? item.name : `${item.name} — 1 ${unit}`;
  }

  return `${item.name} — ${item.quantity} ${unit}`;
}

function renderRequestList(items) {
  const list = document.getElementById('request-list');
  const summary = document.getElementById('request-summary');

  list.innerHTML = '';

  if (items.length === 0) {
    summary.textContent = 'Нет товаров для заказа. Отметьте товары статусом «Нужно заказать».';
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Список пуст';
    list.appendChild(emptyItem);
    return;
  }

  summary.textContent = `Всего товаров: ${items.length}`;

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'request-item';
    listItem.dataset.productName = item.name;
    listItem.dataset.productUnit = item.unit || 'шт';
    listItem.innerHTML = `
      <span class="request-item-name">${item.name}</span>
      <label class="request-quantity-label">
        Кол-во
        <div class="request-quantity-control">
          <input type="number" min="1" value="${item.quantity}" class="request-quantity-input">
          <span class="request-unit">${item.unit || 'шт'}</span>
        </div>
      </label>
    `;
    list.appendChild(listItem);
  });
}

function copyRequestText() {
  const items = getCurrentRequestItems();
  const text = items.length === 0
    ? 'Нет товаров для заказа.'
    : items.map((item, index) => `${index + 1}. ${formatRequestItem(item)}`).join('\n');

  navigator.clipboard.writeText(text).catch(() => {
    console.warn('Не удалось скопировать заявку в буфер обмена');
  });
}

function resetRequestStatuses() {
  products = products.map((product) => {
    if (product.status === 'need') {
      return { ...product, status: 'have' };
    }
    return product;
  });
  saveProducts(products);
  updateProductView();
}

function openRequestModal(items) {
  renderRequestList(items);
  const modal = document.getElementById('request-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeRequestModal() {
  const modal = document.getElementById('request-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const mode = document.getElementById('product-modal-mode');
  const title = document.getElementById('product-modal-title');
  const inputId = document.getElementById('product-id');
  const inputName = document.getElementById('product-name');
  const inputDescription = document.getElementById('product-description');
  const inputCategory = document.getElementById('product-category');
  const inputUnit = document.getElementById('product-unit');

  if (!modal || !inputId || !inputName || !inputDescription || !inputCategory || !inputUnit) {
    console.error('Form elements not found. Check HTML IDs.');
    return;
  }

  if (productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    mode.textContent = 'Редактирование товара';
    title.textContent = 'Изменить товар';
    inputId.value = product.id;
    inputName.value = product.name;
    inputDescription.value = product.description;
    inputCategory.value = product.category;
    inputUnit.value = product.unit || 'шт';
  } else {
    mode.textContent = 'Добавление товара';
    title.textContent = 'Новый товар';
    inputId.value = '';
    inputName.value = '';
    inputDescription.value = '';
    inputCategory.value = 'bar';
    inputUnit.value = 'шт';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  inputName.focus();
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function deleteProduct(productId) {
  products = products.filter((product) => product.id !== productId);
  saveProducts(products);
  updateProductView();
}

function handleProductFormSubmit(event) {
  event.preventDefault();
  const inputId = document.getElementById('product-id');
  const inputName = document.getElementById('product-name');
  const inputDescription = document.getElementById('product-description');
  const inputCategory = document.getElementById('product-category');
  const inputUnit = document.getElementById('product-unit');

  const productData = {
    name: inputName.value.trim(),
    description: inputDescription.value.trim(),
    category: inputCategory.value,
    unit: inputUnit.value || 'шт',
  };

  if (!productData.name) {
    return;
  }

  if (inputId.value) {
    const product = products.find((item) => item.id === inputId.value);
    if (product) {
      product.name = productData.name;
      product.description = productData.description;
      product.category = productData.category;
      product.unit = productData.unit;
    }
  } else {
    const newId = `${productData.category}-${Date.now()}`;
    products.push({
      id: newId,
      ...productData,
      status: 'have',
    });
  }

  saveProducts(products);
  setActiveCategory(productData.category);
  closeProductModal();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker работает'))
      .catch((error) => console.warn('Ошибка регистрации Service Worker:', error));
  }
}

function setActiveCategory(category) {
  activeCategory = category;

  document.querySelectorAll('.category-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.category === category);
  });

  document.querySelectorAll('.section').forEach((section) => {
    section.hidden = section.dataset.category !== category;
  });

  updateProductView();
}

function setupCategoryTabs() {
  const buttons = Array.from(document.querySelectorAll('.category-btn'));

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveCategory(button.dataset.category);
    });
  });
}

function setupReminder() {
  initReminderModal(handleStartCheck, handleRemindLater);

  if (shouldShowReminder()) {
    openReminderModal();
  }
}

function handleStartCheck() {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
  reminderPaused = false;
  markTodayCheckDone();
}

function handleRemindLater() {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
  }

  reminderPaused = true;
  reminderTimeout = scheduleRemindLater(() => {
    openReminderModal();
    reminderTimeout = null;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  products = loadProducts();
  updateProductView();
  attachCardEvents();
  setupCategoryTabs();
  initSearchInput(updateSearch);
  setupReminder();
  registerServiceWorker();

  const requestButton = document.getElementById('generate-request');
  const addButton = document.getElementById('add-product');
  const copyButton = document.getElementById('copy-request');
  const resetButton = document.getElementById('reset-request');
  const closeProductButton = document.getElementById('close-product-modal');
  const cancelProductButton = document.getElementById('cancel-product');
  const productForm = document.getElementById('product-form');

  const closeRequestButtons = [
    document.getElementById('close-request'),
    document.getElementById('close-request-bottom'),
  ].filter(Boolean);

  if (!requestButton || !addButton || !closeProductButton || !cancelProductButton || !productForm) {
    console.error('Critical form elements not found');
    return;
  }

  if (requestButton) {
    requestButton.addEventListener('click', () => {
      const items = getNeedItems();
      openRequestModal(items);
    });
  }

  if (addButton) {
    addButton.addEventListener('click', () => openProductModal());
  }

  closeRequestButtons.forEach((button) => {
    if (button) button.addEventListener('click', closeRequestModal);
  });

  if (copyButton) {
    copyButton.addEventListener('click', () => {
      copyRequestText();
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetRequestStatuses();
      closeRequestModal();
    });
  }

  if (closeProductButton) {
    closeProductButton.addEventListener('click', closeProductModal);
  }

  if (cancelProductButton) {
    cancelProductButton.addEventListener('click', closeProductModal);
  }

  if (productForm) {
    productForm.addEventListener('submit', handleProductFormSubmit);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeRequestModal();
      closeProductModal();
      closeReminderModal();
    }
  });
});
