# Auto Signup Helper - Chrome Extension

Chrome extension that automates signup flows with random data generation, temp email via [TempMailApi](https://tempmailapi.com), OTP handling, and Luhn-validated test cards.

## Features

### 🤖 Automation
- 🎲 Random name generation
- 📧 Temp email via TempMailApi
- 🔐 Secure password generation (12-char with symbols)
- 🔢 Auto OTP fetching & extraction
- 💳 Luhn-validated test cards with custom BIN
- 🎯 Smart form detection
- 🚀 Full automation or Stripe-only mode

### 📱 Account Management
- 💾 Auto-save accounts after successful signup
- 📋 View all created accounts
- ✏️ Edit account credentials
- 🗑️ Delete individual or all accounts
- 📄 Copy email, password, or both in one click
- 💾 Export all accounts to .txt file
- ➕ Manually add accounts

### 🎨 Design & Settings
- 🎨 Beautiful iOS-inspired UI
- ⚙️ Configurable card settings (BIN, expiry, CVV)
- 🔒 Local storage (no cloud, fully private)

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

### Accounts:
- **Manage Accounts:** View, edit, copy, delete, and export saved accounts

## Files

```
├── manifest.json          # Extension config
├── popup.html/css/js      # Main UI
├── settings.html/css/js   # Settings page
├── accounts.html/css/js   # Account management page
├── content.js             # Main automation logic
├── background.js          # Service worker
├── utils.js               # Helper functions
└── icons/                 # Extension icons (16/48/128)
```

## What's New

### ✨ Latest Updates:
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
