"""Configuration file loader for Nix-generated configuration."""

import json
import logging
from pathlib import Path
from typing import Dict, Optional

from ..db.database import Database

logger = logging.getLogger(__name__)


class ConfigLoader:
    """Load Nix-generated configuration and sync to database."""

    @staticmethod
    def load_config(config_path: Optional[Path] = None) -> Dict:
        """
        Load config.yaml (JSON format) from XDG config directory.

        Args:
            config_path: Path to config file. Defaults to ~/.config/axios-ai-mail/config.yaml

        Returns:
            Configuration dictionary, or empty dict if file doesn't exist
        """
        if config_path is None:
            config_path = Path.home() / ".config" / "axios-ai-mail" / "config.yaml"

        if not config_path.exists():
            logger.debug(f"Config file not found: {config_path}")
            return {}

        logger.info(f"Loading configuration from {config_path}")
        with open(config_path) as f:
            return json.load(f)

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
                # Merge credential_file into settings
                settings = account_config.get("settings", {}).copy()
                if "credential_file" in account_config:
                    settings["credential_file"] = account_config["credential_file"]

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
