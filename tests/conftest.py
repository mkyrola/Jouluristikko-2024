"""
Pytest configuration and shared fixtures
"""

import pytest
import os
import sys

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))


@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    from crossword import app
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner"""
    return app.test_cli_runner()


@pytest.fixture
def sample_puzzle_data():
    """Sample puzzle data for tests"""
    return {
        "words": [
            {
                "wordindex": 1,
                "startX": 0,
                "startY": 11,
                "length": 4,
                "direction": "across",
                "answer": "ASKO"
            }
        ],
        "cells": [
            {"x": 0, "y": 11, "letter": "A", "isBlocked": False},
            {"x": 1, "y": 11, "letter": "S", "isBlocked": False},
            {"x": 2, "y": 11, "letter": "K", "isBlocked": False},
            {"x": 3, "y": 11, "letter": "O", "isBlocked": False}
        ]
    }
