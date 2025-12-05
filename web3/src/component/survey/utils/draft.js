// web1/src/component/survey/utils/draft.js
// 설문 임시저장 로컬스토리지 유틸

import { STORAGE_KEYS } from "./constants";

const safeParse = (raw, fallback = {}) => {
  try {
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
};

export const getDraft = (key = STORAGE_KEYS.SURVEY_DRAFT) => {
  try {
    return safeParse(window.localStorage.getItem(key), {});
  } catch {
    return {};
  }
};

export const saveDraft = (data, key = STORAGE_KEYS.SURVEY_DRAFT) => {
  try {
    const prev = getDraft(key);
    const next = { ...prev, ...data };
    window.localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch {
    return data || {};
  }
};

export const overwriteDraft = (data, key = STORAGE_KEYS.SURVEY_DRAFT) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(data || {}));
    return data || {};
  } catch {
    return data || {};
  }
};

export const clearDraft = (key = STORAGE_KEYS.SURVEY_DRAFT) => {
  try {
    window.localStorage.removeItem(key);
  } catch {}
};

export const mergeIntoDraft = (updater, key = STORAGE_KEYS.SURVEY_DRAFT) => {
  const prev = getDraft(key);
  const patch = typeof updater === "function" ? updater(prev) : updater;
  return saveDraft(patch || {}, key);
};

export default {
  getDraft,
  saveDraft,
  overwriteDraft,
  clearDraft,
  mergeIntoDraft,
};
