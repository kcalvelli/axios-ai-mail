"""Gmail API provider implementation."""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Set

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ...credentials import Credentials as CredLoader, CredentialError
from ..base import BaseEmailProvider, Message, ProviderConfig
from ..registry import ProviderRegistry

logger = logging.getLogger(__name__)


@dataclass
class GmailConfig(ProviderConfig):
    """Gmail-specific configuration."""

    label_prefix: str = "AI"
    label_colors: Dict[str, str] = None
    enable_webhooks: bool = False

    def __post_init__(self) -> None:
        """Initialize default label colors."""
        if self.label_colors is None:
            self.label_colors = {
                "AI/Work": "#4285f4",  # Blue
                "AI/Finance": "#0f9d58",  # Green
                "AI/Todo": "#f4b400",  # Orange
                "AI/Priority": "#db4437",  # Red
                "AI/Personal": "#ab47bc",  # Purple
                "AI/Dev": "#00acc1",  # Cyan
            }


class GmailProvider(BaseEmailProvider):
    """Gmail API provider implementation."""

    # Gmail API scopes
    SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

    def __init__(self, config: GmailConfig):
        """Initialize Gmail provider.

        Args:
            config: Gmail configuration
        """
        super().__init__(config)
        self.config: GmailConfig = config
        self.service = None
        self.creds: Optional[Credentials] = None

    def authenticate(self) -> None:
        """Authenticate with Gmail API using OAuth2."""
        try:
            # Load OAuth token from credential file
            token_data = CredLoader.load_oauth_token(self.config.credential_file)

            # Create credentials object
            self.creds = Credentials(
                token=token_data["access_token"],
                refresh_token=token_data["refresh_token"],
                token_uri="https://oauth2.googleapis.com/token",
                client_id=token_data["client_id"],
                client_secret=token_data["client_secret"],
                scopes=self.SCOPES,
            )

            # Refresh token if expired
            if self.creds.expired and self.creds.refresh_token:
                logger.info(f"Refreshing OAuth token for {self.email}")
                self.creds.refresh(Request())

                # Try to save updated token
                try:
                    updated_token = {
                        "access_token": self.creds.token,
                        "refresh_token": self.creds.refresh_token,
                        "client_id": token_data["client_id"],
                        "client_secret": token_data["client_secret"],
                    }
                    CredLoader.save_oauth_token(self.config.credential_file, updated_token)
                except Exception as e:
                    logger.warning(f"Could not save refreshed token: {e}")

            # Build Gmail service
            self.service = build("gmail", "v1", credentials=self.creds)
            logger.info(f"Successfully authenticated with Gmail for {self.email}")

        except CredentialError as e:
            logger.error(f"Credential error for {self.email}: {e}")
            raise
        except Exception as e:
            logger.error(f"Authentication failed for {self.email}: {e}")
            raise

    def fetch_messages(
        self, since: Optional[datetime] = None, max_results: int = 100
    ) -> List[Message]:
        """Fetch messages from Gmail.

        Args:
            since: Only fetch messages newer than this timestamp
            max_results: Maximum number of messages to fetch

        Returns:
            List of Message objects
        """
        if not self.service:
            self.authenticate()

        try:
            messages = []

            # Build query
            query = "in:inbox"
            if since:
                # Gmail uses YYYY/MM/DD format
                date_str = since.strftime("%Y/%m/%d")
                query += f" after:{date_str}"

            # Fetch message list
            results = (
                self.service.users()
                .messages()
                .list(userId="me", q=query, maxResults=max_results)
                .execute()
            )

            message_items = results.get("messages", [])
            logger.info(f"Fetched {len(message_items)} messages from Gmail")

            # Fetch full message details
            for item in message_items:
                msg_id = item["id"]
                try:
                    msg_detail = (
                        self.service.users()
                        .messages()
                        .get(userId="me", id=msg_id, format="full")
                        .execute()
                    )
                    message = self._parse_gmail_message(msg_detail)
                    messages.append(message)
                except HttpError as e:
                    logger.warning(f"Failed to fetch message {msg_id}: {e}")
                    continue

            return messages

        except HttpError as e:
            logger.error(f"Gmail API error while fetching messages: {e}")
            raise

    def _parse_gmail_message(self, msg_detail: Dict) -> Message:
        """Parse Gmail API message into normalized Message object.

        Args:
            msg_detail: Gmail API message object

        Returns:
            Normalized Message object
        """
        headers = {h["name"]: h["value"] for h in msg_detail["payload"]["headers"]}

        # Extract email body (simplified - prefer text/plain)
        body_text = None
        if "parts" in msg_detail["payload"]:
            for part in msg_detail["payload"]["parts"]:
                if part["mimeType"] == "text/plain":
                    body_data = part["body"].get("data", "")
                    if body_data:
                        import base64

                        body_text = base64.urlsafe_b64decode(body_data).decode("utf-8")
                        break

        # Extract labels
        label_ids = msg_detail.get("labelIds", [])
        labels = set(label_ids)  # Will map to human-readable names later

        # Parse date
        date = datetime.fromtimestamp(int(msg_detail["internalDate"]) / 1000)

        return Message(
            id=msg_detail["id"],
            thread_id=msg_detail["threadId"],
            subject=headers.get("Subject", "(No Subject)"),
            from_email=headers.get("From", ""),
            to_emails=[headers.get("To", "")],
            date=date,
            snippet=msg_detail.get("snippet", ""),
            body_text=body_text,
            labels=labels,
            is_unread="UNREAD" in label_ids,
            folder="inbox",  # Gmail uses labels, default to inbox
        )

    def update_labels(
        self, message_id: str, add_labels: Set[str], remove_labels: Set[str]
    ) -> None:
        """Update labels on a Gmail message.

        Args:
            message_id: Gmail message ID
            add_labels: Label names to add
            remove_labels: Label names to remove
        """
        if not self.service:
            self.authenticate()

        try:
            # Map label names to IDs
            label_mapping = self.list_labels()

            add_label_ids = [
                label_mapping[name] for name in add_labels if name in label_mapping
            ]
            remove_label_ids = [
                label_mapping[name] for name in remove_labels if name in label_mapping
            ]

            if not add_label_ids and not remove_label_ids:
                logger.debug(f"No label changes for message {message_id}")
                return

            # Update labels
            body = {
                "addLabelIds": add_label_ids,
                "removeLabelIds": remove_label_ids,
            }

            self.service.users().messages().modify(
                userId="me", id=message_id, body=body
            ).execute()

            logger.info(
                f"Updated labels on message {message_id}: "
                f"+{len(add_label_ids)} -{len(remove_label_ids)}"
            )

        except HttpError as e:
            logger.error(f"Failed to update labels on message {message_id}: {e}")
            raise

    def create_label(self, name: str, color: Optional[str] = None) -> str:
        """Create a Gmail label if it doesn't exist.

        Args:
            name: Label name
            color: Optional hex color code

        Returns:
            Label ID
        """
        if not self.service:
            self.authenticate()

        try:
            # Check if label already exists
            existing_labels = self.list_labels()
            if name in existing_labels:
                logger.debug(f"Label '{name}' already exists")
                return existing_labels[name]

            # Create label
            label_body = {
                "name": name,
                "labelListVisibility": "labelShow",
                "messageListVisibility": "show",
            }

            if color:
                # Gmail color format is different - this is simplified
                label_body["color"] = {"backgroundColor": color}

            result = self.service.users().labels().create(userId="me", body=label_body).execute()
            label_id = result["id"]

            logger.info(f"Created Gmail label: {name} (ID: {label_id})")

            # Invalidate cache
            self._label_cache = None

            return label_id

        except HttpError as e:
            logger.error(f"Failed to create label '{name}': {e}")
            raise

    def list_labels(self) -> Dict[str, str]:
        """Get all Gmail labels.

        Returns:
            Dict mapping label name to label ID
        """
        if not self.service:
            self.authenticate()

        try:
            results = self.service.users().labels().list(userId="me").execute()
            labels = results.get("labels", [])

            label_mapping = {label["name"]: label["id"] for label in labels}
            logger.debug(f"Fetched {len(label_mapping)} labels from Gmail")

            return label_mapping

        except HttpError as e:
            logger.error(f"Failed to list labels: {e}")
            raise


# Register Gmail provider
ProviderRegistry.register("gmail", GmailProvider)
