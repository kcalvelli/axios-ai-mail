"""Configuration file loader for Nix-generated configuration."""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

from ..db.database import Database

logger = logging.getLogger(__name__)


class ConfigLoader:
    """Load Nix-generated configuration and sync to database."""

    _cached_config: Optional[Dict] = None
    _cached_path: Optional[Path] = None

    @classmethod
    def load_config(cls, config_path: Optional[Path] = None) -> Dict:
        """
        Load config.yaml (JSON format) from XDG config directory.

        Args:
            config_path: Path to config file. Defaults to ~/.config/axios-ai-mail/config.yaml

        Returns:
            Configuration dictionary, or empty dict if file doesn't exist
        """
        if config_path is None:
            config_path = Path.home() / ".config" / "axios-ai-mail" / "config.yaml"

        # Return cached config if same path
        if cls._cached_config is not None and cls._cached_path == config_path:
            return cls._cached_config

        if not config_path.exists():
            logger.debug(f"Config file not found: {config_path}")
            return {}

        logger.info(f"Loading configuration from {config_path}")
        with open(config_path) as f:
            cls._cached_config = json.load(f)
            cls._cached_path = config_path
            return cls._cached_config

    @classmethod
    def get_ai_config(cls, config: Optional[Dict] = None) -> Dict:
        """
        Get AI configuration from loaded config.

        Args:
            config: Configuration dict, or None to load from default path

        Returns:
            AI configuration dict with keys: model, endpoint, temperature, tags
        """
        if config is None:
            config = cls.load_config()

        ai_config = config.get("ai", {})
        return {
            "model": ai_config.get("model", "llama3.2"),
            "endpoint": ai_config.get("endpoint", "http://localhost:11434"),
            "temperature": ai_config.get("temperature", 0.3),
            "tags": ai_config.get("tags", []),
        }

    @classmethod
    def get_custom_tags(cls, config: Optional[Dict] = None) -> Optional[List[Dict[str, str]]]:
        """
        Get custom tags from config for AI classification.

        Args:
            config: Configuration dict, or None to load from default path

        Returns:
            List of tag dicts with 'name' and 'description', or None if not configured
        """
        ai_config = cls.get_ai_config(config)
        tags = ai_config.get("tags", [])

        if not tags:
            return None

        # Ensure tags have required fields
        validated_tags = []
        for tag in tags:
            if "name" in tag and "description" in tag:
                validated_tags.append({
                    "name": tag["name"],
                    "description": tag["description"],
                })
            else:
                logger.warning(f"Invalid tag config (missing name/description): {tag}")

        return validated_tags if validated_tags else None

    @classmethod
    def clear_cache(cls) -> None:
        """Clear the cached configuration."""
        cls._cached_config = None
        cls._cached_path = None

    @staticmethod
    def sync_to_database(db: Database, config: Dict) -> None:
        """
        Sync configuration accounts to database (create/update).

        This is idempotent - accounts are created if they don't exist,
        or updated if they do. Existing database state (messages, classifications)
        is preserved.

        Args:
            db: Database instance
            config: Configuration dictionary from load_config()
        """
        if not config:
            logger.debug("No configuration to sync")
            return

        config_accounts = config.get("accounts", {})
        if not config_accounts:
            logger.warning("No accounts in configuration")
            return

        logger.info(f"Syncing {len(config_accounts)} accounts to database")

        for account_id, account_config in config_accounts.items():
            try:
                # Merge credential_file and real_name into settings
                settings = account_config.get("settings", {}).copy()
                if "credential_file" in account_config:
                    settings["credential_file"] = account_config["credential_file"]
                if "real_name" in account_config:
                    settings["real_name"] = account_config["real_name"]

                db.create_or_update_account(
                    account_id=account_id,
                    name=account_config.get("name", account_id),
                    email=account_config["email"],
                    provider=account_config["provider"],
                    settings=settings,
                )
                logger.debug(f"Synced account: {account_id} ({account_config['provider']})")
            except Exception as e:
                logger.error(f"Failed to sync account {account_id}: {e}")
                raise
