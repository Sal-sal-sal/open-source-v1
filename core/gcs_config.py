"""
Google Cloud Storage configuration and setup.
Handles credentials and bucket configuration.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class GCSConfig:
    """Google Cloud Storage configuration manager."""
    
    def __init__(self):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME", "tts-audio-files11")
        self.credentials_path = self._get_credentials_path()
        self._setup_credentials()
    
    def _get_credentials_path(self) -> str:
        """Get the path to Google Cloud credentials file."""
        # Try multiple possible locations
        possible_paths = [
            # Environment variable
            os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
            # User's specific credentials file
            "resurses/a2a-tutor-d8273d52f567.json",
            # Common locations
            "credentials/google-credentials.json",
            "resurses/a2a-tutor-b359d89780f6.json",
            "resurses/google-credentials.json",
            "config/google-credentials.json",
            # Root directory
            "google-credentials.json",
        ]
        
        for path in possible_paths:
            if path and os.path.exists(path):
                logger.info(f"Found Google credentials at: {path}")
                return path
        
        # If no credentials file found, try to use service account key from environment
        service_account_key = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY")
        if service_account_key:
            logger.info("Using Google service account key from environment variable")
            return self._create_temp_credentials_file(service_account_key)
        
        logger.warning("No Google Cloud credentials found. Please set up credentials.")
        return None
    
    def _create_temp_credentials_file(self, service_account_key: str) -> str:
        """Create a temporary credentials file from environment variable."""
        try:
            import tempfile
            import json
            
            # Parse the JSON key
            credentials_data = json.loads(service_account_key)
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.json',
                delete=False,
                prefix='google-credentials-'
            )
            
            # Write credentials to temp file
            json.dump(credentials_data, temp_file)
            temp_file.close()
            
            logger.info(f"Created temporary credentials file: {temp_file.name}")
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Failed to create temporary credentials file: {e}")
            return None
    
    def _setup_credentials(self):
        """Set up Google Cloud credentials."""
        if self.credentials_path:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.credentials_path
            logger.info(f"Set GOOGLE_APPLICATION_CREDENTIALS to: {self.credentials_path}")
        else:
            logger.warning("No Google Cloud credentials configured")
    
    def get_bucket_name(self) -> str:
        """Get the configured bucket name."""
        return self.bucket_name
    
    def is_configured(self) -> bool:
        """Check if GCS is properly configured."""
        return self.credentials_path is not None and os.path.exists(self.credentials_path)

# Global instance
gcs_config = GCSConfig() 