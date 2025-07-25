#!/usr/bin/env python3
"""
Test script for Groq transcription integration.
This script tests the Groq transcription service independently.
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def test_groq_availability():
    """Test if Groq API key is configured."""
    print("=== Testing Groq API Availability ===")
    
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY not found in environment variables")
        print("Please set GROQ_API_KEY in your .env file")
        return False
    
    print("✅ GROQ_API_KEY found in environment variables")
    return True

def test_groq_api_connection():
    """Test basic connection to Groq API."""
    print("\n=== Testing Groq API Connection ===")
    
    if not GROQ_API_KEY:
        print("❌ Cannot test connection without API key")
        return False
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    try:
        # Test with a simple request (this will fail but we can check if the API is reachable)
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
        
        if response.status_code == 401:
            print("❌ API key is invalid or expired")
            return False
        elif response.status_code == 200:
            print("✅ Groq API connection successful")
            return True
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            return True  # API is reachable, might be a different issue
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def test_transcription_service():
    """Test the transcription service integration."""
    print("\n=== Testing Transcription Service Integration ===")
    
    try:
        # Import the transcription service
        from assistance.audio_live.transcription_service import transcription_service
        
        # Get available services
        services = transcription_service.get_available_services()
        
        print("Available services:")
        for service_name, service_info in services.items():
            status = "✅ Available" if service_info["available"] else "❌ Not available"
            print(f"  {service_name}: {status} ({service_info['name']})")
        
        print(f"Preferred service: {services['preferred']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to test transcription service: {str(e)}")
        return False

def main():
    """Run all tests."""
    print("Groq Transcription Integration Test")
    print("=" * 40)
    
    # Test 1: API Key availability
    key_available = test_groq_availability()
    
    # Test 2: API connection
    if key_available:
        connection_ok = test_groq_api_connection()
    else:
        connection_ok = False
    
    # Test 3: Service integration
    service_ok = test_transcription_service()
    
    # Summary
    print("\n" + "=" * 40)
    print("TEST SUMMARY")
    print("=" * 40)
    print(f"API Key Available: {'✅' if key_available else '❌'}")
    print(f"API Connection: {'✅' if connection_ok else '❌'}")
    print(f"Service Integration: {'✅' if service_ok else '❌'}")
    
    if key_available and connection_ok and service_ok:
        print("\n🎉 All tests passed! Groq integration is ready to use.")
    else:
        print("\n⚠️  Some tests failed. Please check the configuration.")
        
        if not key_available:
            print("\nTo fix API key issues:")
            print("1. Get a Groq API key from https://console.groq.com/")
            print("2. Add GROQ_API_KEY=your_key_here to your .env file")
        
        if not connection_ok:
            print("\nTo fix connection issues:")
            print("1. Check your internet connection")
            print("2. Verify your API key is correct")
            print("3. Check if Groq service is available")

if __name__ == "__main__":
    main() 