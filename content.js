// Content script - runs on all pages and handles automation
console.log('🚀 AUTO SIGNUP CONTENT SCRIPT STARTING...');

// ⚙️ CONFIG: TempMailApi key (using demo key from docs)
// Replace with your own key from https://tempmailapi.com if needed
if (typeof TEMP_MAIL_API_KEY === 'undefined') {
  var TEMP_MAIL_API_KEY = 'CZXXyF8jg5JRH7UbQWVYiKMQjQznCB6';
}

// Prevent multiple injections and variable redeclaration
if (window.hasRun) {
  console.log('⚠️ Content script already running, skipping...');
} else {
  window.hasRun = true;
  console.log('✅ Initializing content script...');
  
  // Initialize variables on window object to prevent redeclaration
  window.isAutomationRunning = false;
  window.generatedData = {
    name: null,
    email: null,
    emailData: null,
    card: null,
    otp: null,
    password: null
  };
  
  // Initialize helper functions on window object to prevent redeclaration
  window.isAutomationRunningFn = () => window.isAutomationRunning || false;
  window.setAutomationRunningFn = (value) => { window.isAutomationRunning = value; };
  window.getGeneratedDataFn = () => window.generatedData || { name: null, email: null, emailData: null, card: null, otp: null, password: null };
  window.setGeneratedDataFn = (data) => { window.generatedData = { ...window.generatedData, ...data }; };
  window.resetGeneratedDataFn = () => { window.generatedData = { name: null, email: null, emailData: null, card: null, otp: null, password: null }; };
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('📨 Message received:', request.action);
    
    if (request.action === 'startAutomation') {
      console.log('🎬 Starting full automation...');
      startAutomation();
      sendResponse({ status: 'started' });
    } else if (request.action === 'startStripeOnly') {
      console.log('💳 Starting Stripe-only mode...');
      startStripeOnlyMode();
      sendResponse({ status: 'started' });
    } else if (request.action === 'stopAutomation') {
      console.log('🛑 Stopping automation...');
      setAutomationRunning(false);
      updateStatus('Stopped by user', 'error');
      sendResponse({ status: 'stopped' });
    }
    return true;
  });
  
  console.log('✅ Auto Signup content script loaded successfully!');
  console.log('📍 Current URL:', window.location.href);
  
  // Check if we should auto-continue automation after refresh
  chrome.storage.local.get(['autoSignupContinueAfterRefresh'], function(result) {
    if (result.autoSignupContinueAfterRefresh) {
      console.log('🔄 Detected refresh flag, continuing automation...');
      // Longer delay to ensure page is FULLY loaded (increased from 1s to 3s)
      setTimeout(() => {
        startAutomation();
      }, 3000);
    }
  });
}

// Helper functions that use window object (safe from redeclaration)
function isAutomationRunning() { return window.isAutomationRunningFn ? window.isAutomationRunningFn() : false; }
function setAutomationRunning(value) { if (window.setAutomationRunningFn) window.setAutomationRunningFn(value); }
function getGeneratedData() { return window.getGeneratedDataFn ? window.getGeneratedDataFn() : { name: null, email: null, emailData: null, card: null, otp: null, password: null }; }
function setGeneratedData(data) { if (window.setGeneratedDataFn) window.setGeneratedDataFn(data); }
function resetGeneratedData() { if (window.resetGeneratedDataFn) window.resetGeneratedDataFn(); }

// Clear all storage and cookies before automation (fast and reliable)
async function clearAllStorageAndCookies() {
  console.log('🧹 Clearing localStorage, sessionStorage, and cookies...');
  
  // Clear localStorage and sessionStorage synchronously (fast)
  try {
    localStorage.clear();
    console.log('✅ localStorage cleared');
  } catch (e) {
    console.log('⚠️ localStorage clear error:', e);
  }
  
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  } catch (e) {
    console.log('⚠️ sessionStorage clear error:', e);
  }
  
  // Clear cookies via background script (Chrome API)
  const domain = window.location.hostname;
  return new Promise((resolve) => {
    // Also try to clear cookies visible to document.cookie (for same-origin) first
    try {
      const documentCookies = document.cookie.split(';');
      documentCookies.forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          // Try multiple paths and domains
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
        }
      });
    } catch (e) {
      // Ignore errors
    }
    
    // Send message to background script to clear cookies via Chrome API
    try {
      chrome.runtime.sendMessage({
        type: 'clearCookies',
        domain: domain
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('⚠️ Message error:', chrome.runtime.lastError.message);
          resolve(); // Resolve anyway to continue
          return;
        }
        
        if (response && response.success) {
          console.log(`✅ Cookies cleared via Chrome API: ${response.cleared} cookies`);
        } else {
          console.log('⚠️ Cookie clearing error:', response?.error || 'Unknown error');
        }
        
        resolve();
      });
    } catch (e) {
      console.log('⚠️ Error sending message to background:', e);
      resolve(); // Resolve anyway to continue
    }
  });
}

async function startAutomation() {
  setAutomationRunning(true);
  
  // Check if we should continue after refresh
  const shouldContinue = await chrome.storage.local.get(['autoSignupContinueAfterRefresh']);
  
  if (shouldContinue.autoSignupContinueAfterRefresh) {
    // Clear the flag
    await chrome.storage.local.remove(['autoSignupContinueAfterRefresh']);
    
    // Continue with automation (storage already cleared)
    await updateStatus('Page refreshed, waiting for full load...', 'running');
    // Wait longer for page to fully load and render (increased from 500ms to 2s)
    await sleep(2000);
    
    // Clear all previous generated data to ensure fresh start
    resetGeneratedData();
    
    // Clear stored email from Chrome storage
    await chrome.storage.local.remove(['generatedEmail']);
    
    await updateStatus('Starting automation...', 'running');
  } else {
    // Step 0: Clear storage and cookies, then refresh page
    await updateStatus('Clearing storage and cookies...', 'running');
    await clearAllStorageAndCookies();
    await updateStatus('Refreshing page...', 'running');
    await sleep(500);
    
    // Set flag to continue after refresh
    await chrome.storage.local.set({ autoSignupContinueAfterRefresh: true });
    
    // Refresh the page to ensure clean state
    window.location.reload();
    return; // Exit - will restart after reload
  }
  
  try {
    // Step 1: Generate random name
    await updateStatus('Generating random name...', 'running');
    const nameData = await generateRandomName();
    setGeneratedData({ name: nameData.fullName });
    
    // Save and update UI
    chrome.storage.local.set({ generatedName: nameData.fullName });
    chrome.runtime.sendMessage({
      type: 'dataUpdate',
      name: nameData.fullName
    });
    
    await sleep(800);
    if (shouldStopAutomation()) return;
    
    // Step 2: Fill name fields
    await updateStatus('Filling name fields...', 'running');
    await fillNameFields(nameData);
    await sleep(800); // Longer wait to ensure fields are filled
    if (shouldStopAutomation()) return;
    
    // Step 3: Generate temp email
    await updateStatus('Generating temporary email...', 'running');
    const email = await generateTempEmail();
    setGeneratedData({ email: email });
    
    chrome.storage.local.set({ generatedEmail: email });
    chrome.runtime.sendMessage({
      type: 'dataUpdate',
      email: email
    });
    
    await sleep(500);
    if (shouldStopAutomation()) return;
    
    // Step 4: Fill email field
    await updateStatus('Filling email field...', 'running');
    await fillEmailField(email);
    await sleep(500);
    if (shouldStopAutomation()) return;
    
    // Step 5: Click signup button
    await updateStatus('Clicking signup button...', 'running');
    await clickSignupButton();
    if (shouldStopAutomation()) return;
    
    // Step 6: Wait patiently for password screen to load
    await updateStatus('Waiting for password screen...', 'running');
    await waitForPasswordScreen();
    if (shouldStopAutomation()) return;
    
    // Step 7: Generate and enter password
    await updateStatus('Generating password...', 'running');
    const password = generateSecurePassword();
    setGeneratedData({ password: password });
    
    await updateStatus('Entering password...', 'running');
    await fillPasswordField(password);
    await sleep(500);
    if (shouldStopAutomation()) return;
    
    // Step 8: Click continue/next button to generate OTP
    await updateStatus('Clicking continue button...', 'running');
    await clickPasswordContinueButton();
    await sleep(1000);
    if (shouldStopAutomation()) return;
    
    // Step 9: Wait for OTP screen (URL contains 'magic-code')
    await updateStatus('Waiting for OTP screen...', 'running');
    await waitForOTPScreen();
    if (shouldStopAutomation()) return;
    
    // Step 10: Wait for OTP input field to appear
    await updateStatus('Waiting for OTP field...', 'running');
    await waitForOTPField();
    if (shouldStopAutomation()) return;
    
    await updateStatus('Fetching OTP from email...', 'running');
    const otp = await fetchOTPFromEmail(email);
    setGeneratedData({ otp: otp });
    if (shouldStopAutomation()) return;
    
    // Step 11: Enter OTP
    await updateStatus('Entering OTP...', 'running');
    await fillOTPField(otp);
    console.log('✅ OTP entered successfully!');
    
    await sleep(2000);
    
    // Step 12: Save account credentials immediately (after OTP verification, before Stripe)
    await updateStatus('Saving account credentials...', 'running');
    await saveAccountCredentials(email, password, nameData.fullName);
    console.log('✅ Account credentials saved successfully!');
    
    // Step 13: Store credentials temporarily (will save again after Stripe payment for confirmation)
    await chrome.storage.local.set({ 
      pendingAccount: {
        email: email,
        password: password,
        name: nameData.fullName
      }
    });
    console.log('💾 Credentials stored temporarily for Stripe confirmation');
    
    // Complete - Stop here and guide user
    console.log('✅ Account creation complete!');
    console.log('📋 Next steps: Click "Continue with free trial" then use Stripe Only mode');
    
    chrome.runtime.sendMessage({ 
      type: 'automationPaused',
      nextStep: 'trial'
    });
    await updateStatus('Account created! See instructions below', 'success');
    
  } catch (error) {
    console.error('Automation error:', error);
    
    // Clear pending account on error
    await chrome.storage.local.remove(['pendingAccount']);
    
    chrome.runtime.sendMessage({ 
      type: 'automationError',
      message: error.message 
    });
    await updateStatus('Error: ' + error.message, 'error');
  }
  
  setAutomationRunning(false);
}

// Helper function to update status
function updateStatus(message, status) {
  chrome.runtime.sendMessage({
    type: 'statusUpdate',
    message: message,
    status: status
  });
}

// Helper function to check if automation should continue
function shouldStopAutomation() {
  // Directly check window.isAutomationRunning (more reliable)
  const isRunning = window.isAutomationRunning || false;
  if (!isRunning) {
    console.log('🛑 Automation stopped by user');
    return true;
  }
  return false;
}

// Generate random name with cultural awareness
// In East Asian cultures (Chinese, Japanese, Korean), surname comes FIRST
async function generateRandomName() {
  // Get current language to determine name order and names to use
  let currentLanguage = 'en';
  try {
    const result = await chrome.storage.local.get(['appLanguage']);
    currentLanguage = result.appLanguage || 'en';
  } catch (e) {
    console.log('Could not get language preference, using default');
  }
  
  let firstName, lastName;
  
  // Generate names based on language/culture
  if (currentLanguage === 'zh') {
    // Chinese names
    const chineseGivenNames = ['明', '伟', '芳', '娜', '强', '静', '敏', '磊', '洋', '艳'];
    const chineseSurnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周'];
    firstName = chineseGivenNames[Math.floor(Math.random() * chineseGivenNames.length)];
    lastName = chineseSurnames[Math.floor(Math.random() * chineseSurnames.length)];
    // Chinese format: Surname + GivenName (no space)
    return { firstName, lastName, fullName: `${lastName}${firstName}` };
    
  } else if (currentLanguage === 'ja') {
    // Japanese names
    const japaneseGivenNames = ['太郎', '花子', '健', '美咲', '翔', '愛', '大輔', '陽子', '隆', '真理'];
    const japaneseSurnames = ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤'];
    firstName = japaneseGivenNames[Math.floor(Math.random() * japaneseGivenNames.length)];
    lastName = japaneseSurnames[Math.floor(Math.random() * japaneseSurnames.length)];
    // Japanese format: Surname + space + GivenName
    return { firstName, lastName, fullName: `${lastName} ${firstName}` };
    
  } else if (currentLanguage === 'ko') {
    // Korean names
    const koreanGivenNames = ['민수', '지은', '현우', '수진', '준호', '미영', '성민', '은지', '동현', '수아'];
    const koreanSurnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    firstName = koreanGivenNames[Math.floor(Math.random() * koreanGivenNames.length)];
    lastName = koreanSurnames[Math.floor(Math.random() * koreanSurnames.length)];
    // Korean format: Surname + space + GivenName
    return { firstName, lastName, fullName: `${lastName} ${firstName}` };
    
  } else {
    // Western names (English and others)
    const westernFirstNames = [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'
  ];
  
    const westernLastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
  ];
  
    firstName = westernFirstNames[Math.floor(Math.random() * westernFirstNames.length)];
    lastName = westernLastNames[Math.floor(Math.random() * westernLastNames.length)];
    // Western format: FirstName + space + LastName
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
  }
}

// Generate secure password
function generateSecurePassword() {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Multi-language form field detection
// Get selectors for a field type based on current language keywords
function getMultiLanguageSelectors(fieldType) {
  // Default English keywords if i18n not loaded
  const defaultKeywords = {
    firstName: ['first name', 'firstname', 'fname', 'given name'],
    lastName: ['last name', 'lastname', 'lname', 'surname', 'family name'],
    fullName: ['full name', 'name', 'your name'],
    email: ['email', 'e-mail', 'email address'],
    password: ['password', 'pass', 'pwd'],
    card: ['card number', 'card', 'credit card'],
    expiry: ['expiry', 'expiration', 'exp'],
    cvv: ['cvv', 'cvc', 'security code'],
    address: ['address', 'street'],
    city: ['city'],
    state: ['state', 'province'],
    zip: ['zip', 'postal'],
    country: ['country']
  };
  
  // Try to get keywords from i18n
  let keywords = defaultKeywords[fieldType] || [];
  
  // If i18n is loaded, get localized keywords
  if (typeof getAllFormFieldKeywords === 'function') {
    try {
      const localizedKeywords = getAllFormFieldKeywords();
      if (localizedKeywords && localizedKeywords[fieldType]) {
        keywords = localizedKeywords[fieldType];
      }
    } catch (e) {
      console.log('⚠️ Could not load localized keywords, using defaults');
    }
  }
  
  // Generate selectors for all keywords
  const selectors = [];
  
  // Add the OLD ROBUST SELECTORS that worked before PR (for English compatibility)
  if (fieldType === 'firstName') {
    selectors.push('input[name*="first" i][name*="name" i]');
    selectors.push('input[placeholder*="first" i][placeholder*="name" i]');
    selectors.push('input[id*="first" i][id*="name" i]');
    selectors.push('input[name="firstName"]');
    selectors.push('input[id="firstName"]');
    selectors.push('input[name="fname"]');
  } else if (fieldType === 'lastName') {
    selectors.push('input[name*="last" i][name*="name" i]');
    selectors.push('input[placeholder*="last" i][placeholder*="name" i]');
    selectors.push('input[id*="last" i][id*="name" i]');
    selectors.push('input[name="lastName"]');
    selectors.push('input[id="lastName"]');
    selectors.push('input[name="lname"]');
  }
  
  // Add multi-language selectors
  keywords.forEach(keyword => {
    // Escape special characters for CSS selector
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Add various selector patterns
    selectors.push(`input[name*="${escapedKeyword}" i]`);
    selectors.push(`input[placeholder*="${escapedKeyword}" i]`);
    selectors.push(`input[id*="${escapedKeyword}" i]`);
    selectors.push(`input[aria-label*="${escapedKeyword}" i]`);
    selectors.push(`input[title*="${escapedKeyword}" i]`);
  });
  
  return selectors;
}

// Fill name fields with multi-language support
async function fillNameFields(nameData) {
  console.log('🌐 Filling name fields with multi-language support...');
  console.log('📝 Name data:', nameData);
  
  // Get localized selectors
  const firstNameSelectors = getMultiLanguageSelectors('firstName');
  const lastNameSelectors = getMultiLanguageSelectors('lastName');
  
  console.log('🔍 Searching for first name field with', firstNameSelectors.length, 'selectors');
  let firstNameField = findElement(firstNameSelectors);
  
  console.log('🔍 Searching for last name field with', lastNameSelectors.length, 'selectors');
  let lastNameField = findElement(lastNameSelectors);
  
  if (firstNameField) {
    console.log('✅ Found first name field:', firstNameField.name || firstNameField.id || firstNameField.placeholder);
    fillInput(firstNameField, nameData.firstName);
    console.log('✅ Filled first name:', nameData.firstName);
    await sleep(300); // Small delay between fields
  } else {
    console.warn('⚠️ First name field not found');
  }
  
  if (lastNameField) {
    console.log('✅ Found last name field:', lastNameField.name || lastNameField.id || lastNameField.placeholder);
    fillInput(lastNameField, nameData.lastName);
    console.log('✅ Filled last name:', nameData.lastName);
    await sleep(300);
  } else {
    console.warn('⚠️ Last name field not found');
  }
  
  // If no separate fields, look for full name field
  if (!firstNameField && !lastNameField) {
    console.log('🔍 No separate name fields found, looking for full name field...');
    const fullNameSelectors = getMultiLanguageSelectors('fullName');
    let fullNameField = findElement(fullNameSelectors);
    
    if (fullNameField) {
      console.log('✅ Found full name field:', fullNameField.name || fullNameField.id || fullNameField.placeholder);
      fillInput(fullNameField, nameData.fullName);
      console.log('✅ Filled full name:', nameData.fullName);
    } else {
      console.error('❌ No name fields found at all!');
    }
  }
}

// Generate temp email using TempMailApi
async function generateTempEmail() {
  try {
    // Clear any previous email data to ensure fresh generation
    setGeneratedData({ email: null, emailData: null });
    
    // Add cache-busting timestamp to ensure unique email generation
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueParam = `${timestamp}_${randomSuffix}`;
    
    // Make API request with cache-busting parameter
    const response = await fetch(`https://tempmailapi.com/api/emails/${TEMP_MAIL_API_KEY}?_=${uniqueParam}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'Failed to create temp email');
    }
    
    // Store email for later OTP fetching
    setGeneratedData({ emailData: result.data });
    
    console.log('✅ Generated new temp email:', result.data.email);
    
    return result.data.email;
  } catch (error) {
    throw new Error('Failed to generate temp email: ' + error.message);
  }
}

// Fill email field with multi-language support
async function fillEmailField(email) {
  console.log('🌐 Filling email field with multi-language support...');
  
  // Always include type="email" as first option
  const emailSelectors = ['input[type="email"]'].concat(getMultiLanguageSelectors('email'));
  
  let emailField = findElement(emailSelectors);
  
  if (emailField) {
    console.log('✅ Found email field');
    fillInput(emailField, email);
  } else {
    throw new Error('Email field not found');
  }
}

// Fill password field with multi-language support
async function fillPasswordField(password) {
  console.log('🌐 Filling password field with multi-language support...');
  
  // Always include type="password" as first option
  const passwordSelectors = ['input[type="password"]', 'input[autocomplete="new-password"]'].concat(getMultiLanguageSelectors('password'));
  
  let passwordField = findElement(passwordSelectors);
  
  if (passwordField) {
    console.log('✅ Found password field, clicking to focus...');
    
    // Scroll into view
    passwordField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(300);
    
    // Click to focus the field
    passwordField.click();
    await sleep(200);
    
    console.log('✅ Filling password field...');
    fillInput(passwordField, password);
  } else {
    throw new Error('Password field not found');
  }
}

// Click continue button on password screen
async function clickPasswordContinueButton() {
  const continueSelectors = [
    'button[type="submit"]',
    'input[type="submit"]'
  ];
  
  let button = findElement(continueSelectors);
  
  if (!button) {
    // Try text-based search
    button = findButtonByText(['continue', 'next', 'submit', 'sign up']);
  }
  
  if (button) {
    console.log('✅ Found continue button, clicking...');
    button.click();
    await sleep(300);
  } else {
    throw new Error('Continue button not found on password screen');
  }
}

// Wait for screen to change (URL or DOM)
async function waitForNextScreen(timeout = 10000) {
  const currentUrl = window.location.href;
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // Check if URL changed
      if (window.location.href !== currentUrl) {
        clearInterval(checkInterval);
        resolve();
        return;
      }
      
      // Check if we've waited long enough
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(); // Continue anyway
      }
    }, 200);
  });
}

// Wait patiently for password screen (sign-up/password URL)
async function waitForPasswordScreen(timeout = 30000) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      // Check if automation was stopped
      if (shouldStopAutomation()) {
        clearInterval(checkInterval);
        reject(new Error('Automation stopped by user'));
        return;
      }
      
      const currentUrl = window.location.href;
      
      // Check if we're on the password screen
      if (currentUrl.includes('/sign-up/password') || 
          currentUrl.includes('authenticator.cursor.sh/sign-up/password')) {
        clearInterval(checkInterval);
        console.log('✅ Password screen loaded!');
        resolve();
        return;
      }
      
      // Also check for similar patterns
      if (currentUrl.includes('/password') && currentUrl.includes('state=')) {
        clearInterval(checkInterval);
        console.log('✅ Password screen detected!');
        resolve();
        return;
      }
      
      // Timeout check
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.log('⚠️ Password screen wait timeout, continuing...');
        resolve(); // Continue anyway
      }
    }, 300); // Check every 300ms
  });
}

// Wait for OTP screen (magic-code URL)
async function waitForOTPScreen(timeout = 30000) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // Check if already on OTP screen
    if (window.location.href.includes('magic-code') || 
        window.location.href.includes('verify') ||
        window.location.href.includes('otp')) {
      resolve();
      return;
    }
    
    const checkInterval = setInterval(() => {
      // Check if automation was stopped
      if (shouldStopAutomation()) {
        clearInterval(checkInterval);
        reject(new Error('Automation stopped by user'));
        return;
      }
      
      // Check if URL contains magic-code or verify
      if (window.location.href.includes('magic-code') || 
          window.location.href.includes('verify') ||
          window.location.href.includes('otp')) {
        clearInterval(checkInterval);
        resolve();
        return;
      }
      
      // Timeout check
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(); // Continue anyway, OTP field detection will handle it
      }
    }, 200);
  });
}

// Find and click "Continue with free trial" button (simplified - no URL checks)
async function findAndClickFreeTrialButton(timeout = 30000) {
  try {
    await updateStatus('Looking for trial button...', 'running');
    console.log('🔍 Searching for "Continue with free trial" button...');
    console.log('🔍 Current URL:', window.location.href);
    
    let button = null;
    const buttonSearchStart = Date.now();
    const buttonTimeout = 30000; // 30 seconds for button search
    
    // Wait a bit for page to fully render
    await sleep(1000);
    
    // Poll for button with multiple detection methods
    while (Date.now() - buttonSearchStart < buttonTimeout && !button) {
      // Method 1: Simple text search - most reliable
      const allButtons = document.querySelectorAll('button');
      console.log(`🔍 Checking ${allButtons.length} buttons on page...`);
      
      for (let btn of allButtons) {
        const text = btn.textContent.trim();
        console.log(`  - Button text: "${text}"`);
        
        if (text === 'Continue with free trial') {
          button = btn;
          console.log('✅ Method 1: Found exact text match!');
          break;
        }
      }
      
      // Method 2: Case-insensitive match
      if (!button) {
        for (let btn of allButtons) {
          const text = btn.textContent.trim().toLowerCase();
          if (text === 'continue with free trial') {
            button = btn;
            console.log('✅ Method 2: Found case-insensitive match!');
            break;
          }
        }
      }
      
      // Method 3: Partial match - contains all keywords
      if (!button) {
        for (let btn of allButtons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('continue') && text.includes('free') && text.includes('trial')) {
            button = btn;
            console.log('✅ Method 3: Found via keyword match:', btn.textContent.trim());
            break;
          }
        }
      }
      
      // Method 4: Class-based search
      if (!button) {
        const buttons = document.querySelectorAll('button.w-full.rounded-lg.bg-white');
        console.log(`🔍 Found ${buttons.length} buttons with classes w-full.rounded-lg.bg-white`);
        for (let btn of buttons) {
          if (btn.textContent.toLowerCase().includes('continue')) {
            button = btn;
            console.log('✅ Method 4: Found via class selector');
            break;
          }
        }
      }
      
      // Method 5: Any visible button with "trial"
      if (!button) {
        for (let btn of allButtons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('trial') && btn.offsetParent !== null && !btn.disabled) {
            button = btn;
            console.log('✅ Method 5: Found visible button with "trial":', btn.textContent.trim());
            break;
          }
        }
      }
      
      if (button) {
        break;
      }
      
      console.log('❌ No button found yet, waiting 500ms and retrying...');
      await sleep(500);
    }
    
    if (button) {
      await updateStatus('Clicking free trial button...', 'running');
      console.log('🎯 Free trial button found!');
      console.log('   Text:', button.textContent.trim());
      console.log('   Classes:', button.className);
      
      // Scroll into view
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(800);
      
      // Multiple click methods for reliability
      button.focus();
      await sleep(200);
      
      // Method 1: Direct click
      button.click();
      console.log('✅ Button clicked');
      
      // Method 2: Programmatic click (backup)
      await sleep(100);
      button.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      
      await sleep(2000);
    } else {
      console.log('❌ No free trial button found after timeout');
      await updateStatus('Button not found - Click manually', 'error');
      throw new Error('Free trial button not found on page. Please click manually.');
    }
  } catch (error) {
    console.log('❌ Trial button error:', error.message);
    console.error(error);
    throw error;
  }
}

// Legacy function names for compatibility
async function waitForTrialPageAndClickButton(timeout = 30000) {
  return await findAndClickFreeTrialButton(timeout);
}

async function waitAndClickFreeTrialButton(timeout = 30000) {
  return await findAndClickFreeTrialButton(timeout);
}

// Wait for payment/Stripe page
async function waitForPaymentPage(timeout = 30000) {
  await updateStatus('Waiting for payment page...', 'running');
  console.log('🔍 Waiting for Stripe checkout page...');
  
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const currentUrl = window.location.href;
      
      // Check for Stripe checkout URL
      const isStripeCheckout = currentUrl.includes('checkout.stripe.com');
      
      // Check for Stripe elements or payment indicators
      const hasStripeFrame = document.querySelector('iframe[src*="stripe"]') !== null;
      const hasPaymentFields = document.querySelector('input[name*="card" i], input[placeholder*="card" i]') !== null;
      const urlIndicatesPayment = currentUrl.includes('payment') || 
                                   currentUrl.includes('billing') ||
                                   currentUrl.includes('checkout');
      
      if (isStripeCheckout || hasStripeFrame || hasPaymentFields || urlIndicatesPayment) {
        console.log('✅ Payment page detected:', currentUrl);
        clearInterval(checkInterval);
        resolve();
        return;
      }
      
      // Timeout
      if (Date.now() - startTime > timeout) {
        console.log('⚠️ Payment page timeout - continuing anyway');
        clearInterval(checkInterval);
        resolve(); // Continue anyway
      }
    }, 300);
  });
}

// Click signup button
async function clickSignupButton() {
  const signupSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[id*="signup" i]',
    'button[class*="signup" i]',
    'input[type="submit"][value*="sign" i]'
  ];
  
  let button = findButtonByText(['sign up', 'signup', 'register', 'submit', 'continue']);
  
  if (button) {
    button.click();
  } else {
    throw new Error('Signup button not found');
  }
}

// Fetch OTP from email using TempMailApi
async function fetchOTPFromEmail(email) {
  try {
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      // Check if user stopped automation
      if (shouldStopAutomation()) {
        throw new Error('Automation stopped by user');
      }
      
      // Encode email for URL
      const encodedEmail = encodeURIComponent(email);
      
      // Fetch messages list
      const response = await fetch(
        `https://tempmailapi.com/api/messages/${TEMP_MAIL_API_KEY}/${encodedEmail}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status && result.data.messages && result.data.messages.length > 0) {
        // Get the latest message
        const latestMessage = result.data.messages[0];
        
        // Fetch full message body
        const msgResponse = await fetch(
          `https://tempmailapi.com/api/messages/${TEMP_MAIL_API_KEY}/message/${latestMessage.hash_id}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        const msgResult = await msgResponse.json();
        
        if (msgResult.status && msgResult.data.message) {
          const messageBody = msgResult.data.message.body;
          const messageSubject = msgResult.data.message.subject;
          
          console.log('========== EMAIL RECEIVED ==========');
          console.log('Subject:', messageSubject);
          console.log('Body:', messageBody);
          console.log('====================================');
          
          // Strip HTML tags to get clean text
          const cleanBody = messageBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
          const combinedText = messageSubject + '\n' + cleanBody;
          
          console.log('Clean Body:', cleanBody.substring(0, 500));
          
          let extractedOTP = null;
          
          // Priority 1: Look for "one-time code is:" pattern (Cursor specific)
          // Example: "Your one-time code is: 858698"
          let otpMatch = combinedText.match(/one-time code is[:\s]*(\d{6})/i);
          
          if (otpMatch) {
            extractedOTP = otpMatch[1];
            console.log('✅ Found OTP after "one-time code is:":', extractedOTP);
          }
          
          // Priority 2: Look for "code is:" pattern
          if (!extractedOTP) {
            otpMatch = combinedText.match(/\bcode is[:\s]*(\d{6})/i);
            if (otpMatch) {
              extractedOTP = otpMatch[1];
              console.log('✅ Found OTP after "code is:":', extractedOTP);
            }
          }
          
          // Priority 3: Look for pattern "Your code: 123456" or similar
          if (!extractedOTP) {
            otpMatch = combinedText.match(/(?:your|the)\s+code[:\s]+(\d{6})/i);
            if (otpMatch) {
              extractedOTP = otpMatch[1];
              console.log('✅ Found OTP after "your code:":', extractedOTP);
            }
          }
          
          // Priority 4: Look for exactly 6 digits in subject line
          if (!extractedOTP) {
            otpMatch = messageSubject.match(/\b(\d{6})\b/);
            if (otpMatch) {
              extractedOTP = otpMatch[1];
              console.log('✅ Found 6-digit OTP in subject:', extractedOTP);
            }
          }
          
          // Priority 5: Look for standalone 6 digits NOT part of longer numbers
          // Must be surrounded by non-digits or whitespace
          if (!extractedOTP) {
            // Match 6 digits that are NOT preceded or followed by more digits
            otpMatch = cleanBody.match(/(?<!\d)(\d{6})(?!\d)/);
            if (otpMatch) {
              const candidate = otpMatch[1];
              // Skip common false positives
              if (!candidate.startsWith('19') && 
                  !candidate.startsWith('20') && 
                  !candidate.match(/^(000000|111111|222222|333333|444444|555555|666666|777777|888888|999999)$/)) {
                extractedOTP = candidate;
                console.log('✅ Found standalone 6-digit OTP:', extractedOTP);
              }
            }
          }
          
          if (extractedOTP) {
            // Send email content to popup for display
            chrome.runtime.sendMessage({
              type: 'emailReceived',
              subject: messageSubject,
              body: cleanBody.substring(0, 500),
              otp: extractedOTP
            });
            
            return extractedOTP;
          }
          
          console.log('❌ No valid 6-digit OTP found in this message');
          console.log('All 6-digit numbers found:', cleanBody.match(/\d{6}/g));
        }
      }
      
      // Wait before retry
      await sleep(3000);
      attempts++;
    }
    
    throw new Error('OTP not received within timeout period');
    
  } catch (error) {
    throw new Error('Failed to fetch OTP: ' + error.message);
  }
}

// Wait for OTP field to appear
async function waitForOTPField(timeout = 15000) {
  const otpSelectors = [
    'input[data-test="otp-input"]',
    'input[inputmode="numeric"][maxlength="1"]',
    'input[pattern*="\\d"]',
    'input[name*="otp" i]',
    'input[name*="code" i]',
    'input[placeholder*="code" i]',
    'input[placeholder*="otp" i]',
    'input[id*="otp" i]',
    'input[id*="code" i]',
    'input[type="text"][maxlength="6"]',
    'input[type="tel"][maxlength="6"]',
    'input[autocomplete*="one-time-code"]',
    'input[inputmode="numeric"]',
    'input[maxlength="1"]'
  ];
  
  try {
    await waitForElement(otpSelectors, timeout);
    await updateStatus('OTP field found!', 'running');
  } catch (error) {
    throw new Error('OTP field not found on page');
  }
}

// Fill OTP field
async function fillOTPField(otp) {
  // First check for multi-input OTP fields (most common for Cursor)
  const multiInputSelectors = [
    'input[data-test="otp-input"]',
    'input[inputmode="numeric"][maxlength="1"]',
    'input[maxlength="1"]'
  ];
  
  let otpInputs = null;
  for (let selector of multiInputSelectors) {
    otpInputs = document.querySelectorAll(selector);
    if (otpInputs.length >= 4) {
      break;
    }
  }
  
  if (otpInputs && otpInputs.length >= 4) {
    console.log(`📝 Filling ${otpInputs.length} OTP inputs with: ${otp}`);
    
    for (let i = 0; i < Math.min(otp.length, otpInputs.length); i++) {
      const input = otpInputs[i];
      
      // Focus the input
      input.focus();
      await sleep(50);
      
      // Clear existing value
      input.value = '';
      
      // Set the value
      input.value = otp[i];
      
      // Trigger all necessary events
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Trigger keydown/keyup for the digit
      const keydownEvent = new KeyboardEvent('keydown', { 
        key: otp[i], 
        code: `Digit${otp[i]}`,
        keyCode: 48 + parseInt(otp[i]),
        bubbles: true 
      });
      input.dispatchEvent(keydownEvent);
      
      const keyupEvent = new KeyboardEvent('keyup', { 
        key: otp[i], 
        code: `Digit${otp[i]}`,
        keyCode: 48 + parseInt(otp[i]),
        bubbles: true 
      });
      input.dispatchEvent(keyupEvent);
      
      await sleep(100);
    }
    
    console.log('✅ All OTP digits entered');
    return;
  }
  
  // Fallback: Try single input field
  const singleFieldSelectors = [
    'input[name*="otp" i]',
    'input[name*="code" i]',
    'input[type="text"][maxlength="6"]',
    'input[autocomplete*="one-time-code"]'
  ];
  
  let otpField = findElement(singleFieldSelectors);
  
  if (otpField) {
    console.log('📝 Filling single OTP field with:', otp);
    fillInput(otpField, otp);
    await sleep(200);
    
    // Try to submit by pressing Enter
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true });
    otpField.dispatchEvent(enterEvent);
    console.log('✅ Single OTP field filled');
  } else {
    throw new Error('No OTP field found');
  }
}


// Generate test card data using Luhn algorithm
// Generate random US address
function generateRandomAddress() {
  const streets = [
    'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd',
    'Washington Blvd', 'Park Ave', 'Elm St', 'Broadway', 'Market St',
    'Lake Shore Dr', 'River Rd', 'Hill St', 'Forest Ave', 'Sunset Blvd'
  ];
  
  const cities = [
    { name: 'New York', state: 'NY', zip: '10001' },
    { name: 'Los Angeles', state: 'CA', zip: '90001' },
    { name: 'Chicago', state: 'IL', zip: '60601' },
    { name: 'Houston', state: 'TX', zip: '77001' },
    { name: 'Phoenix', state: 'AZ', zip: '85001' },
    { name: 'Philadelphia', state: 'PA', zip: '19101' },
    { name: 'San Antonio', state: 'TX', zip: '78201' },
    { name: 'San Diego', state: 'CA', zip: '92101' },
    { name: 'Dallas', state: 'TX', zip: '75201' },
    { name: 'Austin', state: 'TX', zip: '78701' },
    { name: 'Seattle', state: 'WA', zip: '98101' },
    { name: 'Denver', state: 'CO', zip: '80201' },
    { name: 'Portland', state: 'OR', zip: '97201' },
    { name: 'Miami', state: 'FL', zip: '33101' },
    { name: 'Atlanta', state: 'GA', zip: '30301' }
  ];
  
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  return {
    street: `${streetNumber} ${street}`,
    city: city.name,
    state: city.state,
    zip: city.zip,
    country: 'US'
  };
}

async function generateTestCardData() {
  // Get custom settings from storage or use defaults
  const result = await chrome.storage.local.get([
    'customCardBIN', 
    'customExpiryMonth', 
    'customExpiryYear', 
    'customCVV'
  ]);
  
  const cardBIN = result.customCardBIN || '625967';
  
  // Generate test card with custom or default BIN
  const cardNumber = generateLuhnNumber(cardBIN, 16);
  
  // Use custom expiry or generate random
  let month, year;
  if (result.customExpiryMonth && result.customExpiryYear) {
    month = result.customExpiryMonth;
    year = result.customExpiryYear;
  } else {
    const currentYear = new Date().getFullYear();
    month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    year = currentYear + Math.floor(Math.random() * 5) + 1;
    year = String(year).slice(-2);
  }
  
  // Use custom CVV or generate random
  const cvv = result.customCVV || String(Math.floor(Math.random() * 900) + 100);
  
  // Generate random cardholder name
  const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const cardholderName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  
  // Generate random address
  const address = generateRandomAddress();
  
  return {
    cardNumber,
    expiryMonth: month,
    expiryYear: year,
    expiryYearFull: year.length === 2 ? '20' + year : String(year),
    cvv,
    cardholderName,
    street: address.street,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
    formatted: `${cardNumber.match(/.{1,4}/g).join(' ')} ${month}/${year} ${cvv}`
  };
}

function generateLuhnNumber(prefix, length) {
  let cardNumber = prefix;
  const remainingLength = length - prefix.length - 1;
  
  for (let i = 0; i < remainingLength; i++) {
    cardNumber += Math.floor(Math.random() * 10);
  }
  
  let sum = 0;
  let isEven = true;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return cardNumber + checkDigit;
}

// Fill Stripe form
async function fillStripeForm(cardData) {
  await updateStatus('Filling Stripe payment form...', 'running');
  console.log('🔍 Looking for Stripe form fields...');
  
  // Wait a bit for Stripe to fully load
  await sleep(1500);
  
  // Step 1: Click card accordion button if it exists (for Stripe Checkout)
  const cardButton = document.querySelector('[data-testid="card-accordion-item-button"]');
  if (cardButton) {
    console.log('✅ Found card accordion button, clicking...');
    cardButton.click();
    await sleep(1000);
  }
  
  // Check if Stripe iframe exists
  const stripeFrames = document.querySelectorAll('iframe[name*="stripe" i], iframe[src*="stripe" i]');
  if (stripeFrames.length > 0) {
    console.log('✅ Stripe iframe detected:', stripeFrames.length, 'iframes');
  }
  
  // Step 2: Fill card number (improved selectors)
  const cardNumberSelectors = [
    'input[placeholder*="1234"]',
    'input[placeholder*="card number" i]',
    'input[name*="card" i][name*="number" i]',
    'input[id*="cardnumber" i]',
    'input[autocomplete="cc-number"]'
  ];
  
  let cardNumberField = findElement(cardNumberSelectors);
  if (cardNumberField) {
    console.log('✅ Found card number field');
    cardNumberField.focus();
    cardNumberField.value = cardData.cardNumber;
    cardNumberField.dispatchEvent(new Event('input', { bubbles: true }));
    cardNumberField.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
  } else {
    console.log('⚠️ Card number field not found (likely in Stripe iframe)');
  }
  
  // Step 3: Fill expiry (MMYY format as used by Stripe)
  const expirySelectors = [
    'input[placeholder*="MM"]',
    'input[placeholder*="mm / yy" i]',
    'input[placeholder*="expir" i]',
    'input[name*="expir" i]',
    'input[autocomplete="cc-exp"]'
  ];
  
  let expiryField = findElement(expirySelectors);
  if (expiryField) {
    console.log('✅ Found expiry field');
    const expiryStr = `${cardData.expiryMonth}${cardData.expiryYear}`;
    expiryField.focus();
    expiryField.value = expiryStr;
    expiryField.dispatchEvent(new Event('input', { bubbles: true }));
    expiryField.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
  }
  
  // Step 4: Fill CVC/CVV
  const cvcSelectors = [
    'input[placeholder="CVC"]',
    'input[placeholder="CVV"]',
    'input[name*="cvc"]',
    'input[name*="cvv"]',
    'input[placeholder*="cvc" i]',
    'input[autocomplete="cc-csc"]'
  ];
  
  const cvcInputs = document.querySelectorAll(cvcSelectors.join(', '));
  if (cvcInputs.length > 0) {
    const cvcInput = cvcInputs[0];
    console.log('✅ Found CVC field');
    cvcInput.focus();
    cvcInput.value = cardData.cvv;
    cvcInput.dispatchEvent(new Event('input', { bubbles: true }));
    cvcInput.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
  }
  
  // Step 5: Fill cardholder name
  const nameSelectors = [
    'input[placeholder*="Full name"]',
    'input[placeholder*="name on card" i]',
    'input[placeholder*="cardholder" i]',
    'input[autocomplete="cc-name"]',
    'input[name*="name"]'
  ];
  
  let nameField = findElement(nameSelectors);
  if (nameField) {
    console.log('✅ Found name field');
    nameField.focus();
    nameField.value = cardData.cardholderName;
    nameField.dispatchEvent(new Event('input', { bubbles: true }));
    nameField.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
  }
  
  // Step 6: Select country (US)
  const countrySelect = document.querySelector('select[name*="country" i], select[autocomplete="country"]');
  if (countrySelect) {
    console.log('✅ Found country select');
    countrySelect.value = 'US';
    countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(500);
  }
  
  // Step 7: Multi-language address filling
  await sleep(500);
  console.log('🌐 Filling address fields with multi-language support...');
  
  // Get multi-language selectors for address fields
  const addressSelectors = getMultiLanguageSelectors('address');
  const citySelectors = getMultiLanguageSelectors('city');
  const stateSelectors = getMultiLanguageSelectors('state');
  const zipSelectors = getMultiLanguageSelectors('zip');
  
  // Fill address (street)
  let addressField = findElement(addressSelectors);
  if (addressField) {
    console.log('✅ Found address field');
    addressField.focus();
    addressField.value = cardData.street;
    addressField.dispatchEvent(new Event('input', { bubbles: true }));
    addressField.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(300);
  }
  
  // Fill city
  let cityField = findElement(citySelectors);
  if (cityField) {
      console.log('✅ Found city field');
    cityField.focus();
    cityField.value = cardData.city;
    cityField.dispatchEvent(new Event('input', { bubbles: true }));
    cityField.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(300);
  }
  
  // Fill state (also try autocomplete)
  let stateField = findElement(stateSelectors.concat(['select[name*="state" i]', 'input[autocomplete="address-level1"]']));
  if (stateField) {
    console.log('✅ Found state field');
    stateField.focus();
    stateField.value = cardData.state;
    stateField.dispatchEvent(new Event('input', { bubbles: true }));
    stateField.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
  }
  
  // Fill ZIP/postal code
  let zipField = findElement(zipSelectors);
  if (zipField) {
    console.log('✅ Found ZIP field');
    zipField.focus();
    zipField.value = cardData.zip;
    zipField.dispatchEvent(new Event('input', { bubbles: true }));
    zipField.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
  }
  
  console.log('📝 Form filling complete. Card data:', {
    name: cardData.cardholderName,
    card: cardData.cardNumber,
    expiry: `${cardData.expiryMonth}/${cardData.expiryYear}`,
    cvv: cardData.cvv,
    address: `${cardData.street}, ${cardData.city}, ${cardData.state} ${cardData.zip}`
  });
  
  await updateStatus('Payment form filled successfully', 'running');
}

// Click submit/OK button
async function clickSubmitButton() {
  let button = findButtonByText(['ok', 'submit', 'continue', 'confirm', 'pay', 'complete']);
  
  if (button) {
    button.click();
  } else {
    // Try to find any submit button
    const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      submitButton.click();
    } else {
      throw new Error('Submit button not found');
    }
  }
}

// Helper functions
function findElement(selectors) {
  if (!Array.isArray(selectors)) {
    selectors = [selectors];
  }
  
  for (let selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  
  return null;
}

// Smart wait for element to appear
async function waitForElement(selectors, timeout = 30000) {
  if (!Array.isArray(selectors)) {
    selectors = [selectors];
  }
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const existingElement = findElement(selectors);
    if (existingElement) {
      resolve(existingElement);
      return;
    }
    
    // Set up mutation observer to watch for new elements
    const observer = new MutationObserver((mutations) => {
      const element = findElement(selectors);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });
    
    // Also poll every 500ms as backup
    const pollInterval = setInterval(() => {
      const element = findElement(selectors);
      if (element) {
        clearInterval(pollInterval);
        observer.disconnect();
        resolve(element);
      }
      
      // Timeout check
      if (Date.now() - startTime > timeout) {
        clearInterval(pollInterval);
        observer.disconnect();
        reject(new Error('Element not found within timeout'));
      }
    }, 500);
  });
}

function findButtonByText(textOptions) {
  const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a[role="button"]');
  
  for (let button of buttons) {
    const buttonText = (button.textContent || button.value || button.innerText || '').toLowerCase().trim();
    
    for (let text of textOptions) {
      if (buttonText.includes(text.toLowerCase())) {
        // Make sure button is visible and not disabled
        if (button.offsetParent !== null && !button.disabled) {
          return button;
        }
      }
    }
  }
  
  return null;
}

function fillInput(element, value) {
  // Trigger focus
  element.focus();
  
  // Set value using multiple methods to ensure it works
  element.value = value;
  
  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // For React inputs
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeInputValueSetter.call(element, value);
  
  const inputEvent = new Event('input', { bubbles: true });
  element.dispatchEvent(inputEvent);
  
  // Trigger blur
  element.blur();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Save account to accounts.txt content (store only, no auto-download)
async function saveAccountToFile(email, password, name = null) {
  try {
    // Format account entry
    const timestamp = new Date().toLocaleString();
    const accountEntry = `\n=== Account Created: ${timestamp} ===\nName:     ${name || 'Unknown'}\nEmail:    ${email}\nPassword: ${password}\n==============================\n`;
    
    // Get existing accounts.txt content from storage
    const result = await chrome.storage.local.get(['accountsTxtContent']);
    let accountsContent = result.accountsTxtContent || '=== SAVED ACCOUNTS ===\n';
    
    // Append new account
    accountsContent += accountEntry;
    
    // Save updated content to storage (no automatic download)
    await chrome.storage.local.set({ accountsTxtContent: accountsContent });
    
    console.log('✅ Account saved to accounts.txt content:', email);
  } catch (error) {
    console.error('❌ Failed to save account to file:', error);
  }
}

// Save account credentials to storage
async function saveAccountCredentials(email, password, name = null) {
  try {
    // Get existing accounts
    const result = await chrome.storage.local.get(['savedAccounts']);
    const savedAccounts = result.savedAccounts || [];
    
    // Check if account with this email already exists (prevent duplicates)
    const accountExists = savedAccounts.some(acc => acc.email === email);
    if (accountExists) {
      console.log('⚠️ Account with this email already exists, skipping duplicate:', email);
      return; // Don't save duplicate
    }
    
    // Create new account object
    const newAccount = {
      id: Date.now().toString(),
      email: email,
      password: password,
      createdAt: new Date().toISOString(),
      name: name || getGeneratedData().name || 'Unknown'
    };
    
    // Add to accounts array
    savedAccounts.push(newAccount);
    
    // Save back to storage
    await chrome.storage.local.set({ savedAccounts: savedAccounts });
    
    console.log('✅ Account credentials saved:', email);
    
    // Save to accounts.txt file
    await saveAccountToFile(email, password, name || newAccount.name);
    
    // Notify popup
    chrome.runtime.sendMessage({
      type: 'accountSaved',
      account: newAccount
    });
  } catch (error) {
    console.error('❌ Failed to save account credentials:', error);
  }
}

// Stripe-only mode - Start from Stripe checkout page
async function startStripeOnlyMode() {
  setAutomationRunning(true);
  
  try {
    // Check if we're on a Stripe checkout page
    await updateStatus('Checking for Stripe checkout...', 'running');
    
    const currentUrl = window.location.href;
    const isStripeCheckout = currentUrl.includes('checkout.stripe.com') || 
                             currentUrl.includes('stripe') ||
                             document.querySelector('iframe[src*="stripe"]') !== null;
    
    if (!isStripeCheckout) {
      // Wait for Stripe page to load
      await updateStatus('Waiting for Stripe checkout page...', 'running');
      await waitForPaymentPage(30000);
    }
    if (shouldStopAutomation()) return;
    
    await sleep(1000);
    if (shouldStopAutomation()) return;
    
    // Generate test card data
    await updateStatus('Generating test card data...', 'running');
    const cardData = await generateTestCardData();
    
    // Format card display with name and location
    const cardDisplay = `${cardData.cardholderName} • ${cardData.city}, ${cardData.state}`;
    setGeneratedData({ card: cardDisplay });
    
    chrome.storage.local.set({ generatedCard: cardDisplay });
    chrome.runtime.sendMessage({
      type: 'dataUpdate',
      card: cardDisplay
    });
    
    console.log('💳 Generated card data:', {
      name: cardData.cardholderName,
      card: cardData.cardNumber,
      expiry: `${cardData.expiryMonth}/${cardData.expiryYear}`,
      cvv: cardData.cvv,
      address: `${cardData.street}, ${cardData.city}, ${cardData.state} ${cardData.zip}`
    });
    
    await sleep(500);
    if (shouldStopAutomation()) return;
    
    // Fill Stripe/payment form
    await updateStatus('Filling payment form...', 'running');
    await fillStripeForm(cardData);
    await sleep(1500);
    if (shouldStopAutomation()) return;
    
    // Click Submit/OK button
    await updateStatus('Submitting payment...', 'running');
    await clickSubmitButton();
    await sleep(1000);
    if (shouldStopAutomation()) return;
    
    // Save account credentials after successful Stripe payment (only if not already saved)
    await updateStatus('Confirming account...', 'running');
    const result = await chrome.storage.local.get(['pendingAccount']);
    
    if (result.pendingAccount) {
      const { email, password, name } = result.pendingAccount;
      
      // Check if account already exists (to prevent duplicates)
      const accountsResult = await chrome.storage.local.get(['savedAccounts']);
      const savedAccounts = accountsResult.savedAccounts || [];
      const accountExists = savedAccounts.some(acc => acc.email === email);
      
      if (!accountExists) {
        // Only save if not already saved (in case it wasn't saved before Stripe)
        await saveAccountCredentials(email, password, name);
        console.log('✅ Account credentials confirmed after Stripe payment');
      } else {
        console.log('✅ Account already saved, skipping duplicate');
      }
      
      // Clear pending account
      await chrome.storage.local.remove(['pendingAccount']);
    } else {
      console.log('⚠️ No pending account found (may have been saved already)');
    }
    
    // Complete
    chrome.runtime.sendMessage({ type: 'automationComplete' });
    await updateStatus('Payment completed & credentials saved!', 'success');
    
  } catch (error) {
    console.error('Stripe automation error:', error);
    
    // Clear pending account on error
    await chrome.storage.local.remove(['pendingAccount']);
    
    chrome.runtime.sendMessage({ 
      type: 'automationError',
      message: error.message 
    });
    await updateStatus('Error: ' + error.message, 'error');
  }
  
  setAutomationRunning(false);
}

