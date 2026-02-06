# CA Review Engine - Browser Extension

A Rule-Based Chartered Accountant Review Engine for professional financial document analysis and compliance checking.

## Overview

This cross-browser extension (compatible with both **Chrome** and **Firefox**) operates as a professional CA review tool that follows strict rule-based validation, statutory compliance checking, and financial analysis protocols.

### Key Features

✅ **Client Profiling** - Structured client information gathering with automatic compliance determination  
✅ **Document Management** - Smart document upload with conditional requirements  
✅ **Structural Validation** - Balance sheet, P&L, and trial balance verification  
✅ **Ratio Analysis** - Automated financial ratio calculations and comparisons  
✅ **Compliance Checking** - GST, Income Tax, Audit, and MCA compliance status  
✅ **Professional Reports** - CA-style review reports with proper disclaimers  
✅ **Usage Tracking** - 99 reports per subscription limit enforcement  
✅ **Cross-Browser Support** - Works identically on Chrome and Firefox

## Core Principles

This extension operates strictly as a **review and validation engine** and:

❌ Does NOT file returns  
❌ Does NOT provide tax planning advice  
❌ Does NOT offer legal opinions  
❌ Does NOT interpret case laws  
❌ Does NOT replace professional judgement  

✅ DOES perform rule-based document review  
✅ DOES identify compliance requirements  
✅ DOES flag inconsistencies and risk areas  
✅ DOES generate professional review notes  

## Installation

### For Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `ca-review-extension` folder
5. The CA Review Engine icon will appear in your extensions toolbar

### For Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the `ca-review-extension` folder and select `manifest.json`
4. The extension will be loaded temporarily (for permanent installation, submit to AMO)

## Usage Workflow

### Step 1: Client Profiling (Mandatory First Step)

Before any analysis, complete the client profile with:

- Client Name
- Entity Type (Individual, Proprietorship, Partnership, LLP, Company, etc.)
- Nature of Business
- Financial Year
- Annual Turnover
- GST Registration Status
- Accounting Method
- Previous Year Data Availability

The system automatically determines:
- Audit applicability
- Required documents
- Compliance obligations

### Step 2: Upload Documents

**Mandatory Documents:**
- Balance Sheet
- Profit & Loss Account
- Trial Balance

**Conditional Documents** (auto-determined based on profile):
- GST Returns (if GST registered)
- Bank Statements (if turnover > ₹50 lakhs)
- Previous Year Financials (if available)
- Audit Report (if audit applicable)
- Fixed Asset Schedule (if asset movement exists)

### Step 3: Review

The system performs:

1. **Structural Validation**
   - Balance Sheet equality check
   - Logical asset-liability structure
   - Abnormal/negative balance detection
   - Year-on-year variance analysis

2. **Profit & Loss Review**
   - Expense allowability under Income Tax
   - Personal/disallowable expense identification
   - Cash payment limit checks (Section 40A(3))
   - Depreciation verification

3. **Ratio Analysis**
   - Gross Profit %
   - Net Profit %
   - Current Ratio
   - Debt-Equity Ratio
   - Debtor/Creditor Days

4. **GST vs Books Review** (if applicable)
   - Turnover reconciliation
   - ITC matching
   - Return filing status

5. **Compliance Status**
   - Income Tax filing requirements
   - GST obligations
   - Audit applicability
   - MCA filing requirements

Findings are classified as:
- ✅ **Normal** - No issues found
- ⚠️ **Requires Clarification** - Needs explanation
- ❌ **High Risk** - Significant concern

### Step 4: Generate Report

Generate a professional CA Review Report containing:

1. Executive Summary
2. Key Observations
3. Items Requiring Clarification
4. High-Risk Areas
5. Compliance Status
6. Next Steps

Each report includes a mandatory disclaimer about professional judgment requirements.

## Usage Limits

- **Maximum:** 99 company reports per subscription
- **Tracking:** Usage count displayed in header badge
- **Enforcement:** Report generation blocked after limit reached
- **Scope:** One report per company per financial period

## Technical Architecture

### Files Structure

```
ca-review-extension/
├── manifest.json           # Extension configuration
├── popup.html             # Main user interface
├── background.js          # Service worker for background tasks
├── scripts/
│   └── popup.js          # Main application logic
├── styles/
│   └── popup.css         # User interface styling
├── icons/
│   ├── icon16.png        # 16x16 toolbar icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 store icon
└── README.md             # This file
```

### Browser Compatibility Layer

The extension uses browser-agnostic code:

```javascript
// Firefox
if (typeof browser !== 'undefined') {
    browser.storage.local.get(keys);
}
// Chrome
else {
    chrome.storage.local.get(keys, callback);
}
```

### Data Storage

Uses browser's local storage API:
- Client profiles
- Review results
- Usage tracking
- Temporary document metadata

**Note:** Actual document files are NOT stored - only metadata and analysis results.

## Statutory Data Sources

The extension ONLY accesses these approved government sources:

- Income Tax Department: https://www.incometax.gov.in
- GST Portal: https://www.gst.gov.in
- Ministry of Corporate Affairs: https://www.mca.gov.in
- ICAI: https://www.icai.org

Data retrieved:
- Threshold limits
- Tax rates
- Due dates
- Notifications
- Circulars

**No interpretation or opinions are made - only factual extraction.**

## Validation Rules Implemented

### Balance Sheet
- Assets = Liabilities + Equity
- No negative asset balances (except provisions)
- Current ratio analysis
- Year-over-year variance checks

### Profit & Loss
- Gross Profit = Revenue - Direct Costs
- Net Profit = GP - Operating Expenses - Other Expenses + Other Income
- Disallowable expense identification
- Cash payment limit (₹10,000) verification

### Trial Balance
- Total Debit = Total Credit
- Single-side balance validation
- Account classification verification

### GST Reconciliation
- Books vs GSTR-3B turnover matching
- ITC vs GSTR-2B reconciliation
- Return filing compliance

### Compliance Determination

**Tax Audit (Section 44AB):**
- Business: Turnover > ₹10 crores (₹1 crore if Section 44AD used)
- Profession: Gross receipts > ₹50 lakhs
- Companies: Always applicable

**GST Registration:**
- Goods: Turnover > ₹40 lakhs (₹10 lakhs in special states)
- Services: Turnover > ₹20 lakhs

**Audit (Companies Act):**
- All companies (with exemptions)
- LLPs: Turnover > ₹40 lakhs or contribution > ₹25 lakhs

## Security & Privacy

✅ **No Cloud Storage** - All data stored locally in browser  
✅ **No External Sharing** - Data never leaves user's machine  
✅ **No API Keys Required** - Direct government portal access only  
✅ **Temporary Storage** - Old data auto-cleaned after 30 days  
✅ **No Tracking** - No analytics or user tracking implemented  

## Limitations & Disclaimers

⚠️ **This is a REVIEW TOOL, not a filing system**

The extension:
- Cannot file tax returns
- Cannot provide tax planning advice
- Cannot offer legal opinions
- Cannot interpret case laws or judgments
- Cannot predict assessment outcomes
- Cannot replace professional CA judgement

**All findings must be reviewed and validated by a qualified Chartered Accountant before taking any action.**

## Development

### Prerequisites
- Node.js (for any future build processes)
- Chrome or Firefox browser
- Text editor

### Local Development

1. Clone or download the extension folder
2. Make changes to HTML/CSS/JS files
3. Reload extension in browser:
   - Chrome: Go to `chrome://extensions/` and click reload
   - Firefox: Go to `about:debugging` and click reload

### Testing

Test on both browsers to ensure compatibility:

1. Install on Chrome and Firefox
2. Complete full workflow on both
3. Verify identical behavior
4. Check console for any browser-specific errors

## Publishing

### Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/developer/dashboard
2. Pay one-time $5 registration fee
3. Prepare store listing:
   - Detailed description
   - Screenshots (1280x800 or 640x400)
   - Privacy policy
4. Upload ZIP file of extension folder
5. Submit for review

### Firefox Add-ons (AMO)

1. Create account at https://addons.mozilla.org/developers/
2. Prepare listing:
   - Detailed description
   - Screenshots
   - Privacy policy
3. Upload ZIP file
4. Submit for review (stricter than Chrome)

## Version History

**Version 1.0.0** (Current)
- Initial release
- Client profiling system
- Document upload and validation
- Rule-based review engine
- Professional report generation
- Cross-browser compatibility (Chrome & Firefox)
- Usage tracking (99 reports limit)
- Statutory data integration

## Support & Feedback

For issues, suggestions, or feedback:
- Check browser console for errors
- Verify all required fields are filled
- Ensure documents are in supported formats (.pdf, .xlsx, .xls, .csv)
- Clear extension storage if encountering persistent issues

## License

This extension is provided as-is for professional CA review purposes. All statutory data remains property of respective government departments.

## Disclaimer

**IMPORTANT:** This extension is a rule-based review tool based on publicly available statutory information. Final decisions must always be taken by a qualified Chartered Accountant. The extension does not constitute audit, assurance, tax advice, or legal opinion.

---

**Built with:** Vanilla JavaScript, HTML5, CSS3  
**Compatible with:** Chrome 109+, Firefox 109+  
**Manifest Version:** 3  
**Last Updated:** 2025
