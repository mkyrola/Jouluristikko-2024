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

# Run Flask server
python src/crossword.py

# Open http://localhost:5000
```

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

*Seemoto / MeshWorks Wireless Oy - Finland*
