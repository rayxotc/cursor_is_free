// Background service worker for the extension

// TempMailApi key (using demo key from docs)
const TEMP_MAIL_API_KEY = 'CZXXyF8jg5JRH7UbQWVYiKMQjQznCB6';

// Listen for extension installation
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('Auto Signup Helper extension installed!');
  } else if (details.reason === 'update') {
    console.log('Auto Signup Helper extension updated!');
  }
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle any background tasks here if needed
  
  if (request.type === 'getTempEmail') {
    // Handle temp email generation in background if needed
    fetchTempEmail(request.apiKey).then(email => {
      sendResponse({ email: email });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'fetchOTP') {
    // Handle OTP fetching in background if needed
    fetchOTPInBackground(request.email, request.apiKey).then(otp => {
      sendResponse({ otp: otp });
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }
});

// Function to fetch temp email using TempMailApi
async function fetchTempEmail(apiKey) {
  try {
    // Use provided apiKey or fall back to default
    const key = apiKey || TEMP_MAIL_API_KEY;
    const response = await fetch(`https://tempmailapi.com/api/emails/${key}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'Failed to create temp email');
    }
    
    return result.data.email;
  } catch (error) {
    throw error;
  }
}

// Function to fetch OTP from temp email using TempMailApi
async function fetchOTPInBackground(email, apiKey) {
  try {
    // Use provided apiKey or fall back to default
    const key = apiKey || TEMP_MAIL_API_KEY;
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      const encodedEmail = encodeURIComponent(email);
      
      const response = await fetch(
        `https://tempmailapi.com/api/messages/${key}/${encodedEmail}`,
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
        const latestMessage = result.data.messages[0];
        
        const msgResponse = await fetch(
          `https://tempmailapi.com/api/messages/${key}/message/${latestMessage.hash_id}`,
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
          const combinedText = messageSubject + ' ' + messageBody;
          
          const otpMatch = combinedText.match(/\b\d{4,6}\b/);
          
          if (otpMatch) {
            return otpMatch[0];
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }
    
    throw new Error('OTP not received within timeout period');
  } catch (error) {
    throw error;
  }
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(function() {
  console.log('Extension started');
});

