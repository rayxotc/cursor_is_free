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
  
  if (request.type === 'clearCookies') {
    // Handle cookie clearing in background
    clearCookiesForDomain(request.domain).then(result => {
      sendResponse({ success: true, cleared: result.cleared });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});

// Function to fetch temp email using TempMailApi
async function fetchTempEmail(apiKey) {
  try {
    // Use provided apiKey or fall back to default
    const key = apiKey || TEMP_MAIL_API_KEY;
    
    // Add cache-busting timestamp to ensure unique email generation
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueParam = `${timestamp}_${randomSuffix}`;
    
    const response = await fetch(`https://tempmailapi.com/api/emails/${key}?_=${uniqueParam}`, {
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
    
    console.log('✅ Generated new temp email:', result.data.email);
    
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

// Function to clear cookies for a domain
async function clearCookiesForDomain(domain) {
  return new Promise((resolve) => {
    const parts = domain.split('.');
    let totalCookiesToClear = 0;
    let clearedCount = 0;
    let resolved = false;
    let domainChecksCompleted = 0;
    let totalDomainChecks = 1; // Start with 1 for main domain
    
    // Count parent domains
    for (let i = 1; i < parts.length; i++) {
      totalDomainChecks++;
    }
    
    const checkComplete = () => {
      if (!resolved && clearedCount >= totalCookiesToClear && totalCookiesToClear > 0) {
        resolved = true;
        console.log(`✅ All ${clearedCount} cookies cleared for ${domain}`);
        resolve({ cleared: clearedCount, total: totalCookiesToClear });
      } else if (!resolved && totalCookiesToClear === 0 && domainChecksCompleted >= totalDomainChecks) {
        resolved = true;
        console.log(`✅ No cookies found to clear for ${domain}`);
        resolve({ cleared: 0, total: 0 });
      }
    };
    
    // Get all cookies for current domain
    chrome.cookies.getAll({ domain: domain }, function(cookies) {
      totalCookiesToClear += cookies.length;
      
      console.log(`📋 Found ${cookies.length} cookies for ${domain}`);
      
      if (cookies.length === 0) {
        domainChecksCompleted++;
        checkComplete();
      } else {
        let domainCleared = 0;
        cookies.forEach((cookie) => {
          const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path || '/'}`;
          
          chrome.cookies.remove({
            url: cookieUrl,
            name: cookie.name
          }, function(details) {
            clearedCount++;
            domainCleared++;
            if (details) {
              console.log(`✅ Cleared cookie: ${cookie.name}`);
            }
            if (domainCleared >= cookies.length) {
              domainChecksCompleted++;
              checkComplete();
            }
          });
        });
      }
    });
    
    // Also get cookies for parent domains
    const parentDomains = [];
    for (let i = 1; i < parts.length; i++) {
      parentDomains.push('.' + parts.slice(i).join('.'));
    }
    
    parentDomains.forEach((parentDomain) => {
      chrome.cookies.getAll({ domain: parentDomain }, function(cookies) {
        totalCookiesToClear += cookies.length;
        
        console.log(`📋 Found ${cookies.length} cookies for ${parentDomain}`);
        
        if (cookies.length === 0) {
          domainChecksCompleted++;
          checkComplete();
        } else {
          let domainCleared = 0;
          cookies.forEach((cookie) => {
            const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path || '/'}`;
            chrome.cookies.remove({
              url: cookieUrl,
              name: cookie.name
            }, function(details) {
              clearedCount++;
              domainCleared++;
              if (details) {
                console.log(`✅ Cleared parent domain cookie: ${cookie.name}`);
              }
              if (domainCleared >= cookies.length) {
                domainChecksCompleted++;
                checkComplete();
              }
            });
          });
        }
      });
    });
    
    // Timeout fallback - resolve after 1.5 seconds max
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log(`✅ Cookie clearing completed (${clearedCount}/${totalCookiesToClear} cleared)`);
        resolve({ cleared: clearedCount, total: totalCookiesToClear });
      }
    }, 1500);
  });
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(function() {
  console.log('Extension started');
});

