// Settings page script

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize i18n
  await autoTranslate();
  
  const cardBINInput = document.getElementById('cardBIN');
  const expiryMonthInput = document.getElementById('expiryMonth');
  const expiryYearInput = document.getElementById('expiryYear');
  const cvvInput = document.getElementById('cvv');
  
  const currentBINDisplay = document.getElementById('currentBIN');
  const currentExpiryDisplay = document.getElementById('currentExpiry');
  const currentCVVDisplay = document.getElementById('currentCVV');
  
  const saveButton = document.getElementById('saveButton');
  const resetButton = document.getElementById('resetButton');
  const backButton = document.getElementById('backButton');
  const notification = document.getElementById('saveNotification');

  const DEFAULT_BIN = '625967';

  // Load saved settings
  chrome.storage.local.get(['customCardBIN', 'customExpiryMonth', 'customExpiryYear', 'customCVV'], function(result) {
    const savedBIN = result.customCardBIN || DEFAULT_BIN;
    cardBINInput.value = savedBIN;
    currentBINDisplay.textContent = savedBIN;
    
    if (result.customExpiryMonth && result.customExpiryYear) {
      expiryMonthInput.value = result.customExpiryMonth;
      expiryYearInput.value = result.customExpiryYear;
      currentExpiryDisplay.textContent = `${result.customExpiryMonth}/${result.customExpiryYear}`;
    } else {
      currentExpiryDisplay.textContent = 'Random';
    }
    
    if (result.customCVV) {
      cvvInput.value = result.customCVV;
      currentCVVDisplay.textContent = result.customCVV;
    } else {
      currentCVVDisplay.textContent = 'Random';
    }
  });

  // Save settings
  saveButton.addEventListener('click', function() {
    let binValue = cardBINInput.value.trim();
    let monthValue = expiryMonthInput.value.trim();
    let yearValue = expiryYearInput.value.trim();
    let cvvValue = cvvInput.value.trim();
    
    // Validate BIN
    if (binValue === '') {
      binValue = DEFAULT_BIN;
    }
    
    if (!/^\d{6,8}$/.test(binValue)) {
      alert('Please enter a valid 6-8 digit BIN number');
      return;
    }
    
    // Validate Expiry (optional)
    if (monthValue && !/^(0[1-9]|1[0-2])$/.test(monthValue)) {
      alert('Please enter a valid month (01-12) or leave empty for random');
      return;
    }
    
    if (yearValue && !/^\d{2}$/.test(yearValue)) {
      alert('Please enter a valid 2-digit year or leave empty for random');
      return;
    }
    
    // If one expiry field is filled, both should be filled
    if ((monthValue && !yearValue) || (!monthValue && yearValue)) {
      alert('Please fill both month and year, or leave both empty for random');
      return;
    }
    
    // Validate CVV (optional)
    if (cvvValue && !/^\d{3}$/.test(cvvValue)) {
      alert('Please enter a valid 3-digit CVV or leave empty for random');
      return;
    }

    // Prepare settings object
    const settings = {
      customCardBIN: binValue
    };
    
    if (monthValue && yearValue) {
      settings.customExpiryMonth = monthValue;
      settings.customExpiryYear = yearValue;
    } else {
      settings.customExpiryMonth = null;
      settings.customExpiryYear = null;
    }
    
    if (cvvValue) {
      settings.customCVV = cvvValue;
    } else {
      settings.customCVV = null;
    }

    // Save to storage
    chrome.storage.local.set(settings, function() {
      currentBINDisplay.textContent = binValue;
      currentExpiryDisplay.textContent = (monthValue && yearValue) ? `${monthValue}/${yearValue}` : 'Random';
      currentCVVDisplay.textContent = cvvValue || 'Random';
      showNotification();
      console.log('Settings saved:', settings);
    });
  });

  // Reset to default
  resetButton.addEventListener('click', function() {
    if (confirm('Reset all settings to default?')) {
      cardBINInput.value = DEFAULT_BIN;
      expiryMonthInput.value = '';
      expiryYearInput.value = '';
      cvvInput.value = '';
      
      chrome.storage.local.set({ 
        customCardBIN: DEFAULT_BIN,
        customExpiryMonth: null,
        customExpiryYear: null,
        customCVV: null
      }, function() {
        currentBINDisplay.textContent = DEFAULT_BIN;
        currentExpiryDisplay.textContent = 'Random';
        currentCVVDisplay.textContent = 'Random';
        showNotification();
        console.log('Settings reset to default');
      });
    }
  });

  // Back button
  backButton.addEventListener('click', function() {
    window.location.href = 'popup.html';
  });

  // Manage Accounts button
  const manageAccountsBtn = document.getElementById('manageAccountsBtn');
  if (manageAccountsBtn) {
    manageAccountsBtn.addEventListener('click', function() {
      window.location.href = 'accounts.html';
    });
  }
  
  // Change Language button
  const changeLanguageBtn = document.getElementById('changeLanguageBtn');
  if (changeLanguageBtn) {
    changeLanguageBtn.addEventListener('click', function() {
      window.location.href = 'languages.html';
    });
  }

  // Show notification
  function showNotification() {
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
    }, 2000);
  }

  // Auto-format inputs (only allow numbers)
  cardBINInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '');
  });
  
  expiryMonthInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '');
  });
  
  expiryYearInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '');
  });
  
  cvvInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '');
  });
});

