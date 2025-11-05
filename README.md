# Auto Signup Helper - Chrome Extension

Automates signup flows with random data generation, temp email via [TempMailApi](https://tempmailapi.com), OTP handling, and Luhn-validated test cards. **Now with iOS-inspired minimalist design!**

## ✨ New Features

- 🎨 **Premium iOS Design** - Minimalist, professional UI designed with Apple's design principles
- ⚙️ **Settings Page** - Configure custom card BIN prefix
- 💳 **Stripe-Only Mode** - Skip signup, fill Stripe checkout directly for existing accounts
- 🎯 **Dual Mode Operation** - Full automation or Stripe-only mode
- 🔧 **Customizable Card BIN** - Set your own 6-digit card BIN prefix

## Features

- 🎲 Random name generation
- 📧 Temp email via TempMailApi
- 🔢 Auto OTP fetching & extraction
- 💳 Luhn algorithm test cards with custom BIN
- 🎯 Smart form detection
- 🤖 Full automation
- 🎨 Beautiful iOS-style interface
- ⚙️ Configurable settings
- 💳 Stripe-only mode for quick checkouts

## Quick Setup

### 1. Generate Icons (1 min)

Open `icons/create_icons.html` in browser → Auto-downloads 3 PNGs → Save as `icon16.png`, `icon48.png`, `icon128.png` in `icons/` folder

### 2. Load Extension (1 min)

1. Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select this folder
5. **Pin the extension** to toolbar (click puzzle icon → pin)

### 3. Ready to Use!

Extension comes with the demo API key pre-configured. Just load and use!

**Opens as Side Panel** (like modern apps):
- Click extension icon → Opens in side panel
- **Stays open** when you click on the page
- Close manually or use keyboard shortcut

**Optional:** To use your own API key:
1. Get key from [tempmailapi.com](https://tempmailapi.com)
2. Open `content.js` → Line 5
3. Replace demo key with yours

## Usage

### Mode 1: Full Automation 🚀

Perfect for complete signup flows from scratch.

1. **Go to signup page**
2. **Click extension icon** → Beautiful iOS popup appears
3. **Select "Full Auto" mode** (default)
4. **Click Start button** → Button changes to Stop (red)
5. **Watch it work** → Live status updates + animated indicator

**Full Automation Flow:**
Name → Email → Signup → Password Screen → Email Code → OTP → Free Trial → Stripe → Submit

### Mode 2: Stripe Only 💳

Perfect when you already have an account and just need to fill payment info.

1. **Navigate to Stripe checkout page** (or any payment page)
2. **Click extension icon**
3. **Select "Stripe Only" mode**
4. **Click Start**
5. **Extension fills payment form automatically**

**Stripe-Only Flow:**
Detect Stripe → Generate Card → Fill Form → Submit

## Interface Features

### Main Screen
- **Mode Selector** - Toggle between Full Auto (🚀) and Stripe Only (💳)
- **Status Indicator** - Live animated dot showing current state
  - 🟢 Green = Ready
  - 🟠 Orange (pulsing) = Running
  - 🟢 Green (pulse) = Success
  - 🔴 Red = Error
- **Start/Stop Button** - Beautiful gradient button with icon animations
- **Data Display** - Shows generated Name, Email, and Card info
- **Email Section** - Displays received OTP when available

### Settings Screen ⚙️
Access via gear icon in top-right corner:
- **Custom Card BIN** - Set your preferred 6-digit card BIN prefix
- **Current BIN Display** - See what's currently in use
- **Save Changes** - Saves to Chrome storage
- **Reset to Default** - Restore default BIN (625967)
- **Clean iOS Design** - Smooth animations and transitions

## Design Philosophy

The extension follows Apple's iOS design principles:

- **Minimalism** - Clean, uncluttered interface
- **Clarity** - Clear typography using SF Pro Display/Text
- **Depth** - Subtle shadows and layering
- **Motion** - Smooth, purposeful animations
- **White Space** - Generous spacing for breathing room
- **Color** - iOS system colors (Blue, Green, Orange, Red)
- **Consistency** - Uniform spacing, radius, and styling

## Files

```
├── manifest.json        # Extension config
├── popup.html/css/js    # Main UI (redesigned)
├── settings.html/css/js # Settings page (new)
├── content.js           # Main automation (⭐)
├── background.js        # Service worker
├── utils.js             # Helpers
└── icons/               # 16/48/128 PNGs
```

## TempMailApi Integration

**Already integrated!** The extension uses [TempMailApi](https://tempmailapi.com/page/api-documentation) with these endpoints:

```javascript
// Create email
POST https://tempmailapi.com/api/emails/{apiKey}

// Get messages
GET https://tempmailapi.com/api/messages/{apiKey}/{email}

// Get message body
GET https://tempmailapi.com/api/messages/{apiKey}/message/{hash_id}
```

## Customization

### Change Card BIN
1. Click settings icon (⚙️) in top-right
2. Enter your 6-digit BIN
3. Click "Save Changes"

### Add Custom Field Selectors
Edit `content.js`:
```javascript
const emailSelectors = [
  'input[type="email"]',
  'input[name="your-custom-field"]'  // Add this
];
```

### Adjust Wait Times
```javascript
await sleep(2000);  // Increase for slow sites
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Fields not filled | Add custom selectors in `content.js` |
| OTP not received | Increase `maxAttempts` from 15 to 20+ |
| Button not found | Check console, add button selector |
| API error 401 | Verify API key is correct |
| Stripe form not filled | Make sure you're on Stripe checkout page |
| Custom BIN not working | Check it's exactly 6 digits in settings |

**Debug**: Press F12 → Console tab for detailed logs

## Test Card Data

Generated via Luhn algorithm:
- **Card**: Custom BIN or default (625967...)
- **Length**: 16 digits (Luhn-validated)
- **Expiry**: Random future date (1-5 years)
- **CVV**: 3 random digits
- **Name**: Random cardholder name
- **Address**: Random US address (street, city, state, ZIP)

⚠️ **Test only** - Not real cards, for validation testing

## Advanced Features

### Smart Waiting
- Uses MutationObserver for instant element detection
- Waits for URL changes dynamically
- No hardcoded delays - adapts to page speed

### OTP Extraction
Multiple patterns for maximum compatibility:
- "one-time code is: XXXXXX"
- "code is: XXXXXX"
- "your code: XXXXXX"
- Standalone 6-digit codes
- Subject line extraction

### Error Handling
- Proper error propagation
- User-friendly error messages
- Status indicator reflects errors
- Automation stops safely on errors

## Security

- Personal testing use only
- API key stored locally (Chrome storage)
- Custom BIN saved locally
- No external data sharing
- Use responsibly and ethically

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium)
- ✅ Brave
- ⚠️ Firefox (requires manifest conversion)

---

**Ready to use!** Beautiful design meets powerful automation 🚀

*Designed with the same attention to detail as Apple products under Steve Jobs.*
