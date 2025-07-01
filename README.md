# SEO Description Generator

A Node.js application that generates SEO-optimized page descriptions for ticket platforms using DataforSEO and OpenAI APIs.

## Technical Overview

**Backend**: Express.js server handling API integrations  
**Frontend**: Vanilla JavaScript client  
**APIs**: DataforSEO (keyword research), OpenAI GPT-4 (content generation)  
**Word Count**: Enforces 350-500 words with retry logic  

## Prerequisites

- Node.js 16+
- DataforSEO account credentials
- OpenAI API key

## Installation

1. Clone repository:
   ```bash
   git clone https://github.com/ilaygranot/seo-description-generator.git
   cd seo-description-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API credentials
   ```

4. Start application:
   ```bash
   npm start
   ```

5. Access at `http://localhost:3000`

## Core Functionality

### Input Processing
- Accepts multiple event names (one per line)
- Supports 6 languages (EN, ES, FR, DE, IT, PT)

### Keyword Research  
- Calls DataforSEO API for related keywords and search volumes
- Displays statistics: total volume, average, high-volume count
- Categorizes keywords by search volume (high/medium/low)

### Content Generation
- Uses GPT-4 with custom brand guidelines prompt
- Implements 5-attempt retry system for word count compliance
- Integrates competitor analysis data
- Bold formatting for primary keywords

### Output
- Real-time cost tracking (API usage)
- Copy-to-clipboard functionality
- Word count validation with visual indicators

## Architecture

```
project/
├── server.js           # Express API server
├── package.json        # Dependencies
├── .env               # Environment variables
├── public/            # Static frontend files
│   ├── index.html     # User interface
│   ├── script.js      # Client-side logic
│   ├── styles.css     # Styling
│   └── logo.jpeg      # Brand assets
└── README.md
```

## API Endpoints

- `POST /api/keywords` - Keyword research via DataforSEO
- `POST /api/competitors` - SERP analysis 
- `POST /api/generate` - Content generation via OpenAI
- `GET /api/health` - System status

## Business Logic

### Brand Guidelines Integration
- Enforces specific tone of voice (relatable, passionate, expert)
- Follows writing standards (active voice, sentence case)
- Emphasizes ticket aggregation business model
- Maintains evergreen content (no dates/prices)

### Quality Assurance
- Validates 350-500 word requirement
- Progressive prompt adjustment across retry attempts
- Error handling with fallback mock data
- Rate limiting and security headers

## Cost Management

- Tracks token usage and API costs in real-time
- Estimated cost per description: $0.12-0.35
- Displays running totals during generation

## Development Notes

- No build process required (vanilla JS frontend)
- Environment-based configuration
- Comprehensive error handling
- Mobile-responsive design

## Security Features

- Server-side API key management
- Rate limiting (100 requests/15 minutes)
- Input validation and sanitization
- CORS protection
- Security headers via Helmet.js