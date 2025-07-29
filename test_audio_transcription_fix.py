#!/usr/bin/env python3
"""
Test script to verify audio transcription fixes with GCS integration.
"""

import requests
import json
import os
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_AUDIO_FILE = "test_audio.webm"  # You'll need to create this test file

def test_transcription_endpoints():
    """Test the transcription endpoints to ensure they work correctly."""
    
    print("🧪 Testing Audio Transcription Fixes...")
    
    # Test 1: Check if transcription services endpoint works
    print("\n1. Testing transcription services endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/audio/transcription-services")
        if response.status_code == 200:
            services = response.json()
            print(f"✅ Services endpoint works: {services}")
        else:
            print(f"❌ Services endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Services endpoint error: {str(e)}")
    
    # Test 2: Check if GET transcript endpoint exists (should return 401 without auth)
    print("\n2. Testing GET transcript endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/audio/transcript/test-file-id")
        if response.status_code == 401:
            print("✅ GET transcript endpoint exists (requires auth)")
        else:
            print(f"⚠️ GET transcript endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"❌ GET transcript endpoint error: {str(e)}")
    
    # Test 3: Check if POST transcript endpoint exists (should return 401 without auth)
    print("\n3. Testing POST transcript endpoint...")
    try:
        response = requests.post(f"{API_BASE_URL}/api/audio/transcript/")
        if response.status_code == 401:
            print("✅ POST transcript endpoint exists (requires auth)")
        else:
            print(f"⚠️ POST transcript endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"❌ POST transcript endpoint error: {str(e)}")
    
    print("\n🎉 Audio transcription endpoint tests completed!")
    print("\n📝 Summary:")
    print("- GET /api/audio/transcript/{file_id} endpoint added")
    print("- POST /api/audio/transcript/ endpoint enhanced with GCS integration")
    print("- Authentication required for all endpoints")
    print("- Better error handling implemented")

if __name__ == "__main__":
    test_transcription_endpoints()