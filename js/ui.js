/* Логика пользовательского интерфейса */

export function initSearchInput(onSearch) {
  const input = document.getElementById('search-input');
  if (!input) {
    return;
  }

  input.addEventListener('input', () => {
    onSearch(input.value);
  });
}

export function setSearchInput(value) {
  const input = document.getElementById('search-input');
  if (input) {
    input.value = value;
  }
}

export function showNoResults(show) {
  const element = document.getElementById('no-results');
  if (!element) {
    return;
  }
  element.hidden = !show;
}

export function initReminderModal(onStartCheck, onRemindLater) {
  const modal = document.getElementById('reminder-modal');
  const startButton = document.getElementById('start-check');
  const laterButton = document.getElementById('remind-later');
  const closeButton = document.getElementById('close-reminder-modal');

  if (startButton) {
    startButton.addEventListener('click', () => {
      onStartCheck();
      closeReminderModal();
    });
  }

  if (laterButton) {
    laterButton.addEventListener('click', () => {
      onRemindLater();
      closeReminderModal();
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeReminderModal);
  }
}

export function openReminderModal() {
  const modal = document.getElementById('reminder-modal');
  if (!modal) {
    return;
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

export function closeReminderModal() {
  const modal = document.getElementById('reminder-modal');
  if (!modal) {
    return;
  }

  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
