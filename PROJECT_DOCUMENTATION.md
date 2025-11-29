# Seemoto Jouluristikko 2024 - Project Documentation

## Executive Summary

**Seemoto Jouluristikko 2024** ("Seemoto Christmas Crossword 2024") is an interactive web-based Finnish crossword puzzle application created as a holiday marketing and customer engagement tool for Seemoto's 2024 Christmas campaign.

---

## About Seemoto (The Company)

**Seemoto** is a Finnish IoT (Internet of Things) company, owned by **MeshWorks Wireless**, specializing in:

- **Cold chain monitoring** for pharmaceutical, food, and logistics industries
- **Wireless temperature & humidity sensors**
- **Real-time environment monitoring** for warehouses, vehicles, and cold storage
- **Regulatory compliance automation** (GDP, HACCP, etc.)

Seemoto is developed and manufactured in Finland and has over 10 years of experience in IoT technologies, serving customers across Europe in sectors requiring strict temperature control and monitoring.

**Website**: [https://www.seemoto.com](https://www.seemoto.com)

---

## Target Audience

| Audience | Description |
|----------|-------------|
| **Existing Customers** | Pharmaceutical companies, food producers, logistics providers using Seemoto's monitoring solutions |
| **Partners** | Distributors, system integrators, and resellers |
| **Prospects** | Potential customers in the cold chain industry |
| **Employees** | Internal team members and stakeholders |

The crossword serves as a **holiday greeting** and **engagement tool** to strengthen relationships with the business community during the Christmas season.

---

## Purpose & Business Goals

1. **Customer Engagement** - Provide an interactive, fun holiday experience for B2B customers
2. **Lead Generation** - Collect contact information through the submission form for follow-up
3. **Brand Awareness** - Keep Seemoto top-of-mind during the holiday season
4. **Prize Draw Participation** - Incentivize completion with a contest entry ("arvonta")

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Interactive Crossword Grid** | 10×12 cell grid overlaid on a festive background image |
| **Word Highlighting** | Click a cell to highlight the associated word (across/down) |
| **Direction Toggle** | Click same cell again to switch between horizontal/vertical words |
| **Auto-Advance** | Cursor automatically moves to the next cell after input |
| **Keyboard Navigation** | Arrow keys and backspace for movement |
| **Progress Persistence** | User answers saved to localStorage (survives page refresh) |

### Verification & Submission

| Feature | Description |
|---------|-------------|
| **Check Puzzle** | "Tarkista ristikko" - Shows percentage of correct letters |
| **Check Solution Word** | "Tarkista ratkaisusana" - Validates the hidden 7-letter solution word |
| **Submit Answer** | "Lähetä vastaus" - Opens modal for contact details submission |
| **Clear Puzzle** | "Tyhjennä ristikko" - Resets all answers |
| **Instructions** | "Ohjeet" - Displays usage instructions in Finnish |

### The Puzzle

- **Grid Size**: 10 columns × 12 rows
- **Total Words**: 35 Finnish words
- **Non-blocked Cells**: 106 fillable cells
- **Solution Word**: Hidden 7-letter word spelled from specific cells: **SINAPPI** (Finnish for "mustard")
- **Solution Coordinates**: Cells at (7,0), (3,2), (8,2), (4,5), (6,6), (0,8), (9,11)

### Data Collection

When users submit their completed puzzle, the following is sent to a Make.com webhook:

```json
{
  "userDetails": {
    "name": "User's name",
    "email": "user@email.com",
    "phone": "Phone number",
    "organization": "Company name (optional)"
  },
  "correctPercentage": 95,
  "solutionWord": "SINAPPI",
  "submissionTime": "2024-12-24T12:00:00.000Z"
}
```

---

## Technical Architecture

### Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Backend (Dev)** | Flask (Python 3.x) |
| **Deployment** | Netlify (static site from `dist/` folder) |
| **Data Format** | JSON (puzzle definition) |
| **Webhook** | Make.com (formerly Integromat) |
| **Storage** | localStorage (browser) |

### Project Structure

```
Seemoto-Jouluristikko-2024/
├── dist/                    # Production build (deployed to Netlify)
│   ├── css/style.css
│   ├── js/main.js
│   ├── data/puzzle2024.json
│   ├── images/image.jpg
│   └── index.html
├── src/                     # Flask backend (local development)
│   ├── __init__.py
│   └── crossword.py
├── static/                  # Source static files
│   ├── css/style.css
│   └── js/main.js
├── templates/
│   └── index.html           # Flask template
├── netlify.toml             # Netlify configuration
├── requirements.txt         # Python dependencies
└── README.md
```

### Key Files

| File | Purpose |
|------|---------|
| `dist/js/main.js` | Production JavaScript (static fetch path) |
| `static/js/main.js` | Development JavaScript (Flask API path) |
| `dist/data/puzzle2024.json` | Puzzle data: words, cells, answers |
| `dist/images/image.jpg` | Christmas-themed background image |
| `src/crossword.py` | Flask server for local development |

---

## Deployment

### Netlify Configuration

```toml
[build]
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

### Development vs Production

| Environment | Puzzle Data Source | Image Source |
|-------------|-------------------|--------------|
| **Development** (Flask) | `/api/puzzle` | `/images/image.jpg` |
| **Production** (Netlify) | `../data/puzzle2024.json` | `images/image.jpg` |

---

## Security Considerations

| Item | Status | Notes |
|------|--------|-------|
| Solution word | Obfuscated | Base64 encoded + reversed in client code |
| Webhook URL | Exposed | Consider backend proxy for production |
| Form validation | Client-side | Email/phone format validated before submit |
| XSS protection | Basic | Input restricted to A-Z characters only |

---

## Localization

The application is entirely in **Finnish** (Suomi):

| UI Element | Finnish Text |
|------------|--------------|
| Instructions button | "Ohjeet" |
| Check puzzle button | "Tarkista ristikko" |
| Check solution button | "Tarkista ratkaisusana" |
| Clear button | "Tyhjennä ristikko" |
| Submit button | "Lähetä vastaus" |
| Success message | "Kiitos vastauksesta. Menestyksekästä vuotta 2025!" |

---

## Sample Words from Puzzle

The crossword contains Finnish words including:

- **JOULUKUKAT** (Christmas flowers)
- **KATUMAASTURI** (SUV/crossover vehicle)
- **NOITATOHTORI** (witch doctor)
- **LAATTAPINO** (tile stack)
- And 31 more Finnish words

---

## Repository

- **GitHub**: `mkyrola/Jouluristikko-2024`
- **Branch**: `master` (primary)
- **Deployment**: Automatic via Netlify on push

---

## Future Improvements

1. **Server-side validation** - Move solution checking to backend
2. **Analytics integration** - Track puzzle completion rates
3. **Responsive improvements** - Better mobile experience
4. **Accessibility** - Add ARIA labels and keyboard focus indicators
5. **Reusable template** - Abstract for annual puzzle reuse (2025, 2026, etc.)

---

## License

Internal Seemoto/MeshWorks Wireless project. Not for public distribution.

---

*Last Updated: November 2024*
