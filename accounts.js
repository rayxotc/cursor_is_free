// Accounts management script

let currentEditingId = null;

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize i18n
  await autoTranslate();
  
  loadAccounts();

  // Listen for account updates from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'accountSaved') {
      console.log('Account saved, refreshing list...');
      loadAccounts();
    }
  });

  // Refresh accounts when page becomes visible (in case accounts were added while page was open)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      loadAccounts();
    }
  });

  // Also refresh on window focus
  window.addEventListener('focus', function() {
    loadAccounts();
  });

  // Back button
  document.getElementById('backButton').addEventListener('click', function() {
    window.location.href = 'settings.html';
  });

  // Clear all button
  document.getElementById('clearAllButton').addEventListener('click', function() {
    if (confirm('Are you sure you want to delete all saved accounts? This action cannot be undone.')) {
      chrome.storage.local.set({ savedAccounts: [] }, function() {
        loadAccounts();
        showToast('All accounts cleared');
      });
    }
  });

  // Add Account button
  const addAccountBtn = document.getElementById('addAccountBtn');
  if (addAccountBtn) {
    addAccountBtn.addEventListener('click', openAddModal);
  }

  // Export Accounts button
  const exportAccountsBtn = document.getElementById('exportAccountsBtn');
  if (exportAccountsBtn) {
    exportAccountsBtn.addEventListener('click', exportAccounts);
  }

  // Edit Modal controls
  document.getElementById('closeModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
  document.getElementById('saveEdit').addEventListener('click', saveAccountEdit);

  // Add Modal controls
  document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
  document.getElementById('cancelAdd').addEventListener('click', closeAddModal);
  document.getElementById('saveAdd').addEventListener('click', saveNewAccount);

  // Toggle password visibility for Edit Modal
  document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('editPassword');
    const eyeIcon = this.querySelector('.eye-icon');
    const eyeOffIcon = this.querySelector('.eye-off-icon');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeIcon.style.display = 'none';
      eyeOffIcon.style.display = 'block';
    } else {
      passwordInput.type = 'password';
      eyeIcon.style.display = 'block';
      eyeOffIcon.style.display = 'none';
    }
  });

  // Toggle password visibility for Add Modal
  document.getElementById('toggleAddPassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('addPassword');
    const eyeIcon = this.querySelector('.eye-icon');
    const eyeOffIcon = this.querySelector('.eye-off-icon');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeIcon.style.display = 'none';
      eyeOffIcon.style.display = 'block';
    } else {
      passwordInput.type = 'password';
      eyeIcon.style.display = 'block';
      eyeOffIcon.style.display = 'none';
    }
  });

  // Close modals when clicking outside
  document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeEditModal();
    }
  });

  document.getElementById('addModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeAddModal();
    }
  });
});

// Load and display accounts
function loadAccounts() {
  chrome.storage.local.get(['savedAccounts'], function(result) {
    const accounts = result.savedAccounts || [];
    const accountsList = document.getElementById('accountsList');
    const emptyState = document.getElementById('emptyState');
    const accountCount = document.getElementById('accountCount');
    const clearAllButton = document.getElementById('clearAllButton');

    // Update count
    accountCount.textContent = accounts.length;

    // Show/hide empty state
    if (accounts.length === 0) {
      accountsList.style.display = 'none';
      emptyState.style.display = 'flex';
      clearAllButton.style.display = 'none';
    } else {
      accountsList.style.display = 'block';
      emptyState.style.display = 'none';
      clearAllButton.style.display = 'flex';
      
      // Clear existing accounts
      accountsList.innerHTML = '';
      
      // Sort by created date (newest first)
      accounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Render each account
      accounts.forEach(account => {
        const accountCard = createAccountCard(account);
        accountsList.appendChild(accountCard);
      });
    }
  });
}

// Create account card element
function createAccountCard(account) {
  const card = document.createElement('div');
  card.className = 'account-card';
  card.dataset.accountId = account.id;

  const formattedDate = formatDate(account.createdAt);

  card.innerHTML = `
    <div class="account-header">
      <div class="account-avatar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="4" stroke="currentColor" stroke-width="2"/>
          <path d="M4 21C4 17.134 7.582 14 12 14C16.418 14 20 17.134 20 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="account-info">
        <div class="account-name">${escapeHtml(account.name)}</div>
        <div class="account-date">${formattedDate}</div>
      </div>
      <div class="account-actions-dropdown">
        <button class="action-menu-btn" data-account-id="${account.id}">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <div class="actions-menu" id="menu-${account.id}">
          <button class="action-menu-item edit-btn" data-account-id="${account.id}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.3 2.7C11.7 2.3 12.3 2.3 12.7 2.7L13.3 3.3C13.7 3.7 13.7 4.3 13.3 4.7L6 12H3V9L11.3 2.7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Edit</span>
          </button>
          <div class="menu-divider"></div>
          <button class="action-menu-item danger delete-btn" data-account-id="${account.id}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M3 4L4 14C4 14.5523 4.44772 15 5 15H11C11.5523 15 12 14.5523 12 14L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
    <div class="account-credentials">
      <div class="credential-row">
        <div class="credential-label">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/>
            <path d="M1 5L7 8.5L13 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Email</span>
        </div>
        <div class="credential-value">
          <span class="credential-text">${escapeHtml(account.email)}</span>
          <button class="copy-btn" data-copy-text="${escapeHtml(account.email)}" data-copy-label="Email">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="credential-divider"></div>
      <div class="credential-row">
        <div class="credential-label">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="5" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
            <path d="M4.5 5V3.5C4.5 2.39543 5.39543 1.5 6.5 1.5H7.5C8.60457 1.5 9.5 2.39543 9.5 3.5V5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            <circle cx="7" cy="8.5" r="1" fill="currentColor"/>
          </svg>
          <span>Password</span>
        </div>
        <div class="credential-value">
          <span class="credential-text password-masked">••••••••</span>
          <button class="copy-btn" data-copy-text="${escapeHtml(account.password)}" data-copy-label="Password">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="credential-divider"></div>
      <div class="credential-row-full">
        <button class="copy-both-btn" data-email="${escapeHtml(account.email)}" data-password="${escapeHtml(account.password)}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Copy Both</span>
        </button>
      </div>
    </div>
  `;

  // Attach event listeners
  attachCardEventListeners(card, account);

  return card;
}

// Attach event listeners to card buttons
function attachCardEventListeners(card, account) {
  // Three-dot menu button
  const menuBtn = card.querySelector('.action-menu-btn');
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleActionsMenu(account.id);
  });

  // Edit button
  const editBtn = card.querySelector('.edit-btn');
  editBtn.addEventListener('click', () => {
    editAccount(account.id);
  });

  // Delete button
  const deleteBtn = card.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    deleteAccount(account.id);
  });

  // Copy buttons
  const copyBtns = card.querySelectorAll('.copy-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy-text');
      const label = btn.getAttribute('data-copy-label');
      copyToClipboard(text, label);
    });
  });

  // Copy Both button
  const copyBothBtn = card.querySelector('.copy-both-btn');
  if (copyBothBtn) {
    copyBothBtn.addEventListener('click', () => {
      const email = copyBothBtn.getAttribute('data-email');
      const password = copyBothBtn.getAttribute('data-password');
      copyBothCredentials(email, password);
    });
  }
}

// Toggle actions menu
function toggleActionsMenu(accountId) {
  const menu = document.getElementById(`menu-${accountId}`);
  const allMenus = document.querySelectorAll('.actions-menu');
  
  // Close all other menus
  allMenus.forEach(m => {
    if (m !== menu) {
      m.classList.remove('show');
    }
  });
  
  // Toggle current menu
  menu.classList.toggle('show');
}

// Close all menus when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.account-actions-dropdown')) {
    document.querySelectorAll('.actions-menu').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

// Copy to clipboard
function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} copied to clipboard`);
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('Failed to copy', true);
  });
}

// Copy both email and password (email on line 1, password on line 2)
function copyBothCredentials(email, password) {
  const combinedText = `${email}\n${password}`;
  
  navigator.clipboard.writeText(combinedText).then(() => {
    showToast('Email & Password copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showToast('Failed to copy', true);
  });
}

// Edit account
function editAccount(accountId) {
  chrome.storage.local.get(['savedAccounts'], function(result) {
    const accounts = result.savedAccounts || [];
    const account = accounts.find(acc => acc.id === accountId);
    
    if (account) {
      currentEditingId = accountId;
      document.getElementById('editName').value = account.name;
      document.getElementById('editEmail').value = account.email;
      document.getElementById('editPassword').value = account.password;
      openEditModal();
    }
  });
  
  // Close the actions menu
  toggleActionsMenu(accountId);
}

// Save account edit
function saveAccountEdit() {
  const name = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const password = document.getElementById('editPassword').value.trim();

  if (!name || !email || !password) {
    alert('Please fill in all fields');
    return;
  }

  chrome.storage.local.get(['savedAccounts'], function(result) {
    const accounts = result.savedAccounts || [];
    const accountIndex = accounts.findIndex(acc => acc.id === currentEditingId);
    
    if (accountIndex !== -1) {
      accounts[accountIndex].name = name;
      accounts[accountIndex].email = email;
      accounts[accountIndex].password = password;
      
      chrome.storage.local.set({ savedAccounts: accounts }, function() {
        loadAccounts();
        closeEditModal();
        showToast('Account updated successfully');
      });
    }
  });
}

// Delete account
function deleteAccount(accountId) {
  if (confirm('Are you sure you want to delete this account?')) {
    chrome.storage.local.get(['savedAccounts'], function(result) {
      const accounts = result.savedAccounts || [];
      const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
      
      chrome.storage.local.set({ savedAccounts: filteredAccounts }, function() {
        loadAccounts();
        showToast('Account deleted');
      });
    });
  }
  
  // Close the actions menu
  const menu = document.getElementById(`menu-${accountId}`);
  if (menu) {
    menu.classList.remove('show');
  }
}

// Open edit modal
function openEditModal() {
  document.getElementById('editModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Close edit modal
function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
  document.body.style.overflow = 'auto';
  currentEditingId = null;
  
  // Reset password visibility
  const passwordInput = document.getElementById('editPassword');
  const eyeIcon = document.querySelector('.eye-icon');
  const eyeOffIcon = document.querySelector('.eye-off-icon');
  passwordInput.type = 'password';
  eyeIcon.style.display = 'block';
  eyeOffIcon.style.display = 'none';
}

// Show toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  
  if (isError) {
    toast.classList.add('error');
  } else {
    toast.classList.remove('error');
  }
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Open add modal
function openAddModal() {
  // Clear form
  document.getElementById('addName').value = '';
  document.getElementById('addEmail').value = '';
  document.getElementById('addPassword').value = '';
  
  // Reset password visibility
  const passwordInput = document.getElementById('addPassword');
  const eyeIcon = document.querySelector('#addModal .eye-icon');
  const eyeOffIcon = document.querySelector('#addModal .eye-off-icon');
  if (passwordInput && eyeIcon && eyeOffIcon) {
    passwordInput.type = 'password';
    eyeIcon.style.display = 'block';
    eyeOffIcon.style.display = 'none';
  }
  
  document.getElementById('addModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Close add modal
function closeAddModal() {
  document.getElementById('addModal').classList.remove('show');
  document.body.style.overflow = 'auto';
}

// Save new account
function saveNewAccount() {
  const name = document.getElementById('addName').value.trim();
  const email = document.getElementById('addEmail').value.trim();
  const password = document.getElementById('addPassword').value.trim();

  if (!name || !email || !password) {
    alert('Please fill in all fields');
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  chrome.storage.local.get(['savedAccounts'], function(result) {
    const accounts = result.savedAccounts || [];
    
    // Create new account object
    const newAccount = {
      id: Date.now().toString(),
      name: name,
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };
    
    // Add to accounts array
    accounts.push(newAccount);
    
    chrome.storage.local.set({ savedAccounts: accounts }, function() {
      loadAccounts();
      closeAddModal();
      showToast('Account added successfully');
    });
  });
}

// Export all accounts to a text file
function exportAccounts() {
  chrome.storage.local.get(['savedAccounts'], function(result) {
    const accounts = result.savedAccounts || [];
    
    if (accounts.length === 0) {
      showToast('No accounts to export', true);
      return;
    }
    
    // Create formatted text content
    let content = '=== SAVED ACCOUNTS ===\n';
    content += `Exported: ${new Date().toLocaleString()}\n`;
    content += `Total Accounts: ${accounts.length}\n`;
    content += '='.repeat(50) + '\n\n';
    
    // Sort by created date (newest first)
    const sortedAccounts = accounts.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    sortedAccounts.forEach((account, index) => {
      const createdDate = new Date(account.createdAt).toLocaleString();
      
      content += `Account ${index + 1}:\n`;
      content += `-`.repeat(30) + '\n';
      content += `Name:     ${account.name}\n`;
      content += `Email:    ${account.email}\n`;
      content += `Password: ${account.password}\n`;
      content += `Created:  ${createdDate}\n`;
      content += '\n';
    });
    
    content += '='.repeat(50) + '\n';
    content += 'END OF FILE\n';
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    a.href = url;
    a.download = `accounts-${timestamp}.txt`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`${accounts.length} accounts exported successfully`);
  });
}

