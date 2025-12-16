# Seemoto Jouluristikko 2024

🎄 Interactive Finnish Christmas crossword puzzle for Seemoto's 2024 holiday campaign.

> **See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for comprehensive details about the project, features, and architecture.**

## Quick Start

### Production (Netlify)

The app is deployed automatically from the `dist/` folder on push to `master`.

### Local Development (Flask)

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file with Zoho credentials
# See Zoho Configuration section below

# Run Flask server
python src/crossword.py

# Open http://localhost:5000
```

## Zoho Configuration

To enable ticket creation in Zoho Desk, you need to configure OAuth credentials:

1. Create a `.env` file in the project root:

```env
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REFRESH_TOKEN=your_refresh_token_here
ZOHO_ORG_ID=22905616
```

2. Get your Zoho Desk OAuth credentials:

   - Go to Zoho Desk Console → Settings → Developers → API
   - Create a new self-client application
   - Note down the Client ID and Client Secret
   - Generate a refresh token using the OAuth playground

3. The system will automatically:
   - Cache access tokens in memory to minimize API calls
   - Refresh tokens when they expire (5 minutes before expiry)
   - Create or find contacts in Zoho when users submit
   - Generate HTML-formatted tickets in the specified department

## Project Structure

```
├── dist/                 # Production build (Netlify)
│   ├── css/style.css
│   ├── js/main.js
│   ├── data/puzzle2024.json
│   ├── images/image.jpg
│   └── index.html
├── src/
│   └── crossword.py      # Flask backend (dev only)
├── static/               # Source files
│   ├── css/style.css
│   └── js/main.js
├── templates/
│   └── index.html        # Flask template
├── netlify.toml
└── requirements.txt
```

## Features

- 🧩 35-word Finnish crossword puzzle
- 🔤 Hidden solution word: 7 letters
- 💾 Progress saved to localStorage
- 📱 Responsive design
- 📧 Submission form with webhook integration

## Tech Stack

- **Frontend**: Vanilla JS, HTML5, CSS3
- **Backend (dev)**: Flask
- **Deployment**: Netlify
- **Webhook**: Make.com

---

_Seemoto / MeshWorks Wireless Oy - Finland_
