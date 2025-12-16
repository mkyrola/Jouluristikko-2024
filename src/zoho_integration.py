import os
import requests
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

# Token cache - in production, consider using Redis or a database
_token_cache = {
    'access_token': None,
    'expires_at': None,
    'refresh_token': None  # Will be set after env is loaded
}

class ZohoDeskAPI:
    def __init__(self):
        # Load environment variables after dotenv has been called
        self.client_id = os.getenv('ZOHO_CLIENT_ID')
        self.client_secret = os.getenv('ZOHO_CLIENT_SECRET')
        self.refresh_token = os.getenv('ZOHO_REFRESH_TOKEN')
        self.org_id = os.getenv('ZOHO_ORG_ID', '22905616')  # Default org ID
        self.base_url = 'https://desk.zoho.com/api/v1'
        
        # Update cache with refresh token
        global _token_cache
        _token_cache['refresh_token'] = self.refresh_token
        
    def get_access_token(self) -> Optional[str]:
        """Get access token, refreshing if necessary"""
        global _token_cache
        
        # Check if we have a valid cached token
        if (_token_cache['access_token'] and 
            _token_cache['expires_at'] and 
            datetime.now() < _token_cache['expires_at']):
            return _token_cache['access_token']
        
        # Need to refresh the token
        return self.refresh_access_token()
    
    def refresh_access_token(self) -> Optional[str]:
        """Refresh the access token using refresh token"""
        global _token_cache
        
        if not self.refresh_token:
            logger.error("No Zoho refresh token configured")
            return None
            
        url = 'https://accounts.zoho.com/oauth/v2/token'
        data = {
            'refresh_token': self.refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'refresh_token'
        }
        
        try:
            response = requests.post(url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            
            # Cache the new token with expiry
            _token_cache['access_token'] = token_data['access_token']
            # Set expiry 5 minutes before actual expiry to be safe
            expires_in = int(token_data.get('expires_in', 3600))
            _token_cache['expires_at'] = datetime.now() + timedelta(seconds=expires_in - 300)
            
            logger.info("Successfully refreshed Zoho access token")
            return token_data['access_token']
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to refresh Zoho token: {e}")
            return None
    
    def create_ticket(self, ticket_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a ticket in Zoho Desk"""
        token = self.get_access_token()
        if not token:
            return None
            
        headers = {
            'Authorization': f'Zoho-oauthtoken {token}',
            'Content-Type': 'application/json',
            'orgId': self.org_id
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/tickets',
                json=ticket_data,
                headers=headers
            )
            
            # If token expired, try once more with fresh token
            if response.status_code == 401:
                token = self.refresh_access_token()
                if token:
                    headers['Authorization'] = f'Zoho-oauthtoken {token}'
                    response = requests.post(
                        f'{self.base_url}/tickets',
                        json=ticket_data,
                        headers=headers
                    )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create Zoho ticket: {e}")
            if e.response:
                logger.error(f"Response: {e.response.text}")
            return None

# Initialize Zoho API instance
zoho_api = ZohoDeskAPI()
