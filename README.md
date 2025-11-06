# Auto Signup Helper - Chrome Extension

Chrome extension that automates signup flows with random data generation, temp email via [TempMailApi](https://tempmailapi.com), OTP handling, and Luhn-validated test cards.

**Version:** 1.1.0

## Features

### 🤖 Automation
- 🎲 Random name generation (culturally-aware for EN/CN/JP/KR)
- 📧 Temp email via TempMailApi (unique per signup)
- 🔐 Secure password generation (12-char with symbols)
- 🔢 Auto OTP fetching & extraction
- 💳 Luhn-validated test cards with custom BIN
- 🎯 Smart multi-language form detection
- 🚀 Full automation or Stripe-only mode
- 🛑 Reliable stop button (stops at any step)
- 🧹 Auto-clears storage & cookies before each run

### 📱 Account Management
- 💾 Auto-save accounts after successful signup
- 📋 View all created accounts
- ✏️ Edit account credentials
- 🗑️ Delete individual or all accounts
- 📄 Copy email, password, or both in one click
- 💾 Export all accounts to .txt file
- ➕ Manually add accounts

### 🌍 Multi-Language Support
- 🌐 **4 Languages:** English, Chinese (中文), Japanese (日本語), Korean (한국어)
- 🎨 **iOS-Style Language Settings:** Beautiful, minimalistic language selector
- 🔍 **Smart Form Detection:** Automatically detects form fields in all supported languages
- 📝 **Culturally-Aware Names:** Generates authentic native names with correct surname order
- 🌏 **Full UI Translation:** All pages and components translated

### 🎨 Design & Settings
- 🎨 Beautiful iOS-inspired UI
- ⚙️ Configurable card settings (BIN, expiry, CVV)
- 🔒 Local storage (no cloud, fully private)
- 🧹 Storage & cookie clearing for clean automation runs

## Quick Setup

1. **Load Extension**
   - Chrome → `chrome://extensions/`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked" → Select this folder
   - Pin extension to toolbar

2. **Ready to Use**
   - Extension comes with demo API key pre-configured
   - Click extension icon → Opens in side panel

**Optional:** Use your own API key from [tempmailapi.com](https://tempmailapi.com) → Edit `content.js` line 5

## Usage

### Full Automation Mode
1. Navigate to signup page
2. Click extension icon
3. Select "Full Auto" mode (🚀)
4. Click Start → Watch automation progress

**Automation Flow:**
- **Step 1:** Generate random name → Fill name fields
- **Step 2:** Generate temporary email via TempMailApi → Fill email field
- **Step 3:** Click signup button → Wait for password screen
- **Step 4:** Generate secure password (12-char) → Fill password field
- **Step 5:** Click continue button → Wait for OTP screen
- **Step 6:** Fetch OTP from email inbox → Enter OTP code
- **Step 7:** Store credentials temporarily (saved after payment)

**After Full Automation:**
The extension pauses after account creation. Next steps:
1. Manually click "Continue with free trial" button on the page
2. Wait for Stripe checkout page to load
3. Switch to "Stripe Only" mode and click Start
4. After payment submission → Credentials automatically saved to Accounts

### Stripe Only Mode
1. Navigate to Stripe checkout page (or any payment page)
2. Click extension icon
3. Select "Stripe Only" mode (💳)
4. Click Start → Extension fills payment form automatically

**Stripe Flow:**
- **Step 1:** Detect Stripe checkout page or payment form
- **Step 2:** Generate test card data (Luhn-validated with custom BIN)
- **Step 3:** Fill card number, expiry, CVV, cardholder name
- **Step 4:** Fill billing address (street, city, state, ZIP, country)
- **Step 5:** Click submit/pay button
- **Step 6:** Save account credentials permanently (email + password)

## Account Management

Access saved accounts via **Settings → Manage Accounts**

### Features:
- **View All Accounts:** See all created accounts with name, email, and masked password
- **Copy Credentials:**
  - Copy email individually
  - Copy password individually
  - **Copy Both:** One-click copy (email on line 1, password on line 2)
- **Edit Accounts:** Update name, email, or password
- **Delete Accounts:** Remove individual accounts or clear all
- **Export Accounts:** Download all accounts as formatted `.txt` file
- **Add Manually:** Plus (+) button to add accounts manually

### Export Format:
Exported file (`accounts-YYYY-MM-DDTHH-MM-SS.txt`) contains:
```
=== SAVED ACCOUNTS ===
Exported: 11/5/2025, 10:30:45 AM
Total Accounts: 3

Account 1:
------------------------------
Name:     John Smith
Email:    john@example.com
Password: SecurePass123!
Created:  11/5/2025, 10:15:30 AM
```

## Settings

Access via gear icon (⚙️) in top-right:

### Card Configuration:
- **Custom Card BIN:** Set your preferred 6-8 digit BIN prefix (default: 625967)
- **Expiry Date:** Set custom MM/YY or leave empty for random
- **CVV Code:** Set custom 3-digit CVV or leave empty for random

### Language:
- **Change Language:** Click globe icon (🌐) in popup header or Settings → Language
- **Supported Languages:** English, Chinese (中文), Japanese (日本語), Korean (한국어)
- **Auto-Detection:** Form fields automatically detected in selected language

### Accounts:
- **Manage Accounts:** View, edit, copy, delete, and export saved accounts

## Files

```
├── manifest.json          # Extension config
├── popup.html/css/js      # Main UI
├── settings.html/css/js   # Settings page
├── accounts.html/css/js   # Account management page
├── languages.html/css/js  # Language settings page (iOS-style)
├── content.js             # Main automation logic (multi-language support)
├── background.js          # Service worker (cookie clearing)
├── i18n.js                # Translation utility
├── utils.js               # Helper functions
├── locales/               # Translation files
│   ├── en.json            # English
│   ├── zh.json            # Chinese
│   ├── ja.json            # Japanese
│   └── ko.json            # Korean
└── icons/                 # Extension icons (16/48/128)
```

## What's New

### ✨ Version 1.1.0 - Latest Updates:

#### 🌍 Multi-Language Support
- **4 Languages:** English, Chinese (中文), Japanese (日本語), Korean (한국어)
- **iOS-Style Language Selector:** Beautiful globe icon in header → Select language
- **Smart Form Detection:** Automatically detects form fields in Chinese, Japanese, Korean websites
- **Culturally-Aware Names:** 
  - Chinese: 王明 (surname first, no space)
  - Japanese: 佐藤 太郎 (surname first, with space)
  - Korean: 김 민수 (surname first, with space)
  - English: John Smith (standard order)

#### 🛑 Improved Stop Functionality
- **Reliable Stop Button:** Now properly stops automation at any step
- **Immediate Response:** Stops within 0.2-1 second
- **Clean Exit:** Properly cleans up and updates UI

#### 🧹 Storage & Cookie Management
- **Auto-Clear:** Clears localStorage, sessionStorage, and cookies before each run
- **Clean State:** Ensures fresh start for each automation
- **Better Reliability:** Prevents conflicts from previous sessions

#### 🐛 Bug Fixes
- **Fixed Name Field Detection:** Now properly fills both first AND last name fields
- **Fixed Page Refresh:** Increased wait times for proper page loading
- **Improved Form Detection:** Restored robust selectors that work with various form structures

#### 📱 Previous Features (v1.0.0)
- 🔐 **Password Generation:** Auto-generates secure 12-character passwords
- 💾 **Smart Saving:** Credentials only saved after complete signup (including payment)
- 📱 **Account Management:** Full CRUD interface for managing saved accounts
- 📋 **Copy Both:** One-click copy email + password (formatted on separate lines)
- 💾 **Export Accounts:** Download all accounts as organized `.txt` file
- ➕ **Manual Entry:** Add accounts manually via + button
- ✏️ **Edit & Delete:** Full control over saved credentials
- 🔒 **Privacy First:** All data stored locally, never synced to cloud

### 🔄 Updated Flow:
Previously, the extension only automated form filling. Now it:
1. Generates and enters passwords automatically
2. Stores credentials temporarily during signup
3. Saves permanently only after successful payment
4. Provides complete account management interface

## Security & Privacy

- ✅ **Local Storage Only:** All data stays on your device
- ✅ **No Cloud Sync:** Never uploaded to external servers
- ✅ **Full Control:** Edit, delete, or export anytime
- ⚠️ **Export Warning:** Exported files contain plain-text passwords - secure appropriately

## Contact

**Telegram:** [@Rrryomenn](https://t.me/Rrryomenn)

---

⚠️ **For testing purposes only** - Use responsibly and ethically
