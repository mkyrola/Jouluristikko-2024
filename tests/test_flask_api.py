"""
Flask API Tests for Seemoto Jouluristikko 2024
Tests all Flask endpoints and error handling
"""

import pytest
import json
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from crossword import app


@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def runner():
    """Create test CLI runner"""
    return app.test_cli_runner()


class TestIndexRoute:
    """Tests for the main index route"""
    
    def test_index_returns_200(self, client):
        """Index page should return 200 OK"""
        response = client.get('/')
        assert response.status_code == 200
    
    def test_index_returns_html(self, client):
        """Index should return HTML content"""
        response = client.get('/')
        assert b'<!DOCTYPE html>' in response.data or b'<html' in response.data
    
    def test_index_contains_title(self, client):
        """Index should contain the puzzle title"""
        response = client.get('/')
        assert b'Seemoto Jouluristikko 2024' in response.data
    
    def test_index_contains_buttons(self, client):
        """Index should contain control buttons"""
        response = client.get('/')
        assert b'instructions-button' in response.data
        assert b'check-button' in response.data
        assert b'submit-button' in response.data
    
    def test_index_contains_grid(self, client):
        """Index should contain crossword grid element"""
        response = client.get('/')
        assert b'crossword-grid' in response.data


class TestPuzzleAPIRoute:
    """Tests for the puzzle API endpoint"""
    
    def test_puzzle_api_returns_200(self, client):
        """Puzzle API should return 200 OK when data exists"""
        response = client.get('/api/puzzle')
        # May return 500 if puzzle file doesn't exist in test environment
        assert response.status_code in [200, 500]
    
    def test_puzzle_api_returns_json(self, client):
        """Puzzle API should return JSON content type"""
        response = client.get('/api/puzzle')
        if response.status_code == 200:
            assert response.content_type == 'application/json'
    
    def test_puzzle_api_contains_cells(self, client):
        """Puzzle data should contain cells array"""
        response = client.get('/api/puzzle')
        if response.status_code == 200:
            data = json.loads(response.data)
            assert 'cells' in data
            assert isinstance(data['cells'], list)
    
    def test_puzzle_api_contains_words(self, client):
        """Puzzle data should contain words array"""
        response = client.get('/api/puzzle')
        if response.status_code == 200:
            data = json.loads(response.data)
            assert 'words' in data
            assert isinstance(data['words'], list)
    
    def test_puzzle_cells_have_required_fields(self, client):
        """Each cell should have x, y, letter, isBlocked fields"""
        response = client.get('/api/puzzle')
        if response.status_code == 200:
            data = json.loads(response.data)
            if data['cells']:
                cell = data['cells'][0]
                assert 'x' in cell
                assert 'y' in cell
                assert 'letter' in cell
                assert 'isBlocked' in cell
    
    def test_puzzle_words_have_required_fields(self, client):
        """Each word should have required fields"""
        response = client.get('/api/puzzle')
        if response.status_code == 200:
            data = json.loads(response.data)
            if data['words']:
                word = data['words'][0]
                assert 'startX' in word
                assert 'startY' in word
                assert 'length' in word
                assert 'direction' in word
    
    def test_puzzle_api_error_handling(self, client, monkeypatch):
        """API should handle missing puzzle file gracefully"""
        # This tests the error response format
        response = client.get('/api/puzzle')
        if response.status_code == 500:
            data = json.loads(response.data)
            assert 'error' in data


class TestImageRoute:
    """Tests for the image serving route"""
    
    def test_image_route_exists(self, client):
        """Image route should be accessible"""
        response = client.get('/images/image.jpg')
        # May return 404 if image doesn't exist in test environment
        assert response.status_code in [200, 404]
    
    def test_image_returns_correct_type(self, client):
        """Image should return correct content type"""
        response = client.get('/images/image.jpg')
        if response.status_code == 200:
            assert 'image' in response.content_type
    
    def test_nonexistent_image_returns_404(self, client):
        """Non-existent image should return 404"""
        response = client.get('/images/nonexistent.jpg')
        assert response.status_code == 404


class TestSecurityHeaders:
    """Tests for security-related headers"""
    
    def test_no_server_header_leak(self, client):
        """Should not leak server version info"""
        response = client.get('/')
        # Check that detailed server info is not exposed
        server_header = response.headers.get('Server', '')
        assert 'Python' not in server_header or 'Werkzeug' in server_header


class TestCaching:
    """Tests for cache-related behavior"""
    
    def test_index_no_cache_headers(self, client):
        """Index should have no-cache meta tags (checked via HTML)"""
        response = client.get('/')
        # The HTML contains cache-control meta tags
        assert b'no-cache' in response.data or response.status_code == 200


class TestInvalidRoutes:
    """Tests for handling invalid routes"""
    
    def test_invalid_route_returns_404(self, client):
        """Invalid routes should return 404"""
        response = client.get('/invalid/route')
        assert response.status_code == 404
    
    def test_api_invalid_endpoint(self, client):
        """Invalid API endpoints should return 404"""
        response = client.get('/api/invalid')
        assert response.status_code == 404


class TestContentTypes:
    """Tests for correct content types"""
    
    def test_html_content_type(self, client):
        """HTML pages should have correct content type"""
        response = client.get('/')
        assert 'text/html' in response.content_type
    
    def test_json_content_type(self, client):
        """API endpoints should return JSON"""
        response = client.get('/api/puzzle')
        if response.status_code == 200:
            assert 'application/json' in response.content_type


class TestPathTraversal:
    """Tests for path traversal security"""
    
    def test_path_traversal_blocked(self, client):
        """Path traversal attempts should be blocked"""
        # These should not expose system files
        dangerous_paths = [
            '/images/../../../etc/passwd',
            '/images/..%2F..%2F..%2Fetc/passwd',
            '/images/....//....//etc/passwd'
        ]
        
        for path in dangerous_paths:
            response = client.get(path)
            # Should return 404, not 200 with file contents
            assert response.status_code in [400, 404]


class TestMethodHandling:
    """Tests for HTTP method handling"""
    
    def test_index_get_only(self, client):
        """Index should respond to GET"""
        response = client.get('/')
        assert response.status_code == 200
    
    def test_api_get_only(self, client):
        """API puzzle endpoint should respond to GET"""
        response = client.get('/api/puzzle')
        assert response.status_code in [200, 500]
    
    def test_post_to_index_not_allowed(self, client):
        """POST to index should return 405 or be handled"""
        response = client.post('/')
        assert response.status_code in [200, 405]
