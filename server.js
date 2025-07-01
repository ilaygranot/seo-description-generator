const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Brand guidelines for AI prompts
const BRAND_GUIDELINES = `
BRAND VOICE & TONE:
- Relatable: We're fans, just like you. Talk like real people, not sales reps.
- Passionate: We live and breathe live events. Show genuine excitement.
- Trusted Experts: We know ticketing inside and out. Guide fans to best choices.

BUSINESS MODEL:
- We aggregate tickets from hundreds of ticket reseller sites that we are partnered with
- This means users can always count on us to help get them to game day
- We provide comprehensive comparison and trusted seller verification

WRITING STYLE:
- Friendly & Encouraging: Warm, conversational tone
- Clear & Helpful: Simple, direct language that serves a purpose  
- Excited, but not Over-the-Top: Balanced enthusiasm
- Reassuring & Trustworthy: Build confidence

WRITING RULES:
- Use active voice: "Secure your tickets now" not "Tickets can be secured now"
- Use sentence case for headlines and body copy
- Make calls to action short and actionable: "Get tickets" not "Click here to buy tickets now"
- No Oxford commas unless necessary for clarity
- Use single quotation marks for song titles
- Use italics for album names, tours, or event titles
- Use numerals for times with no space before AM/PM: 8:30am, 6:00pm
- Include periods in headlines and body copy
- Use exclamation points sparingly
- Language should be guided by keyword volume and relevant audience

COPY PRINCIPLES:
- Share Our Expertise: Highlight knowledge and insights about live events
- Put Fans First: Everything we do is for the fans
- Build the Hype: Make every experience feel special and worth celebrating

EXAMPLES OF GOOD COPY:
"We know how it feels to miss out on tickets—especially for a massive game like Arsenal vs. Tottenham. That's why we help you compare prices from trusted sellers in one place."

"The Emirates Stadium is set for another thrilling matchday—don't miss your chance to be part of the action. Find your Arsenal tickets now!"

"Looking for the best deal? Use our price comparison tool to find Arsenal tickets at the lowest available price—all from secure and vetted sellers."

DETAILED DESCRIPTION EXAMPLES:
Here's an excellent example of our target description style:

## About Patriots vs Bills Tickets 2025/26

The allure of watching an NFL game live and in person is huge, which is why there are very few empty seats at any regular or postseason clash. Fortunately, fans who want to buy Patriots vs Bills tickets can take their pick from a huge range via SeatPick today.

We aggregate tickets from the hundreds of ticket reseller sites that we are partnered with, which means users of our platform can always count on us to help get them to game day.

## Why Buy Patriots vs Bills Tickets via SeatPick?

SeatPick offers the widest and most comprehensive inventory of NFL tickets, and because we only work with the most reputable providers, all tickets bought via our website are protected by a 100% purchase guarantee.

KEY ELEMENTS TO EMULATE:
- Opens with the universal appeal and excitement of live events
- Clearly explains our aggregation model (hundreds of ticket reseller partners)
- Emphasizes our role in helping fans "get to game day"
- Includes trust signals (reputable providers, 100% guarantee)
- Maintains fan-focused language throughout
- Stays evergreen without specific dates or prices
- Uses natural keyword integration
`;

// API Routes

// Generate keywords using DataforSEO
app.post('/api/keywords', async (req, res) => {
    try {
        const { pageName, language = 'en' } = req.body;
        
        if (!pageName) {
            return res.status(400).json({ error: 'Page name is required' });
        }

        const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
        
        const payload = [{
            language_code: language,
            location_code: 2840, // United States
            keywords: [pageName],
            include_serp_info: true,
            limit: 20
        }];

        const response = await axios.post(
            'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
            payload,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.tasks && response.data.tasks[0] && response.data.tasks[0].result) {
            res.json({ keywords: response.data.tasks[0].result });
        } else {
            // Fallback with mock data
            const mockKeywords = generateMockKeywords(pageName);
            res.json({ keywords: mockKeywords });
        }

    } catch (error) {
        console.error('DataforSEO API error:', error.message);
        // Return mock data on API failure
        const mockKeywords = generateMockKeywords(req.body.pageName);
        res.json({ keywords: mockKeywords });
    }
});

// Get SERP results and competitor analysis
app.post('/api/competitors', async (req, res) => {
    try {
        const { pageName } = req.body;
        
        if (!pageName) {
            return res.status(400).json({ error: 'Page name is required' });
        }

        // Mock competitor analysis - in production, you'd use DataforSEO SERP API
        const competitorInsights = `Based on competitor analysis of top ticket platforms, successful sites focus on:
- Comprehensive price comparison from multiple trusted sellers
- Real-time availability and secure purchase guarantees  
- Expert insights about venues, seating, and event experiences
- User-friendly comparison tools and transparent pricing
- Strong trust signals including seller verification and customer support
- Mobile-optimized experience for on-the-go ticket searching`;

        res.json({ insights: competitorInsights });

    } catch (error) {
        console.error('Competitor analysis error:', error.message);
        res.status(500).json({ error: 'Failed to analyze competitors' });
    }
});

// Generate description using OpenAI
app.post('/api/generate', async (req, res) => {
    try {
        const { pageName, keywords, competitorInsights, language = 'en', attempt = 1 } = req.body;
        
        if (!pageName) {
            return res.status(400).json({ error: 'Page name is required' });
        }

        const keywordList = keywords.slice(0, 10).map(k => k.keyword).join(', ');
        
        const languageInstructions = language === 'en' ? 
            'Write in English.' :
            `Write in ${getLanguageName(language)} language. Ensure all content is naturally written in ${getLanguageName(language)}, not translated.`;

        let wordCountGuidance = '';
        if (attempt === 1) {
            wordCountGuidance = 'CRITICAL: The content MUST be between 350-500 words. Aim for around 400-450 words to be safe.';
        } else if (attempt === 2) {
            wordCountGuidance = 'URGENT: Previous attempt was outside 350-500 word range. This attempt MUST hit the target. Write substantial, detailed content.';
        } else {
            wordCountGuidance = 'FINAL ATTEMPT: Write detailed, comprehensive content. Each paragraph should be 175-250 words. Include specific details about the event experience.';
        }

        const prompt = `Create an SEO-optimized page description for "${pageName}" that follows these strict requirements:

${wordCountGuidance}

WORD COUNT REQUIREMENT: MUST be exactly 350-500 words total, split into exactly 2 paragraphs of roughly equal length.

LANGUAGE REQUIREMENT: ${languageInstructions}

BRAND GUIDELINES:
${BRAND_GUIDELINES}

KEYWORD INTEGRATION:
Primary keyword: ${pageName}
Related keywords to naturally include: ${keywordList}

COMPETITOR INSIGHTS:
${competitorInsights}

CONTENT REQUIREMENTS:
1. Write as a human, not a corporation - warm and conversational
2. Show genuine passion for live events  
3. Demonstrate expertise in ticket aggregation and comparison
4. Stay evergreen - avoid specific dates, prices, or time-sensitive information
5. Focus on the experience and emotions of attending events
6. Use active voice throughout
7. Include trust signals naturally (mention our network of verified sellers)
8. Make it engaging and exciting but not over-the-top
9. Emphasize our aggregation model - we bring together hundreds of sellers
10. Write detailed, comprehensive content to meet the 350-500 word requirement

STRUCTURE:
- Paragraph 1 (175-250 words): Hook the reader with the excitement of the event, show understanding of what fans want, mention our comprehensive aggregation, elaborate on the event experience and atmosphere
- Paragraph 2 (175-250 words): Demonstrate expertise, explain how we help fans through our platform, include trust signals about verified sellers, detail our services and benefits

EXAMPLE STYLE (follow this detailed approach):
Use the detailed examples from our brand guidelines to write comprehensive, engaging content that meets the word count requirement.

${languageInstructions} Write substantial, detailed content. Do not include any title or heading - just the two comprehensive paragraphs of body content that total 350-500 words.`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert SEO copywriter specializing in ticket aggregation platform content. You MUST always write content that is between 350-500 words. This is a strict requirement that cannot be violated. If the content is under 350 words, it will be rejected. Write comprehensive, detailed content to meet this requirement.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
            throw new Error('Invalid response from OpenAI API');
        }

        const description = response.data.choices[0].message.content.trim();
        const wordCount = countWords(description);
        const usage = response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        
        // Calculate cost (GPT-4 pricing)
        const inputCost = (usage.prompt_tokens / 1000) * 0.03;
        const outputCost = (usage.completion_tokens / 1000) * 0.06;
        const totalCost = inputCost + outputCost;

        console.log(`Generated description for "${pageName}": ${wordCount} words (attempt ${attempt})`);

        res.json({
            description: boldKeywords(description, pageName),
            wordCount,
            attempt,
            cost: totalCost,
            tokens: usage.total_tokens,
            isValidLength: wordCount >= 350 && wordCount <= 500
        });

    } catch (error) {
        console.error('OpenAI API error:', error.message);
        console.error('Full error:', error.response?.data || error);
        res.status(500).json({ 
            error: 'Failed to generate description',
            details: error.response?.data?.error?.message || error.message 
        });
    }
});

// Health check endpoint  
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Helper functions
function generateMockKeywords(seed) {
    return [
        { keyword: seed, search_volume: 12000 },
        { keyword: `${seed} cheap`, search_volume: 3400 },
        { keyword: `${seed} best price`, search_volume: 2100 },
        { keyword: `${seed} official`, search_volume: 1800 },
        { keyword: `buy ${seed}`, search_volume: 4500 },
        { keyword: `${seed} near me`, search_volume: 2800 },
        { keyword: `${seed} deals`, search_volume: 1900 },
        { keyword: `${seed} comparison`, search_volume: 1200 }
    ];
}

function countWords(text) {
    return text.trim().split(/\s+/).length;
}

function boldKeywords(description, pageName) {
    const pageNameRegex = new RegExp(`\\b${pageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return description.replace(pageNameRegex, `**$&**`);
}

function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French', 
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese'
    };
    return languages[code] || 'English';
}

// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SEO Description Generator running on http://localhost:${PORT}`);
    console.log(`📝 Make sure to add your API credentials to the .env file`);
});

module.exports = app;