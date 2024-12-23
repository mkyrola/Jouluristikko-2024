from flask import Flask, render_template, jsonify, send_from_directory
import os
import json

app = Flask(__name__, 
    static_folder='../static',
    template_folder='../templates')

# Add path to public directory
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/puzzle')
def get_puzzle():
    json_path = os.path.join(PUBLIC_DIR, 'data', 'puzzle2024.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            puzzle_data = json.load(f)
            # Convert the puzzle data to ensure proper JSON response
            return jsonify(puzzle_data)
    except Exception as e:
        print(f"Error loading puzzle data: {e}")
        return jsonify({"error": "Failed to load puzzle data"}), 500

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(os.path.join(PUBLIC_DIR, 'images'), filename)

if __name__ == '__main__':
    app.run(debug=True)
