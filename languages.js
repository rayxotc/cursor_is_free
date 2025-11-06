// Language settings page script

let selectedLanguage = 'en';

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize i18n
  await autoTranslate();
  
  // Get current language
  const result = await chrome.storage.local.get(['appLanguage']);
  selectedLanguage = result.appLanguage || 'en';
  
  // Mark current language as active
  updateActiveLanguage();
  
  // Back button
  document.getElementById('backButton').addEventListener('click', function() {
    window.location.href = 'settings.html';
  });
  
  // Language selection buttons
  const languageButtons = document.querySelectorAll('.language-item');
  languageButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const lang = this.getAttribute('data-lang');
      
      if (lang !== selectedLanguage) {
        selectedLanguage = lang;
        
        // Change language
        await changeLanguage(lang);
        
        // Update UI
        updateActiveLanguage();
        
        // Translate page with new language
        translatePage();
        
        // Show toast notification
        showToast(t('languages.saved'));
        
        // Reload after delay to apply translations everywhere
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  });
});

// Update active language indicator
function updateActiveLanguage() {
  const languageButtons = document.querySelectorAll('.language-item');
  languageButtons.forEach(button => {
    const lang = button.getAttribute('data-lang');
    if (lang === selectedLanguage) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

