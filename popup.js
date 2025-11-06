// Popup script for controlling the extension
let isRunning = false;
let currentMode = 'full'; // 'full' or 'stripe'

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize i18n
  await autoTranslate();
  
  // Load any saved data
  chrome.storage.local.get(['generatedName', 'generatedEmail', 'generatedCard', 'automationMode'], function(result) {
    if (result.generatedName) {
      document.getElementById('nameData').textContent = result.generatedName;
    }
    if (result.generatedEmail) {
      document.getElementById('emailData').textContent = result.generatedEmail;
    }
    if (result.generatedCard) {
      document.getElementById('cardData').textContent = result.generatedCard;
    }
    if (result.automationMode) {
      currentMode = result.automationMode;
      updateModeUI();
    }
  });

  // Language button
  document.getElementById('languageButton').addEventListener('click', function() {
    window.location.href = 'languages.html';
  });

  // Settings button
  document.getElementById('settingsButton').addEventListener('click', function() {
    window.location.href = 'settings.html';
  });

  // Mode selector buttons
  document.getElementById('fullModeBtn').addEventListener('click', function() {
    if (!isRunning) {
      currentMode = 'full';
      chrome.storage.local.set({ automationMode: 'full' });
      updateModeUI();
    }
  });

  document.getElementById('stripeModeBtn').addEventListener('click', function() {
    if (!isRunning) {
      currentMode = 'stripe';
      chrome.storage.local.set({ automationMode: 'stripe' });
      updateModeUI();
    }
  });

  // Start/Stop button
  document.getElementById('startButton').addEventListener('click', async function() {
    if (isRunning) {
      // Stop automation
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'stopAutomation' }).catch(() => {});
      
      isRunning = false;
      updateButtonUI(false);
      updateStatus('Stopped', 'error');
      document.body.classList.remove('running');
      return;
    }

    isRunning = true;
    updateButtonUI(true);
    document.body.classList.add('running');
    updateStatus('Starting...', 'running');

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Ensure content script is injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).catch(() => {}); // Ignore if already injected
      
      // Wait a moment for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send message to content script with mode
      await chrome.tabs.sendMessage(tab.id, { 
        action: currentMode === 'full' ? 'startAutomation' : 'startStripeOnly'
      });
      
    } catch (error) {
      updateStatus('Error: ' + error.message, 'error');
      updateButtonUI(false);
      document.body.classList.remove('running');
      isRunning = false;
    }
  });

  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'statusUpdate') {
      updateStatus(request.message, request.status);
    } else if (request.type === 'dataUpdate') {
      if (request.name) {
        document.getElementById('nameData').textContent = request.name;
      }
      if (request.email) {
        document.getElementById('emailData').textContent = request.email;
      }
      if (request.card) {
        document.getElementById('cardData').textContent = request.card;
      }
    } else if (request.type === 'emailReceived') {
      // Email received but not showing in UI anymore
      console.log('Email received:', request.subject, 'OTP:', request.otp);
    } else if (request.type === 'automationPaused') {
      updateButtonUI(false);
      document.body.classList.remove('running');
      isRunning = false;
      // Status already set by content script
      // Show guide message
      showNextStepsGuide(request.nextStep);
    } else if (request.type === 'automationComplete') {
      updateButtonUI(false);
      document.body.classList.remove('running');
      isRunning = false;
      updateStatus('Complete', 'success');
    } else if (request.type === 'automationError') {
      updateButtonUI(false);
      document.body.classList.remove('running');
      isRunning = false;
      updateStatus('Error: ' + request.message, 'error');
    }
  });
});

function updateModeUI() {
  const fullBtn = document.getElementById('fullModeBtn');
  const stripeBtn = document.getElementById('stripeModeBtn');
  
  if (currentMode === 'full') {
    fullBtn.classList.add('active');
    stripeBtn.classList.remove('active');
  } else {
    fullBtn.classList.remove('active');
    stripeBtn.classList.add('active');
  }
}

function updateButtonUI(running) {
  const playIcon = document.querySelector('.play-icon');
  const stopIcon = document.querySelector('.stop-icon');
  const buttonText = document.getElementById('buttonText');
  
  if (running) {
    playIcon.style.display = 'none';
    stopIcon.style.display = 'block';
    buttonText.textContent = 'Stop';
  } else {
    playIcon.style.display = 'block';
    stopIcon.style.display = 'none';
    buttonText.textContent = 'Start';
  }
}

function updateStatus(message, status) {
  const statusElement = document.getElementById('status');
  const indicatorElement = document.getElementById('statusIndicator');
  
  statusElement.textContent = message;
  
  // Update indicator
  indicatorElement.className = 'status-indicator';
  if (status === 'running') {
    indicatorElement.classList.add('running');
  } else if (status === 'success') {
    indicatorElement.classList.add('success');
  } else if (status === 'error') {
    indicatorElement.classList.add('error');
  } else {
    indicatorElement.classList.add('ready');
  }
}

function showNextStepsGuide(step) {
  // Create guide overlay
  const guide = document.createElement('div');
  guide.className = 'next-steps-guide';
  guide.innerHTML = `
    <div class="guide-header">📋 Next Steps</div>
    <div class="guide-content">
      <div class="guide-step">
        <div class="step-number">1</div>
        <div class="step-text">Click the <strong>"Continue with free trial"</strong> button on the page</div>
      </div>
      <div class="guide-step">
        <div class="step-number">2</div>
        <div class="step-text">Wait for Stripe checkout page to load</div>
      </div>
      <div class="guide-step">
        <div class="step-number">3</div>
        <div class="step-text">Switch to <strong>"Stripe Only"</strong> mode and click Start</div>
      </div>
    </div>
  `;
  
  // Insert after info section
  const infoSection = document.querySelector('.info-section');
  if (infoSection) {
    infoSection.after(guide);
  }
}
