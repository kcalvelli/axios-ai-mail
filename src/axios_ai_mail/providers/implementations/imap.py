"""IMAP email provider with KEYWORD extension support."""

import email
import imaplib
import logging
import re
from dataclasses import dataclass
from datetime import datetime
from email.header import decode_header
from typing import Dict, List, Optional, Set

from ..base import BaseEmailProvider, Message, ProviderConfig
from ...credentials import Credentials

logger = logging.getLogger(__name__)


@dataclass
class IMAPConfig(ProviderConfig):
    """IMAP-specific configuration."""

    host: str
    port: int = 993
    use_ssl: bool = True
    folder: str = "INBOX"
    keyword_prefix: str = "$"  # Prefix for IMAP keywords (e.g., $work, $finance)


class IMAPProvider(BaseEmailProvider):
    """IMAP email provider with KEYWORD extension support for tag synchronization."""

    def __init__(self, config: IMAPConfig):
        self.config = config
        self.connection: Optional[imaplib.IMAP4_SSL] = None
        self._supports_keywords: Optional[bool] = None

    def authenticate(self) -> None:
        """Authenticate with IMAP server using password."""
        logger.info(f"Authenticating IMAP: {self.config.email}@{self.config.host}")

        # Load password from credential file
        password = Credentials.load_password(self.config.credential_file)

        # Connect to IMAP server
        if self.config.use_ssl:
            self.connection = imaplib.IMAP4_SSL(self.config.host, self.config.port)
        else:
            self.connection = imaplib.IMAP4(self.config.host, self.config.port)

        # Login
        self.connection.login(self.config.email, password)
        logger.info(f"IMAP authentication successful for {self.config.email}")

        # Select folder
        self.connection.select(self.config.folder)

        # Check for KEYWORD capability
        typ, capabilities = self.connection.capability()
        if typ == "OK":
            capabilities_str = capabilities[0].decode("utf-8", errors="ignore")
            self._supports_keywords = "KEYWORD" in capabilities_str
            logger.info(
                f"IMAP KEYWORD extension: {'supported' if self._supports_keywords else 'not supported'}"
            )

    def fetch_messages(
        self, since: Optional[datetime] = None, max_results: int = 100
    ) -> List[Message]:
        """
        Fetch messages via IMAP SEARCH.

        Args:
            since: Only fetch messages after this date
            max_results: Maximum number of messages to fetch

        Returns:
            List of normalized Message objects
        """
        if not self.connection:
            raise RuntimeError("Not authenticated. Call authenticate() first.")

        logger.info(f"Fetching messages from IMAP (max: {max_results})")

        # Build IMAP search query
        if since:
            # IMAP date format: DD-Mon-YYYY (e.g., "01-Jan-2024")
            date_str = since.strftime("%d-%b-%Y")
            search_criteria = f"SINCE {date_str}"
        else:
            search_criteria = "ALL"

        # Search for message UIDs
        typ, msg_ids_data = self.connection.search(None, search_criteria)
        if typ != "OK":
            logger.error("IMAP SEARCH failed")
            return []

        msg_ids = msg_ids_data[0].split()

        # Limit results (take most recent)
        if len(msg_ids) > max_results:
            msg_ids = msg_ids[-max_results:]

        logger.info(f"Found {len(msg_ids)} messages to fetch")

        messages = []
        for msg_id in msg_ids:
            try:
                # Fetch message (RFC822 = full message, FLAGS = keywords/flags)
                typ, msg_data = self.connection.fetch(msg_id, "(RFC822 FLAGS)")

                if typ != "OK" or not msg_data or not msg_data[0]:
                    logger.warning(f"Failed to fetch message {msg_id}")
                    continue

                # Parse message data
                raw_email = msg_data[0][1]
                email_message = email.message_from_bytes(raw_email)

                # Extract flags from response
                flags_str = msg_data[0][0].decode("utf-8", errors="ignore")
                flags = self._parse_flags(flags_str)

                # Parse into normalized Message object
                message = self._parse_message(msg_id.decode(), email_message, flags)
                messages.append(message)

            except Exception as e:
                logger.error(f"Error parsing message {msg_id}: {e}")
                continue

        logger.info(f"Successfully fetched {len(messages)} messages")
        return messages

    def update_labels(
        self, message_id: str, add_labels: Set[str], remove_labels: Set[str]
    ) -> None:
        """
        Update IMAP keywords for a message.

        Args:
            message_id: Message ID (format: account_id:uid)
            add_labels: Labels to add
            remove_labels: Labels to remove
        """
        if not self._supports_keywords:
            logger.debug(
                "IMAP KEYWORD extension not supported - running in read-only mode"
            )
            return

        if not self.connection:
            raise RuntimeError("Not authenticated")

        # Extract IMAP UID from message_id (format: account_id:uid)
        uid = message_id.split(":")[-1]

        try:
            # Add keywords
            if add_labels:
                keywords = " ".join(
                    f"{self.config.keyword_prefix}{label}" for label in add_labels
                )
                self.connection.store(uid, "+FLAGS", f"({keywords})")
                logger.debug(f"Added keywords to message {uid}: {keywords}")

            # Remove keywords
            if remove_labels:
                keywords = " ".join(
                    f"{self.config.keyword_prefix}{label}" for label in remove_labels
                )
                self.connection.store(uid, "-FLAGS", f"({keywords})")
                logger.debug(f"Removed keywords from message {uid}: {keywords}")

        except Exception as e:
            logger.error(f"Failed to update labels for message {uid}: {e}")
            raise

    def create_label(self, name: str, color: Optional[str] = None) -> str:
        """
        IMAP doesn't require label creation (keywords are ad-hoc).

        Args:
            name: Label name
            color: Ignored for IMAP

        Returns:
            Keyword name with prefix
        """
        return f"{self.config.keyword_prefix}{name}"

    def list_labels(self) -> Dict[str, str]:
        """
        List all keywords in use.

        Note: IMAP doesn't have a built-in way to list all keywords.
        This returns an empty dict; keywords are discovered during message fetch.

        Returns:
            Empty dict (keywords are discovered dynamically)
        """
        return {}

    def get_label_mapping(self) -> Dict[str, str]:
        """
        Map tag names to IMAP keywords.

        For IMAP, this is a simple 1:1 mapping with prefix.

        Returns:
            Empty dict (not needed for IMAP simple mapping)
        """
        return {}

    def _parse_message(
        self, msg_id: str, email_message, flags: Set[str]
    ) -> Message:
        """
        Parse IMAP message into normalized Message object.

        Args:
            msg_id: IMAP UID
            email_message: Parsed email.message object
            flags: Set of IMAP flags/keywords

        Returns:
            Normalized Message object
        """
        # Decode subject
        subject = self._decode_header(email_message.get("Subject", "(No Subject)"))

        # Get from/to
        from_email = self._decode_header(email_message.get("From", ""))
        to_header = email_message.get("To", "")
        to_emails = [addr.strip() for addr in to_header.split(",")]

        # Get date
        date_str = email_message.get("Date", "")
        try:
            date = email.utils.parsedate_to_datetime(date_str)
        except Exception:
            date = datetime.utcnow()

        # Get body text
        body_text = self._extract_body(email_message)

        # Extract snippet (first 200 chars)
        snippet = (body_text[:200] + "...") if len(body_text) > 200 else body_text

        # Check unread status (\Seen flag)
        is_unread = "\\Seen" not in flags

        # Extract keywords (AI tags)
        keywords = [
            f.replace(self.config.keyword_prefix, "")
            for f in flags
            if f.startswith(self.config.keyword_prefix)
        ]

        # Get thread ID from Message-ID header
        thread_id = email_message.get("Message-ID", f"thread-{msg_id}")

        return Message(
            id=f"{self.config.account_id}:{msg_id}",
            account_id=self.config.account_id,
            thread_id=thread_id,
            subject=subject,
            from_email=from_email,
            to_emails=to_emails,
            date=date,
            snippet=snippet,
            body_text=body_text,
            is_unread=is_unread,
            provider_labels=keywords,
        )

    def _decode_header(self, header: str) -> str:
        """
        Decode MIME-encoded email headers.

        Args:
            header: Raw header string

        Returns:
            Decoded string
        """
        if not header:
            return ""

        decoded_parts = decode_header(header)
        decoded_str = ""

        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                try:
                    decoded_str += part.decode(encoding or "utf-8", errors="ignore")
                except Exception:
                    decoded_str += part.decode("utf-8", errors="ignore")
            else:
                decoded_str += str(part)

        return decoded_str.strip()

    def _extract_body(self, email_message) -> str:
        """
        Extract plain text body from email message.

        Args:
            email_message: Parsed email.message object

        Returns:
            Plain text body
        """
        body = ""

        if email_message.is_multipart():
            # Extract from multipart message
            for part in email_message.walk():
                content_type = part.get_content_type()
                disposition = str(part.get("Content-Disposition", ""))

                # Skip attachments
                if "attachment" in disposition:
                    continue

                # Prefer text/plain
                if content_type == "text/plain":
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode("utf-8", errors="ignore")
                            break
                    except Exception as e:
                        logger.warning(f"Failed to decode text/plain part: {e}")
                        continue

            # Fallback to text/html if text/plain not found
            if not body:
                for part in email_message.walk():
                    if part.get_content_type() == "text/html":
                        try:
                            payload = part.get_payload(decode=True)
                            if payload:
                                # Simple HTML stripping (basic, not perfect)
                                html_body = payload.decode("utf-8", errors="ignore")
                                body = re.sub(r"<[^>]+>", "", html_body)
                                break
                        except Exception:
                            continue
        else:
            # Non-multipart message
            try:
                payload = email_message.get_payload(decode=True)
                if payload:
                    body = payload.decode("utf-8", errors="ignore")
            except Exception as e:
                logger.warning(f"Failed to decode message body: {e}")

        return body.strip()

    def _parse_flags(self, flags_str: str) -> Set[str]:
        """
        Parse IMAP FLAGS response.

        Args:
            flags_str: FLAGS response string (e.g., "1 (FLAGS (\\Seen $work $priority))")

        Returns:
            Set of flags/keywords
        """
        # Example: "1 (FLAGS (\\Seen $work $priority))"
        match = re.search(r"\(FLAGS \((.*?)\)\)", flags_str)
        if match:
            flags_part = match.group(1)
            return set(flags_part.split())
        return set()
