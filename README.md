# Seemoto Christmas Crossword 2024

A Christmas-themed crossword puzzle application for Seemoto's 2024 holiday season.

## Project Structure
```
├── README.md
├── requirements.txt
├── public/
│   ├── data/
│   │   └── puzzle2024.json    # Add your puzzle JSON here
│   └── images/
│       └── puzzle.jpg         # Add your puzzle image here
├── src/
│   ├── __init__.py
│   ├── crossword.py
│   └── puzzle_data.py
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── templates/
    └── index.html
```

## Setup
1. Add your puzzle files:
   - Place your puzzle JSON file as `public/data/puzzle2024.json`
   - Place your puzzle image as `public/images/puzzle.jpg`

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python src/crossword.py
