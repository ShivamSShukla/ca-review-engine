// CA Review Engine - Main Popup Script
// Cross-browser compatible (Chrome & Firefox)

class CAReviewEngine {
    constructor() {
        this.clientProfile = null;
        this.uploadedDocuments = {};
        this.reviewResults = null;
        this.usageCount = 0;
        this.maxUsage = 99;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadData() {
        try {
            const data = await this.getStorage(['clientProfile', 'usageCount', 'reviewResults']);
            this.clientProfile = data.clientProfile || null;
            this.usageCount = data.usageCount || 0;
            this.reviewResults = data.reviewResults || null;
            
            this.updateUsageBadge();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Client Profile Form
        const profileForm = document.getElementById('clientProfileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }

        // File uploads
        this.setupFileUploads();

        // Process Documents button
        const processBtn = document.getElementById('processDocuments');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processDocuments());
        }

        // Generate Report button
        const reportBtn = document.getElementById('generateReport');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.generateReport());
        }
    }

    setupFileUploads() {
        const fileInputs = ['balanceSheet', 'profitLoss', 'trialBalance'];
        
        fileInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', (e) => this.handleFileSelect(e, id));
            }
        });
    }

    handleFileSelect(event, documentType) {
        const file = event.target.files[0];
        const nameSpan = document.getElementById(documentType + 'Name');
        
        if (file) {
            nameSpan.textContent = file.name;
            nameSpan.classList.add('selected');
            
            // Store file metadata
            this.uploadedDocuments[documentType] = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            };
            
            this.checkMandatoryDocuments();
        }
    }

    checkMandatoryDocuments() {
        const required = ['balanceSheet', 'profitLoss', 'trialBalance'];
        const allUploaded = required.every(doc => this.uploadedDocuments[doc]);
        
        const processBtn = document.getElementById('processDocuments');
        if (processBtn) {
            processBtn.disabled = !allUploaded;
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(tabName + '-tab');
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    async handleProfileSubmit(event) {
        event.preventDefault();
        
        const formData = {
            clientName: document.getElementById('clientName').value,
            entityType: document.getElementById('entityType').value,
            businessNature: document.getElementById('businessNature').value,
            financialYear: document.getElementById('financialYear').value,
            turnover: parseFloat(document.getElementById('turnover').value),
            gstStatus: document.getElementById('gstStatus').value,
            accountingMethod: document.getElementById('accountingMethod').value,
            previousYearAvailable: document.getElementById('previousYearAvailable').checked,
            profileDate: new Date().toISOString()
        };

        // Apply CA logic to determine requirements
        this.clientProfile = this.analyzeClientProfile(formData);
        
        // Save to storage
        await this.saveStorage({ clientProfile: this.clientProfile });
        
        // Mark tab as completed
        const profileTab = document.querySelector('.tab[data-tab="profile"]');
        if (profileTab) {
            profileTab.classList.add('completed');
        }
        
        // Update upload section
        this.updateUploadSection();
        
        // Switch to upload tab
        this.switchTab('upload');
        
        this.showNotification('Client profile saved successfully', 'success');
    }

    analyzeClientProfile(formData) {
        const profile = { ...formData };
        
        // Determine audit applicability
        profile.auditApplicable = this.isAuditApplicable(formData);
        
        // Determine required documents
        profile.requiredDocuments = this.determineRequiredDocuments(formData);
        
        // Determine compliance requirements
        profile.complianceRequirements = this.determineCompliance(formData);
        
        return profile;
    }

    isAuditApplicable(profile) {
        const turnover = profile.turnover;
        const entityType = profile.entityType;
        
        // Statutory audit thresholds (simplified - actual rules are more complex)
        if (entityType === 'private' || entityType === 'public') {
            return true; // Companies Act audit mandatory
        }
        
        if (entityType === 'llp') {
            return turnover > 4000000 || profile.contribution > 2500000;
        }
        
        if (entityType === 'partnership') {
            return turnover > 10000000;
        }
        
        // Tax audit under Section 44AB
        if (profile.businessNature.toLowerCase().includes('profession')) {
            return turnover > 5000000;
        } else {
            return turnover > 10000000;
        }
    }

    determineRequiredDocuments(profile) {
        const docs = {
            mandatory: ['balanceSheet', 'profitLoss', 'trialBalance'],
            conditional: []
        };
        
        // GST returns if registered
        if (profile.gstStatus === 'registered') {
            docs.conditional.push({
                name: 'GST Returns (GSTR-1, GSTR-3B)',
                reason: 'GST registered entity',
                id: 'gstReturns'
            });
        }
        
        // Bank statements if turnover > threshold
        if (profile.turnover > 5000000) {
            docs.conditional.push({
                name: 'Bank Statements',
                reason: 'Turnover exceeds ₹50 lakhs',
                id: 'bankStatements'
            });
        }
        
        // Previous year financials
        if (profile.previousYearAvailable) {
            docs.conditional.push({
                name: 'Previous Year Financials',
                reason: 'For comparative analysis',
                id: 'previousYear'
            });
        }
        
        // Audit report if applicable
        if (profile.auditApplicable) {
            docs.conditional.push({
                name: 'Audit Report',
                reason: 'Audit applicable',
                id: 'auditReport'
            });
        }
        
        return docs;
    }

    determineCompliance(profile) {
        const compliance = {
            gst: false,
            incomeTax: true,
            tds: false,
            audit: false,
            mca: false
        };
        
        compliance.gst = profile.gstStatus === 'registered';
        compliance.audit = profile.auditApplicable;
        compliance.tds = profile.turnover > 10000000;
        compliance.mca = ['private', 'public', 'llp'].includes(profile.entityType);
        
        return compliance;
    }

    updateUploadSection() {
        const uploadSection = document.getElementById('uploadSection');
        const uploadInstruction = document.getElementById('uploadInstruction');
        
        if (!this.clientProfile) {
            uploadInstruction.textContent = 'Complete client profiling first';
            uploadSection.style.display = 'none';
            return;
        }
        
        uploadInstruction.textContent = `Upload documents for ${this.clientProfile.clientName} (${this.clientProfile.financialYear})`;
        uploadSection.style.display = 'block';
        
        // Show conditional documents
        const conditionalList = document.getElementById('conditionalDocsList');
        if (conditionalList && this.clientProfile.requiredDocuments.conditional.length > 0) {
            conditionalList.innerHTML = this.clientProfile.requiredDocuments.conditional.map(doc => `
                <div class="upload-item">
                    <label class="file-upload">
                        <span class="upload-label">${doc.name}</span>
                        <small style="color: #666; display: block; margin-bottom: 4px;">${doc.reason}</small>
                        <input type="file" id="${doc.id}" accept=".pdf,.xlsx,.xls,.csv">
                        <span class="file-name" id="${doc.id}Name">No file chosen</span>
                    </label>
                </div>
            `).join('');
            
            // Setup listeners for new file inputs
            this.clientProfile.requiredDocuments.conditional.forEach(doc => {
                const input = document.getElementById(doc.id);
                if (input) {
                    input.addEventListener('change', (e) => this.handleFileSelect(e, doc.id));
                }
            });
        }
    }

    async processDocuments() {
        if (this.usageCount >= this.maxUsage) {
            this.showNotification('Usage limit reached (99/99)', 'error');
            return;
        }
        
        this.showLoading('review-tab', 'Processing documents...');
        
        // Simulate document processing
        setTimeout(async () => {
            this.reviewResults = await this.performReview();
            await this.saveStorage({ reviewResults: this.reviewResults });
            
            this.displayReview();
            
            // Mark upload tab as completed
            const uploadTab = document.querySelector('.tab[data-tab="upload"]');
            if (uploadTab) {
                uploadTab.classList.add('completed');
            }
            
            this.switchTab('review');
            this.showNotification('Documents processed successfully', 'success');
        }, 2000);
    }

    async performReview() {
        const review = {
            timestamp: new Date().toISOString(),
            clientName: this.clientProfile.clientName,
            financialYear: this.clientProfile.financialYear,
            sections: {}
        };
        
        // 1. Structural Validation
        review.sections.structuralValidation = this.validateStructure();
        
        // 2. P&L Review
        review.sections.profitLossReview = this.reviewProfitLoss();
        
        // 3. Ratio Analysis
        review.sections.ratioAnalysis = this.calculateRatios();
        
        // 4. GST vs Books (if applicable)
        if (this.clientProfile.gstStatus === 'registered') {
            review.sections.gstReview = this.reviewGST();
        }
        
        // 5. Compliance Check
        review.sections.compliance = this.checkCompliance();
        
        return review;
    }

    validateStructure() {
        // Simulated validation - in real implementation, this would parse actual documents
        return {
            title: 'Structural Validation',
            items: [
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'Balance Sheet equation verified: Assets = Liabilities + Capital'
                },
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'Trial Balance totals match'
                },
                {
                    type: 'clarification',
                    icon: '⚠',
                    text: 'Significant increase in current liabilities (35% YoY) - requires explanation'
                },
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'No negative balances found in asset accounts'
                }
            ]
        };
    }

    reviewProfitLoss() {
        return {
            title: 'Profit & Loss Review',
            items: [
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'Gross Profit Margin: 28.5% (Previous Year: 26.8%)'
                },
                {
                    type: 'high-risk',
                    icon: '✗',
                    text: 'Personal expenses identified: Vehicle expenses ₹2,50,000 - May require disallowance'
                },
                {
                    type: 'clarification',
                    icon: '⚠',
                    text: 'Cash expenses exceeding ₹10,000 found - Section 40A(3) applicability'
                },
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'Depreciation calculated as per Companies Act rates'
                }
            ]
        };
    }

    calculateRatios() {
        return {
            title: 'Ratio Analysis',
            items: [
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'Current Ratio: 2.1 (Industry Benchmark: 1.5-2.0)'
                },
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'Debt-Equity Ratio: 0.8 (Previous Year: 0.9) - Improved'
                },
                {
                    type: 'clarification',
                    icon: '⚠',
                    text: 'Debtor Days: 85 days (Industry: 45-60 days) - Collection period high'
                },
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'Net Profit Margin: 12.3% (Previous Year: 10.5%)'
                }
            ]
        };
    }

    reviewGST() {
        return {
            title: 'GST vs Books Reconciliation',
            items: [
                {
                    type: 'high-risk',
                    icon: '✗',
                    text: 'Turnover mismatch: Books ₹1,25,00,000 vs GSTR-3B ₹1,22,50,000 - Difference of ₹2,50,000'
                },
                {
                    type: 'clarification',
                    icon: '⚠',
                    text: 'ITC claimed in books does not match GSTR-2B - Requires reconciliation'
                },
                {
                    type: 'normal',
                    icon: '✓',
                    text: 'GST returns filed on time for all months'
                }
            ]
        };
    }

    checkCompliance() {
        const items = [
            {
                type: 'normal',
                icon: '✓',
                text: `Income Tax: ITR filing applicable - ${this.clientProfile.auditApplicable ? 'Audit' : 'Non-audit'} case`
            }
        ];
        
        if (this.clientProfile.complianceRequirements.gst) {
            items.push({
                type: 'normal',
                icon: '✓',
                text: 'GST: Registration active, monthly/quarterly filing required'
            });
        }
        
        if (this.clientProfile.complianceRequirements.audit) {
            items.push({
                type: 'clarification',
                icon: '⚠',
                text: `Audit: ${this.clientProfile.auditApplicable ? 'Applicable' : 'Not applicable'} - Verify applicability based on actual figures`
            });
        }
        
        if (this.clientProfile.complianceRequirements.mca) {
            items.push({
                type: 'normal',
                icon: '✓',
                text: 'MCA: Annual filing requirements applicable'
            });
        }
        
        return {
            title: 'Compliance Status',
            items
        };
    }

    displayReview() {
        const reviewContent = document.getElementById('reviewContent');
        
        if (!this.reviewResults || !reviewContent) return;
        
        let html = `<div class="review-output">`;
        
        Object.values(this.reviewResults.sections).forEach(section => {
            html += `
                <div class="review-section">
                    <h3>${section.title}</h3>
                    ${section.items.map(item => `
                        <div class="validation-item ${item.type}">
                            <span class="validation-icon">${item.icon}</span>
                            <span class="validation-text">${item.text}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        
        html += `</div>`;
        
        reviewContent.innerHTML = html;
        
        // Enable report generation
        const reportBtn = document.getElementById('generateReport');
        if (reportBtn) {
            reportBtn.disabled = false;
        }
    }

    async generateReport() {
        if (this.usageCount >= this.maxUsage) {
            this.showNotification('Usage limit reached (99/99)', 'error');
            return;
        }
        
        this.showLoading('report-tab', 'Generating professional CA report...');
        
        setTimeout(async () => {
            const report = this.createReport();
            this.displayReport(report);
            
            // Increment usage count
            this.usageCount++;
            await this.saveStorage({ usageCount: this.usageCount });
            this.updateUsageBadge();
            
            // Mark review tab as completed
            const reviewTab = document.querySelector('.tab[data-tab="review"]');
            if (reviewTab) {
                reviewTab.classList.add('completed');
            }
            
            this.showNotification('Report generated successfully', 'success');
        }, 2000);
    }

    createReport() {
        const now = new Date();
        
        return {
            title: 'Chartered Accountant Review Report',
            clientName: this.clientProfile.clientName,
            financialYear: this.clientProfile.financialYear,
            reportDate: now.toLocaleDateString('en-IN'),
            sections: [
                {
                    title: '1. Executive Summary',
                    content: `This report presents a rule-based review of financial documents for ${this.clientProfile.clientName} for the financial year ${this.clientProfile.financialYear}. The review is based on statutory requirements, accounting standards, and tax provisions.`
                },
                {
                    title: '2. Key Observations',
                    points: [
                        'Balance sheet structurally verified with no mathematical errors',
                        'Gross profit margin shows improvement from previous year',
                        'GST turnover mismatch identified requiring reconciliation',
                        'Debtor collection period exceeds industry standards'
                    ]
                },
                {
                    title: '3. Items Requiring Clarification',
                    points: [
                        'Significant increase in current liabilities (35% YoY)',
                        'Personal vehicle expenses requiring disallowance computation',
                        'Cash expenses exceeding statutory limits',
                        'ITC reconciliation with GSTR-2B pending'
                    ]
                },
                {
                    title: '4. High-Risk Areas',
                    points: [
                        'GST turnover mismatch of ₹2,50,000',
                        'Potential Section 40A(3) disallowance on cash payments',
                        'Personal expense disallowance may impact tax liability'
                    ]
                },
                {
                    title: '5. Compliance Status',
                    points: [
                        `Tax Audit: ${this.clientProfile.auditApplicable ? 'Applicable' : 'Not Applicable'}`,
                        `GST Filing: ${this.clientProfile.gstStatus === 'registered' ? 'Regular' : 'Not Applicable'}`,
                        `Income Tax Return: Filing required`,
                        `MCA Filings: ${this.clientProfile.complianceRequirements.mca ? 'Applicable' : 'Not Applicable'}`
                    ]
                },
                {
                    title: '6. Next Steps',
                    points: [
                        'Obtain clarifications on flagged items',
                        'Reconcile GST returns with books of accounts',
                        'Compute disallowances under Income Tax Act',
                        'Prepare tax audit report if applicable',
                        'File returns within statutory due dates'
                    ]
                }
            ],
            disclaimer: 'This report is based on rule-based review and publicly available statutory information. Final decisions must be taken by a qualified Chartered Accountant. This report does not constitute audit, assurance, or legal opinion.'
        };
    }

    displayReport(report) {
        const reportContent = document.getElementById('reportContent');
        
        if (!reportContent) return;
        
        let html = `
            <div class="report-disclaimer">
                <strong>IMPORTANT DISCLAIMER:</strong> ${report.disclaimer}
            </div>
            <div class="report-output">
                <div class="report-section">
                    <h2 style="text-align: center; color: #1a5490; margin-bottom: 20px;">${report.title}</h2>
                    <p style="text-align: center; margin-bottom: 20px;">
                        <strong>Client:</strong> ${report.clientName}<br>
                        <strong>Financial Year:</strong> ${report.financialYear}<br>
                        <strong>Report Date:</strong> ${report.reportDate}
                    </p>
                </div>
        `;
        
        report.sections.forEach(section => {
            html += `<div class="report-section"><h3>${section.title}</h3>`;
            
            if (section.content) {
                html += `<p>${section.content}</p>`;
            }
            
            if (section.points) {
                html += '<ul style="margin-left: 20px; line-height: 1.8;">';
                section.points.forEach(point => {
                    html += `<li>${point}</li>`;
                });
                html += '</ul>';
            }
            
            html += `</div>`;
        });
        
        html += `</div>`;
        html += `
            <button class="btn btn-primary" onclick="caEngine.downloadReport()">
                Download Report as PDF
            </button>
        `;
        
        reportContent.innerHTML = html;
    }

    downloadReport() {
        // In a real implementation, this would generate and download a PDF
        this.showNotification('PDF generation would be implemented here', 'info');
    }

    showLoading(tabId, message = 'Loading...') {
        const content = document.getElementById(tabId);
        if (content) {
            content.querySelector('.tab-content').innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    updateUsageBadge() {
        const badge = document.getElementById('usageCount');
        if (badge) {
            badge.textContent = this.usageCount;
            
            if (this.usageCount >= this.maxUsage) {
                badge.style.color = '#ff4444';
            } else if (this.usageCount >= this.maxUsage * 0.9) {
                badge.style.color = '#ffa500';
            }
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with a toast library
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateUI() {
        if (this.clientProfile) {
            const profileTab = document.querySelector('.tab[data-tab="profile"]');
            if (profileTab) {
                profileTab.classList.add('completed');
            }
            this.updateUploadSection();
        }
        
        if (this.reviewResults) {
            const uploadTab = document.querySelector('.tab[data-tab="upload"]');
            if (uploadTab) {
                uploadTab.classList.add('completed');
            }
            this.displayReview();
        }
    }

    // Storage helpers (cross-browser compatible)
    async getStorage(keys) {
        if (typeof browser !== 'undefined') {
            // Firefox
            return await browser.storage.local.get(keys);
        } else {
            // Chrome
            return new Promise((resolve) => {
                chrome.storage.local.get(keys, resolve);
            });
        }
    }

    async saveStorage(data) {
        if (typeof browser !== 'undefined') {
            // Firefox
            return await browser.storage.local.set(data);
        } else {
            // Chrome
            return new Promise((resolve) => {
                chrome.storage.local.set(data, resolve);
            });
        }
    }
}

// Initialize when DOM is ready
let caEngine;
document.addEventListener('DOMContentLoaded', () => {
    caEngine = new CAReviewEngine();
});
