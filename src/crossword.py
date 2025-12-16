from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import json
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

# Import zoho_integration AFTER loading .env
from zoho_integration import zoho_api

app = Flask(__name__, 
    static_folder='../static',
    template_folder='../templates')

# Rate limiting store
_submission_cache = {
    'ips': {},  # {ip: timestamp}
    'emails': {}  # {email: timestamp}
}

def check_rate_limit(ip, email):
    """Check if IP or email has submitted in the last 24 hours"""
    now = datetime.now()
    yesterday = now - timedelta(hours=24)
    
    # Clean up old entries
    _submission_cache['ips'] = {
        cached_ip: timestamp for cached_ip, timestamp in _submission_cache['ips'].items()
        if timestamp > yesterday
    }
    _submission_cache['emails'] = {
        cached_email: timestamp for cached_email, timestamp in _submission_cache['emails'].items()
        if timestamp > yesterday
    }
    
    # Check IP
    if ip in _submission_cache['ips']:
        return False, f"Olet jo lähettänyt vastauksen tähän ristikkoon."
    
    # Check email
    if email.lower() in _submission_cache['emails']:
        return False, f"Sähköpostiosoitteella on jo lähetetty vastaus."
    
    # Don't record yet - just check if allowed
    return True, None

def record_submission(ip, email):
    """Record a successful submission for rate limiting"""
    now = datetime.now()
    _submission_cache['ips'][ip] = now
    _submission_cache['emails'][email.lower()] = now

# Add path to public directory
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')

# Debug mode from environment variable (defaults to False in production)
DEBUG_MODE = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 'yes')

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

@app.route('/api/submit', methods=['POST'])
def submit_solution():
    """Submit crossword solution and create Zoho ticket"""
    try:
        data = request.get_json()
        
        # Get client IP
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone']
        for field in required_fields:
            if not data.get(field) or not data[field].strip():
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check rate limiting
        email = data['email'].strip().lower()
        can_submit, rate_message = check_rate_limit(client_ip, email)
        
        if not can_submit:
            return jsonify({'error': rate_message}), 429  # 429 Too Many Requests
        
        # Format HTML description for the ticket
        description = f"""
        <h3>Jouluristikko 2025 - Vastaus</h3>
        <p><strong>Nimi:</strong> {data['name'].strip()}</p>
        <p><strong>Sähköposti:</strong> {data['email'].strip()}</p>
        <p><strong>Puhelin:</strong> {data.get('phone', '').strip()}</p>
        {f'<p><strong>Yritys/Organisaatio:</strong> {data.get("organization", "").strip()}</p>' if data.get('organization') else ''}
        <p><strong>IP-osoite:</strong> {client_ip}</p>
        <p><strong>Lähetysaika:</strong> {datetime.now().strftime('%d.%m.%Y klo %H:%M')}</p>
        <hr>
        <p>Käyttäjä on täyttänyt jouluristikon ja osallistuu arvontaan.</p>
        """
        
        # Create ticket in Zoho
        ticket_data = {
            'subject': f'Jouluristikko 2025 - {data["name"].strip()}',
            'departmentId': '35204000077348035',  # Department ID from user
            'contactId': '35204000107100168',
            'description': description.strip(),
            'status': 'Open',
            'channel': 'Web',
            'language': 'fi-FI',
            'category': 'Jouluristikko 2025',
            'subCategory': 'Arvonta'
        }
        
        app.logger.info(f"Creating ticket with data: {ticket_data}")
        ticket = zoho_api.create_ticket(ticket_data)
        
        if ticket:
            # Record successful submission for rate limiting
            record_submission(client_ip, email)
            return jsonify({
                'success': True,
                'message': 'Ticket created successfully',
                'ticketId': ticket.get('id')
            })
        else:
            app.logger.error("Failed to create ticket in Zoho")
            return jsonify({'error': 'Failed to create ticket in Zoho'}), 500
            
    except Exception as e:
        app.logger.error(f"Error in submit_solution: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=DEBUG_MODE)
