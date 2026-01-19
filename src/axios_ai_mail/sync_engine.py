"""Sync engine for coordinating email fetch, classification, and label updates."""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional, Set

from .ai_classifier import AIClassifier, AIConfig
from .db.database import Database
from .providers.base import BaseEmailProvider, Message

logger = logging.getLogger(__name__)


@dataclass
class NewMessageInfo:
    """Info about a new message for notifications."""

    id: str
    subject: str
    from_email: str
    snippet: str

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "subject": self.subject,
            "from_email": self.from_email,
            "snippet": self.snippet,
        }


@dataclass
class SyncResult:
    """Result of a sync operation."""

    account_id: str
    messages_fetched: int
    messages_classified: int
    labels_updated: int
    errors: List[str]
    duration_seconds: float
    new_messages: List[NewMessageInfo] = None

    def __post_init__(self):
        if self.new_messages is None:
            self.new_messages = []

    def __str__(self) -> str:
        """String representation."""
        return (
            f"SyncResult(account={self.account_id}, "
            f"fetched={self.messages_fetched}, "
            f"classified={self.messages_classified}, "
            f"labels_updated={self.labels_updated}, "
            f"errors={len(self.errors)}, "
            f"duration={self.duration_seconds:.2f}s)"
        )


class SyncEngine:
    """Orchestrates email sync, AI classification, and label updates."""

    def __init__(
        self,
        provider: BaseEmailProvider,
        database: Database,
        ai_classifier: AIClassifier,
        label_prefix: str = "AI",
    ):
        """Initialize sync engine.

        Args:
            provider: Email provider instance
            database: Database instance
            ai_classifier: AI classifier instance
            label_prefix: Prefix for AI-generated labels (e.g., "AI" -> "AI/Work")
        """
        self.provider = provider
        self.db = database
        self.ai_classifier = ai_classifier
        self.label_prefix = label_prefix
        self.account_id = provider.account_id

    def sync(self, max_messages: int = 100) -> SyncResult:
        """Perform a complete sync operation.

        1. Fetch new messages from provider
        2. Store messages in database
        3. Classify unclassified messages
        4. Push AI labels back to provider
        5. Update sync timestamp

        Args:
            max_messages: Maximum messages to fetch in this sync

        Returns:
            SyncResult with statistics
        """
        start_time = datetime.now(timezone.utc)
        errors = []
        messages_fetched = 0
        messages_classified = 0
        labels_updated = 0
        new_messages: List[NewMessageInfo] = []

        logger.info(f"Starting sync for account {self.account_id}")

        try:
            # 1. Fetch messages from provider
            last_sync = self.db.get_last_sync_time(self.account_id)
            logger.info(f"Last sync: {last_sync}")

            messages = self.provider.fetch_messages(since=last_sync, max_results=max_messages)
            messages_fetched = len(messages)

            if not messages:
                logger.info("No new messages to process")
                return SyncResult(
                    account_id=self.account_id,
                    messages_fetched=0,
                    messages_classified=0,
                    labels_updated=0,
                    errors=[],
                    duration_seconds=(datetime.now(timezone.utc) - start_time).total_seconds(),
                )

            # 2. Store messages in database
            for message in messages:
                try:
                    # Check if message already exists in database
                    existing_message = self.db.get_message(message.id)
                    is_new = existing_message is None

                    # For existing messages, preserve local state
                    # Philosophy: local consistency first, provider sync is best effort
                    if is_new:
                        is_unread = message.is_unread
                        folder = message.folder
                    else:
                        # Preserve local is_unread (user may have marked as read)
                        is_unread = existing_message.is_unread
                        # Preserve local folder (user may have moved to trash)
                        folder = existing_message.folder

                    self.db.create_or_update_message(
                        message_id=message.id,
                        account_id=self.account_id,
                        thread_id=message.thread_id,
                        subject=message.subject,
                        from_email=message.from_email,
                        to_emails=message.to_emails,
                        date=message.date,
                        snippet=message.snippet,
                        is_unread=is_unread,
                        provider_labels=list(message.labels),
                        folder=folder,
                        body_text=message.body_text,
                        body_html=message.body_html,
                        imap_folder=message.imap_folder,
                        has_attachments=message.has_attachments,
                    )

                    # Track new messages for notifications
                    if is_new:
                        new_messages.append(NewMessageInfo(
                            id=message.id,
                            subject=message.subject,
                            from_email=message.from_email,
                            snippet=message.snippet[:100] if message.snippet else "",
                        ))
                except Exception as e:
                    error_msg = f"Failed to store message {message.id}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)

            # 3. Classify unclassified messages
            to_classify = [msg for msg in messages if not self.db.has_classification(msg.id)]
            logger.info(f"Classifying {len(to_classify)} messages")

            for message in to_classify:
                try:
                    classification = self.ai_classifier.classify(message)

                    # Store classification in database
                    self.db.store_classification(
                        message_id=message.id,
                        tags=classification.tags,
                        priority=classification.priority,
                        todo=classification.todo,
                        can_archive=classification.can_archive,
                        model=self.ai_classifier.config.model,
                        confidence=classification.confidence,
                    )

                    messages_classified += 1

                    # 4. Push labels to provider
                    try:
                        add_labels, remove_labels = self._compute_label_changes(
                            message, classification
                        )

                        if add_labels or remove_labels:
                            # Ensure labels exist
                            self.provider.ensure_labels_exist(add_labels)

                            # Update labels on provider
                            self.provider.update_labels(
                                message.id, add_labels=add_labels, remove_labels=remove_labels
                            )

                            labels_updated += 1
                            logger.debug(
                                f"Updated labels for {message.id}: +{add_labels} -{remove_labels}"
                            )

                    except Exception as e:
                        error_msg = f"Failed to update labels for {message.id}: {e}"
                        logger.error(error_msg)
                        errors.append(error_msg)

                except Exception as e:
                    error_msg = f"Failed to classify message {message.id}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)

            # 5. Update last sync timestamp
            self.db.update_last_sync(self.account_id, datetime.now(timezone.utc))

            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            result = SyncResult(
                account_id=self.account_id,
                messages_fetched=messages_fetched,
                messages_classified=messages_classified,
                labels_updated=labels_updated,
                errors=errors,
                duration_seconds=duration,
                new_messages=new_messages,
            )

            logger.info(f"Sync completed: {result}")
            if new_messages:
                logger.info(f"New messages for notifications: {len(new_messages)}")
            return result

        except Exception as e:
            error_msg = f"Sync failed for account {self.account_id}: {e}"
            logger.error(error_msg)
            errors.append(error_msg)

            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            return SyncResult(
                account_id=self.account_id,
                messages_fetched=messages_fetched,
                messages_classified=messages_classified,
                labels_updated=labels_updated,
                errors=errors,
                duration_seconds=duration,
            )

    def _compute_label_changes(
        self, message: Message, classification
    ) -> tuple[Set[str], Set[str]]:
        """Compute which labels to add/remove based on classification.

        Args:
            message: Message being classified
            classification: AI classification result

        Returns:
            Tuple of (labels_to_add, labels_to_remove)
        """
        # Map AI tags to provider labels
        ai_labels = self.provider.map_tags_to_labels(
            classification.tags, label_prefix=self.label_prefix
        )

        # Add priority label if high priority
        if classification.priority == "high":
            ai_labels.add(f"{self.label_prefix}/Priority")

        # Add todo label if action required
        if classification.todo:
            ai_labels.add(f"{self.label_prefix}/ToDo")

        # Current provider labels (filter to only AI labels)
        current_ai_labels = {
            label for label in message.labels if label.startswith(f"{self.label_prefix}/")
        }

        # Compute differences
        labels_to_add = ai_labels - current_ai_labels
        labels_to_remove = current_ai_labels - ai_labels

        # Handle archiving
        if classification.can_archive:
            # Remove inbox label (provider-specific)
            if "INBOX" in message.labels:
                labels_to_remove.add("INBOX")

        return labels_to_add, labels_to_remove

    def reclassify_all(self, max_messages: Optional[int] = None) -> SyncResult:
        """Reclassify all messages in the database.

        Args:
            max_messages: Maximum messages to reclassify (None for all)

        Returns:
            SyncResult with statistics
        """
        start_time = datetime.now(timezone.utc)
        errors = []
        messages_classified = 0
        labels_updated = 0

        logger.info(f"Starting reclassification for account {self.account_id}")

        try:
            # Get all messages for this account
            messages = self.db.query_messages(account_id=self.account_id, limit=max_messages or 10000)
            logger.info(f"Reclassifying {len(messages)} messages")

            for db_message in messages:
                try:
                    # Convert database message to Message object for classification
                    message = Message(
                        id=db_message.id,
                        thread_id=db_message.thread_id or "",
                        subject=db_message.subject,
                        from_email=db_message.from_email,
                        to_emails=db_message.to_emails,
                        date=db_message.date,
                        snippet=db_message.snippet,
                        body_text=db_message.body_text,
                        body_html=db_message.body_html,
                        labels=set(db_message.provider_labels),
                        is_unread=db_message.is_unread,
                        folder=db_message.folder,
                    )

                    # Classify
                    classification = self.ai_classifier.classify(message)

                    # Store classification
                    self.db.store_classification(
                        message_id=message.id,
                        tags=classification.tags,
                        priority=classification.priority,
                        todo=classification.todo,
                        can_archive=classification.can_archive,
                        model=self.ai_classifier.config.model,
                        confidence=classification.confidence,
                    )

                    messages_classified += 1

                    # Update labels on provider
                    try:
                        add_labels, remove_labels = self._compute_label_changes(
                            message, classification
                        )

                        if add_labels or remove_labels:
                            self.provider.ensure_labels_exist(add_labels)
                            self.provider.update_labels(
                                message.id, add_labels=add_labels, remove_labels=remove_labels
                            )
                            labels_updated += 1

                    except Exception as e:
                        error_msg = f"Failed to update labels for {message.id}: {e}"
                        logger.error(error_msg)
                        errors.append(error_msg)

                except Exception as e:
                    error_msg = f"Failed to reclassify message {db_message.id}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)

            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            result = SyncResult(
                account_id=self.account_id,
                messages_fetched=0,
                messages_classified=messages_classified,
                labels_updated=labels_updated,
                errors=errors,
                duration_seconds=duration,
            )

            logger.info(f"Reclassification completed: {result}")
            return result

        except Exception as e:
            error_msg = f"Reclassification failed for account {self.account_id}: {e}"
            logger.error(error_msg)
            errors.append(error_msg)

            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            return SyncResult(
                account_id=self.account_id,
                messages_fetched=0,
                messages_classified=messages_classified,
                labels_updated=labels_updated,
                errors=errors,
                duration_seconds=duration,
            )
