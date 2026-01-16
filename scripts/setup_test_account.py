#!/usr/bin/env python3
"""
Setup script to manually add a test account to the database.
Use this until the NixOS module is implemented.
"""

from pathlib import Path
from axios_ai_mail.db.database import Database

# Database location
db_path = Path.home() / ".local/share/axios-ai-mail/mail.db"
db = Database(db_path)

print("Setting up test Gmail account...")

# Create test account
account = db.create_or_update_account(
    account_id="personal",
    name="Personal Gmail",
    email="kc.calvelli@gmail.com",
    provider="gmail",
    settings={
        # Update this path to your actual OAuth token file
        "oauth_token_file": str(Path.home() / "gmail-oauth-token.json"),
        "label_prefix": "AI",
        "ai_model": "llama3.2",
        "ai_endpoint": "http://localhost:11434",
    }
)

print(f"✅ Account created: {account.email}")
print(f"   Provider: {account.provider}")
print(f"   OAuth token file: {account.settings['oauth_token_file']}")
print()
print("Next steps:")
print("1. Set up OAuth token: axios-ai-mail auth setup gmail --output ~/gmail-oauth-token.json")
print("2. Make sure Ollama is running: ollama serve")
print("3. Run sync: axios-ai-mail sync run --max 10")
