# Auto Signup Helper - Chrome Extension

Chrome extension that automates signup flows with random data generation, temp email via [TempMailApi](https://tempmailapi.com), OTP handling, and Luhn-validated test cards.

## Features

- 🎲 Random name generation
- 📧 Temp email via TempMailApi
- 🔢 Auto OTP fetching & extraction
- 💳 Luhn-validated test cards with custom BIN
- 🎯 Smart form detection
- 🤖 Full automation or Stripe-only mode
- 🎨 iOS-inspired minimalist design
- ⚙️ Configurable settings

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
- **Step 4:** Click "Continue with email code" button
- **Step 5:** Wait for OTP screen → Fetch OTP from email inbox
- **Step 6:** Enter OTP code → Account creation complete

**After Full Automation:**
The extension stops after account creation. You'll see a guide overlay with next steps:
1. Manually click "Continue with free trial" button on the page
2. Wait for Stripe checkout page to load
3. Switch to "Stripe Only" mode and click Start

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

## Settings

Access via gear icon (⚙️) in top-right:
- Custom Card BIN: Set your preferred 6-digit card BIN prefix
- Default BIN: 625967

## Files

```
├── manifest.json        # Extension config
├── popup.html/css/js    # Main UI
├── settings.html/css/js # Settings page
├── content.js           # Main automation
├── background.js        # Service worker
├── utils.js             # Helpers
└── icons/               # 16/48/128 PNGs
```

## Contact

**Telegram:** [@Rrryomenn](https://t.me/Rrryomenn)

---

⚠️ **For testing purposes only** - Use responsibly and ethically
