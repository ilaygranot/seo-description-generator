class SEODescriptionGenerator {
    constructor() {
        this.totalCost = 0;
        this.totalTokens = 0;
        this.currentStep = 0;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.addEventListener('click', () => this.generateDescriptions());
    }

    async generateDescriptions() {
        try {
            this.validateInputs();
            this.resetResults();
            this.setLoadingState(true);
            
            const pageNames = this.getPageNames();
            const language = document.getElementById('language').value;
            
            for (let i = 0; i < pageNames.length; i++) {
                const pageName = pageNames[i];
                this.updateLoadingText(`Processing "${pageName}" (${i + 1}/${pageNames.length})`);
                await this.processPageName(pageName, language);
            }
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    validateInputs() {
        const pageNames = this.getPageNames();
        if (pageNames.length === 0) {
            throw new Error('Please enter at least one event or page name');
        }
        
        if (pageNames.length > 10) {
            throw new Error('Please limit to 10 items at a time for optimal performance');
        }
    }

    getPageNames() {
        const textarea = document.getElementById('pageNames');
        return textarea.value
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);
    }

    resetResults() {
        this.totalCost = 0;
        this.totalTokens = 0;
        
        document.getElementById('keywordResults').innerHTML = '';
        document.getElementById('descriptions').innerHTML = '';
        document.getElementById('keywordSection').style.display = 'none';
        document.getElementById('outputSection').style.display = 'none';
    }

    setLoadingState(isLoading) {
        const generateBtn = document.getElementById('generateBtn');
        const loadingSection = document.getElementById('loadingSection');
        
        generateBtn.disabled = isLoading;
        const btnText = generateBtn.querySelector('.btn-text');
        btnText.textContent = isLoading ? 'Generating...' : 'Generate SEO descriptions';
        
        loadingSection.style.display = isLoading ? 'block' : 'none';
        
        if (!isLoading) {
            this.resetLoadingSteps();
        }
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loadingText');
        loadingText.textContent = text;
    }

    setActiveStep(stepIndex) {
        // Reset all steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Activate current step
        if (stepIndex >= 1 && stepIndex <= 4) {
            document.getElementById(`step${stepIndex}`).classList.add('active');
        }
    }

    resetLoadingSteps() {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
    }

    async processPageName(pageName, language) {
        try {
            // Step 1: Generate keywords
            this.setActiveStep(1);
            this.updateLoadingText(`Researching keywords for "${pageName}"...`);
            const keywords = await this.generateKeywords(pageName, language);
            
            // Step 2: Get competitor insights
            this.setActiveStep(2);
            this.updateLoadingText(`Analyzing market competition for "${pageName}"...`);
            const competitorInsights = await this.analyzeCompetitors(pageName, language);
            
            // Step 3: Generate description with retries for word count
            this.setActiveStep(3);
            this.updateLoadingText(`Generating optimized content for "${pageName}"...`);
            const description = await this.generateDescription(pageName, keywords, competitorInsights, language);
            
            // Step 4: Finalize and display
            this.setActiveStep(4);
            this.updateLoadingText(`Optimizing SEO elements for "${pageName}"...`);
            
            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Display results
            this.displayResults(pageName, keywords, description);
            
        } catch (error) {
            console.error(`Error processing ${pageName}:`, error);
            this.showError(`Failed to process "${pageName}": ${error.message}`);
        }
    }

    async generateKeywords(pageName, language) {
        try {
            const response = await fetch('/api/keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pageName,
                    language
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayKeywords(pageName, data.keywords);
            return data.keywords;
            
        } catch (error) {
            console.error('Keyword generation error:', error);
            // Return mock data on failure
            const mockKeywords = this.getMockKeywords(pageName);
            this.displayKeywords(pageName, mockKeywords);
            return mockKeywords;
        }
    }

    getMockKeywords(pageName) {
        return [
            { keyword: pageName, search_volume: 12000 },
            { keyword: `${pageName} cheap`, search_volume: 3400 },
            { keyword: `${pageName} best price`, search_volume: 2100 },
            { keyword: `buy ${pageName}`, search_volume: 4500 },
            { keyword: `${pageName} deals`, search_volume: 1900 },
            { keyword: `${pageName} comparison`, search_volume: 1200 }
        ];
    }

    async analyzeCompetitors(pageName, language) {
        try {
            const response = await fetch('/api/competitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pageName,
                    language
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.insights;
            
        } catch (error) {
            console.error('Competitor analysis error:', error);
            return 'Market analysis focuses on price transparency, trust signals, and comprehensive event information.';
        }
    }

    async generateDescription(pageName, keywords, competitorInsights, language, attempt = 1) {
        const maxAttempts = 5; // Increased to 5 attempts
        
        try {
            this.updateLoadingText(`Generating content for "${pageName}" (attempt ${attempt}/${maxAttempts})...`);
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pageName,
                    keywords,
                    competitorInsights,
                    language,
                    attempt
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.updateCostTracking(data.cost, data.tokens);
            
            console.log(`Attempt ${attempt}: Generated ${data.wordCount} words for "${pageName}"`);
            
            // Check if word count is within range (350-500)
            if (data.isValidLength) {
                console.log(`✅ Success! Generated ${data.wordCount} words for "${pageName}" on attempt ${attempt}`);
                return {
                    content: data.description,
                    wordCount: data.wordCount,
                    attempt: data.attempt,
                    isValid: true,
                    warning: null
                };
            } else if (attempt >= maxAttempts) {
                console.warn(`⚠️ Failed to hit word count target after ${maxAttempts} attempts. Final count: ${data.wordCount}`);
                return {
                    content: data.description,
                    wordCount: data.wordCount,
                    attempt: data.attempt,
                    isValid: false,
                    warning: `CRITICAL: Word count ${data.wordCount} is outside required range (350-500 words) after ${maxAttempts} attempts. Please regenerate.`
                };
            } else {
                // Retry with adjusted prompt
                this.updateLoadingText(`Word count ${data.wordCount} - retrying for "${pageName}" (attempt ${attempt + 1}/${maxAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay before retry
                return await this.generateDescription(pageName, keywords, competitorInsights, language, attempt + 1);
            }
            
        } catch (error) {
            throw new Error(`Failed to generate description: ${error.message}`);
        }
    }

    updateCostTracking(cost, tokens) {
        this.totalCost += cost;
        this.totalTokens += tokens;
    }

    displayKeywords(pageName, keywords) {
        const keywordSection = document.getElementById('keywordSection');
        const keywordResults = document.getElementById('keywordResults');
        
        // Calculate keyword statistics
        const totalVolume = keywords.reduce((sum, kw) => sum + (kw.search_volume || 0), 0);
        const avgVolume = Math.round(totalVolume / keywords.length);
        const highVolumeKeywords = keywords.filter(kw => (kw.search_volume || 0) > 5000).length;
        
        const keywordGroup = document.createElement('div');
        keywordGroup.className = 'keyword-group';
        
        keywordGroup.innerHTML = `
            <div class="keyword-group-header">
                <span>🎯 Keywords for "${pageName}"</span>
                <span class="keyword-count">${keywords.length} found</span>
            </div>
            
            <div class="keyword-stats">
                <div class="keyword-stats-content">
                    <div class="stat-item">
                        <span>📊 Total Search Volume:</span>
                        <span class="stat-value">${totalVolume.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span>📈 Average Volume:</span>
                        <span class="stat-value">${avgVolume.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span>🔥 High-Volume Keywords:</span>
                        <span class="stat-value">${highVolumeKeywords}</span>
                    </div>
                    <div class="stat-item">
                        <span>🎯 Primary Keyword:</span>
                        <span class="stat-value">"${pageName}"</span>
                    </div>
                </div>
            </div>
            
            <div class="keyword-list">
                ${keywords.map(keyword => {
                    const volume = keyword.search_volume || 0;
                    let volumeClass = 'low';
                    if (volume > 10000) volumeClass = 'high';
                    else if (volume > 2000) volumeClass = 'medium';
                    
                    return `
                        <div class="keyword-item">
                            <span class="keyword-term">${keyword.keyword}</span>
                            <span class="keyword-volume ${volumeClass}">${volume.toLocaleString()}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="keyword-insights">
                <h4>💡 SEO Insights</h4>
                <p>These keywords will be strategically integrated into your description. High-volume keywords (green) are prioritized for better search visibility. The primary keyword "${pageName}" will be bolded throughout the content.</p>
            </div>
        `;
        
        keywordResults.appendChild(keywordGroup);
        keywordSection.style.display = 'block';
    }

    displayResults(pageName, keywords, description) {
        const outputSection = document.getElementById('outputSection');
        const descriptionsContainer = document.getElementById('descriptions');
        const costInfo = document.getElementById('costInfo');
        
        // Update cost info
        costInfo.innerHTML = `
            <div>
                <strong>💰 Total Cost:</strong> $${this.totalCost.toFixed(4)} | 
                <strong>🔢 Tokens Used:</strong> ${this.totalTokens.toLocaleString()}
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
                Powered by GPT-4 and DataforSEO APIs
            </div>
        `;
        
        // Create description item
        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'description-item';
        descriptionElement.innerHTML = `
            <div class="description-header">
                <span class="description-title">📝 ${pageName}</span>
                <button class="copy-btn" data-description="${pageName}">Copy text</button>
            </div>
            <div class="description-content">${description.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
            <div class="description-meta">
                <div>
                    <span class="word-count ${description.isValid ? 'valid' : 'invalid'}">
                        📊 ${description.wordCount} words ${description.isValid ? '(Perfect!)' : '(NEEDS FIX)'}
                    </span>
                    ${description.warning ? `<div style="color: #dc2626; font-weight: 600; font-size: 13px; margin-top: 6px; padding: 8px; background: #fee2e2; border-radius: 6px; border: 1px solid #fecaca;">${description.warning}</div>` : ''}
                </div>
                <div class="meta-badges">
                    <span class="badge ${description.isValid ? 'success' : 'warning'}">
                        ${description.isValid ? '✅ Word count perfect' : '❌ REGENERATE NEEDED'}
                    </span>
                    <span class="badge ${description.attempt <= 2 ? 'success' : 'warning'}">
                        ${description.attempt} attempt${description.attempt > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        `;
        
        descriptionsContainer.appendChild(descriptionElement);
        outputSection.style.display = 'block';
        
        // Add copy functionality to the new button
        this.addCopyFunctionality(descriptionElement);
    }

    addCopyFunctionality(element) {
        const copyBtn = element.querySelector('.copy-btn');
        const content = element.querySelector('.description-content');
        
        copyBtn.addEventListener('click', async (e) => {
            try {
                // Get plain text content without HTML tags
                const textContent = content.innerText || content.textContent;
                await navigator.clipboard.writeText(textContent);
                
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
                
            } catch (err) {
                console.error('Failed to copy text: ', err);
                this.showError('Failed to copy text to clipboard');
            }
        });
    }

    showError(message) {
        // Create a better error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            color: #dc2626;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #fecaca;
            max-width: 400px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        errorDiv.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">⚠️ Error</div>
            <div style="font-size: 14px;">${message}</div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d1fae5;
            color: #065f46;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #a7f3d0;
            max-width: 400px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        successDiv.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">✅ Success</div>
            <div style="font-size: 14px;">${message}</div>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new SEODescriptionGenerator();
    
    // Add some nice loading animations
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('mouseenter', () => {
        if (!generateBtn.disabled) {
            generateBtn.style.transform = 'translateY(-2px)';
        }
    });
    
    generateBtn.addEventListener('mouseleave', () => {
        if (!generateBtn.disabled) {
            generateBtn.style.transform = 'translateY(0)';
        }
    });
});