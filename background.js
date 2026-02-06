// CA Review Engine - Background Service Worker
// Cross-browser compatible background script

// Installation handler
if (typeof browser !== 'undefined') {
    // Firefox
    browser.runtime.onInstalled.addListener(handleInstall);
} else {
    // Chrome
    chrome.runtime.onInstalled.addListener(handleInstall);
}

function handleInstall(details) {
    if (details.reason === 'install') {
        console.log('CA Review Engine installed');
        initializeStorage();
    } else if (details.reason === 'update') {
        console.log('CA Review Engine updated to version', chrome.runtime.getManifest().version);
    }
}

// Initialize default storage values
async function initializeStorage() {
    const defaultData = {
        usageCount: 0,
        installDate: new Date().toISOString(),
        version: chrome.runtime.getManifest().version
    };
    
    if (typeof browser !== 'undefined') {
        await browser.storage.local.set(defaultData);
    } else {
        chrome.storage.local.set(defaultData);
    }
}

// Handle messages from popup or content scripts
const messageHandler = (message, sender, sendResponse) => {
    switch (message.action) {
        case 'fetchStatutoryData':
            fetchStatutoryData(message.source, message.query)
                .then(data => sendResponse({ success: true, data }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Will respond asynchronously
            
        case 'validateDocument':
            validateDocument(message.documentData)
                .then(result => sendResponse({ success: true, result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        case 'checkUsageLimit':
            checkUsageLimit()
                .then(result => sendResponse({ success: true, result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
};

if (typeof browser !== 'undefined') {
    browser.runtime.onMessage.addListener(messageHandler);
} else {
    chrome.runtime.onMessage.addListener(messageHandler);
}

// Fetch statutory data from approved government sources
async function fetchStatutoryData(source, query) {
    const approvedSources = {
        'income-tax': 'https://www.incometax.gov.in',
        'gst': 'https://www.gst.gov.in',
        'mca': 'https://www.mca.gov.in',
        'icai': 'https://www.icai.org'
    };
    
    if (!approvedSources[source]) {
        throw new Error('Unauthorized data source');
    }
    
    // In a real implementation, this would make actual API calls to government portals
    // For now, return simulated statutory data
    return getStatutoryDataSimulated(source, query);
}

// Simulated statutory data (in production, this would fetch from actual APIs)
function getStatutoryDataSimulated(source, query) {
    const data = {
        'income-tax': {
            'tax-audit-threshold': {
                business: 10000000,
                profession: 5000000,
                presumptive44AD: 20000000,
                lastUpdated: '2024-04-01'
            },
            'itr-due-dates': {
                nonAudit: '2025-07-31',
                audit: '2025-10-31',
                transferPricing: '2025-11-30'
            },
            'tds-rates': {
                salary: '30% above ₹10L',
                contractorIndividual: '1%',
                contractorCompany: '2%',
                professionalFees: '10%',
                rent: '10%'
            }
        },
        'gst': {
            'registration-threshold': {
                goods: 4000000,
                services: 2000000,
                specialCategory: 1000000,
                lastUpdated: '2024-04-01'
            },
            'gst-rates': {
                nil: 'Essential items',
                '5%': 'Common use items',
                '12%': 'Standard items',
                '18%': 'Most goods and services',
                '28%': 'Luxury and sin goods'
            },
            'return-types': {
                'GSTR-1': 'Outward supplies',
                'GSTR-3B': 'Summary return',
                'GSTR-9': 'Annual return',
                'GSTR-9C': 'Reconciliation statement'
            }
        },
        'mca': {
            'company-filings': {
                'Form AOC-4': 'Financial statements - Annual',
                'Form MGT-7': 'Annual return',
                'Form ADT-1': 'Appointment of auditor',
                'Form DIR-3 KYC': 'Director KYC'
            },
            'llp-filings': {
                'Form 8': 'Statement of account - Annual',
                'Form 11': 'Annual return'
            }
        }
    };
    
    return data[source] || {};
}

// Validate document structure
async function validateDocument(documentData) {
    const validations = {
        balanceSheet: validateBalanceSheet,
        profitLoss: validateProfitLoss,
        trialBalance: validateTrialBalance
    };
    
    const validator = validations[documentData.type];
    if (!validator) {
        throw new Error('Unknown document type');
    }
    
    return validator(documentData);
}

// Balance Sheet validation rules
function validateBalanceSheet(data) {
    const results = {
        valid: true,
        errors: [],
        warnings: [],
        info: []
    };
    
    // Rule: Assets must equal Liabilities + Equity
    if (Math.abs(data.totalAssets - (data.totalLiabilities + data.equity)) > 0.01) {
        results.valid = false;
        results.errors.push('Balance Sheet does not balance: Assets ≠ Liabilities + Equity');
    }
    
    // Rule: No negative asset values (except provisions)
    if (data.negativeAssets && data.negativeAssets.length > 0) {
        results.warnings.push(`Negative values found in asset accounts: ${data.negativeAssets.join(', ')}`);
    }
    
    // Rule: Current ratio check
    const currentRatio = data.currentAssets / data.currentLiabilities;
    if (currentRatio < 1) {
        results.warnings.push(`Low current ratio (${currentRatio.toFixed(2)}): Liquidity concern`);
    }
    
    // Info: Year-over-year changes
    if (data.previousYear) {
        const assetChange = ((data.totalAssets - data.previousYear.totalAssets) / data.previousYear.totalAssets) * 100;
        if (Math.abs(assetChange) > 20) {
            results.info.push(`Significant change in total assets: ${assetChange.toFixed(1)}% YoY`);
        }
    }
    
    return results;
}

// Profit & Loss validation rules
function validateProfitLoss(data) {
    const results = {
        valid: true,
        errors: [],
        warnings: [],
        info: []
    };
    
    // Rule: Gross Profit calculation
    const calculatedGP = data.revenue - data.directCosts;
    if (Math.abs(calculatedGP - data.grossProfit) > 0.01) {
        results.errors.push('Gross Profit calculation mismatch');
    }
    
    // Rule: Net Profit calculation
    const calculatedNP = data.grossProfit - data.operatingExpenses - data.otherExpenses + data.otherIncome;
    if (Math.abs(calculatedNP - data.netProfit) > 0.01) {
        results.errors.push('Net Profit calculation mismatch');
    }
    
    // Rule: Disallowable expenses check
    const disallowableKeywords = ['personal', 'penalty', 'fine', 'political donation'];
    data.expenses.forEach(expense => {
        if (disallowableKeywords.some(keyword => expense.description.toLowerCase().includes(keyword))) {
            results.warnings.push(`Potential disallowable expense: ${expense.description} (₹${expense.amount})`);
        }
    });
    
    // Rule: Cash payment limit check (Section 40A(3))
    const largeCashPayments = data.expenses.filter(e => 
        e.paymentMode === 'cash' && e.amount > 10000
    );
    if (largeCashPayments.length > 0) {
        results.warnings.push(`${largeCashPayments.length} cash payments exceeding ₹10,000 found - Section 40A(3) applicable`);
    }
    
    return results;
}

// Trial Balance validation rules
function validateTrialBalance(data) {
    const results = {
        valid: true,
        errors: [],
        warnings: [],
        info: []
    };
    
    // Rule: Debit must equal Credit
    if (Math.abs(data.totalDebit - data.totalCredit) > 0.01) {
        results.valid = false;
        results.errors.push(`Trial Balance does not tally: Debit (${data.totalDebit}) ≠ Credit (${data.totalCredit})`);
    }
    
    // Rule: All accounts must have either debit or credit balance
    const bothSidesAccounts = data.accounts.filter(acc => acc.debit > 0 && acc.credit > 0);
    if (bothSidesAccounts.length > 0) {
        results.warnings.push(`${bothSidesAccounts.length} accounts have both debit and credit balances`);
    }
    
    return results;
}

// Check usage limit
async function checkUsageLimit() {
    const storage = await getStorageData(['usageCount']);
    const usageCount = storage.usageCount || 0;
    const maxUsage = 99;
    
    return {
        current: usageCount,
        max: maxUsage,
        remaining: maxUsage - usageCount,
        exceeded: usageCount >= maxUsage
    };
}

// Storage helper
async function getStorageData(keys) {
    if (typeof browser !== 'undefined') {
        return await browser.storage.local.get(keys);
    } else {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    }
}

// Periodic cleanup (runs daily)
if (typeof browser !== 'undefined') {
    browser.alarms.create('dailyCleanup', { periodInMinutes: 1440 });
    browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'dailyCleanup') {
            performCleanup();
        }
    });
} else {
    chrome.alarms.create('dailyCleanup', { periodInMinutes: 1440 });
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'dailyCleanup') {
            performCleanup();
        }
    });
}

async function performCleanup() {
    // Clean up old temporary data
    console.log('Performing daily cleanup...');
    
    const storage = await getStorageData(null);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Remove old review results
    Object.keys(storage).forEach(key => {
        if (key.startsWith('review_') && storage[key].timestamp < thirtyDaysAgo) {
            if (typeof browser !== 'undefined') {
                browser.storage.local.remove(key);
            } else {
                chrome.storage.local.remove(key);
            }
        }
    });
}

console.log('CA Review Engine background service worker loaded');
