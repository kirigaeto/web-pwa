/* Логика ежедневных напоминаний */
import { loadData, saveData } from './storage.js';

const CHECK_DATE_KEY = 'daily-check-date';
const REMIND_DELAY_MS = 30 * 60 * 1000; // 30 минут

function getCurrentDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isTodayCheckDone() {
  const savedDate = loadData(CHECK_DATE_KEY);
  return savedDate === getCurrentDateKey();
}

export function markTodayCheckDone() {
  saveData(CHECK_DATE_KEY, getCurrentDateKey());
}

export function shouldShowReminder() {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 14 && !isTodayCheckDone();
}

export function scheduleRemindLater(callback) {
  return setTimeout(() => {
    if (shouldShowReminder()) {
      callback();
    }
  }, REMIND_DELAY_MS);
}
