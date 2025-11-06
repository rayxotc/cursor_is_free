// Internationalization (i18n) utility for multi-language support

// Available languages
const AVAILABLE_LANGUAGES = ['en', 'zh', 'ja', 'ko'];
const DEFAULT_LANGUAGE = 'en';

// Current translations cache
let currentTranslations = null;
let currentLanguage = null;

// Load translations for a specific language
async function loadTranslations(languageCode) {
  try {
    const response = await fetch(chrome.runtime.getURL(`locales/${languageCode}.json`));
    const translations = await response.json();
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for ${languageCode}:`, error);
    // Fallback to English
    if (languageCode !== DEFAULT_LANGUAGE) {
      return await loadTranslations(DEFAULT_LANGUAGE);
    }
    return null;
  }
}

// Get translation by key path (e.g., "popup.title")
function t(keyPath, fallback = '') {
  if (!currentTranslations) {
    return fallback || keyPath;
  }
  
  const keys = keyPath.split('.');
  let value = currentTranslations;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback || keyPath;
    }
  }
  
  return value || fallback || keyPath;
}

// Initialize i18n system
async function initI18n() {
  // Get saved language preference
  const result = await chrome.storage.local.get(['appLanguage']);
  const savedLanguage = result.appLanguage || DEFAULT_LANGUAGE;
  
  // Load translations
  currentLanguage = savedLanguage;
  currentTranslations = await loadTranslations(savedLanguage);
  
  return currentLanguage;
}

// Change language
async function changeLanguage(languageCode) {
  if (!AVAILABLE_LANGUAGES.includes(languageCode)) {
    console.error(`Language ${languageCode} is not available`);
    return false;
  }
  
  // Load new translations
  currentLanguage = languageCode;
  currentTranslations = await loadTranslations(languageCode);
  
  // Save preference
  await chrome.storage.local.set({ appLanguage: languageCode });
  
  return true;
}

// Get current language
function getCurrentLanguage() {
  return currentLanguage || DEFAULT_LANGUAGE;
}

// Translate all elements with data-i18n attribute
function translatePage() {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key);
    
    if (translation && translation !== key) {
      // Check if it's a placeholder
      if (element.hasAttribute('placeholder')) {
        element.setAttribute('placeholder', translation);
      } else {
        element.textContent = translation;
      }
    }
  });
}

// Auto-translate page on load
async function autoTranslate() {
  await initI18n();
  translatePage();
}

// Get form field keywords for current language
function getFormFieldKeywords(fieldType) {
  if (!currentTranslations || !currentTranslations.formFields) {
    return [];
  }
  
  return currentTranslations.formFields[fieldType] || [];
}

// Get all form field keywords (for all field types in current language)
function getAllFormFieldKeywords() {
  if (!currentTranslations || !currentTranslations.formFields) {
    return {};
  }
  
  return currentTranslations.formFields;
}

