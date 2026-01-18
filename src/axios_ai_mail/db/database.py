"""Database abstraction layer."""

import logging
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, Generator, List, Optional

from sqlalchemy import create_engine, event, select, String
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Account, Attachment, Base, Classification, Draft, Feedback, Message

logger = logging.getLogger(__name__)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record) -> None:
    """Enable SQLite optimizations."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging for concurrency
    cursor.execute("PRAGMA synchronous=NORMAL")  # Balance safety and speed
    cursor.execute("PRAGMA foreign_keys=ON")  # Enforce foreign key constraints
    cursor.close()


class Database:
    """SQLite database abstraction for axios-ai-mail."""

    def __init__(self, db_path: str | Path):
        """Initialize database connection.

        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self.engine = create_engine(f"sqlite:///{self.db_path}", echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False)

        # Create tables if they don't exist
        Base.metadata.create_all(self.engine)
        logger.info(f"Database initialized at {self.db_path}")

    @contextmanager
    def session(self) -> Generator[Session, None, None]:
        """Provide a transactional session context."""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    # Account operations

    def get_account(self, account_id: str) -> Optional[Account]:
        """Get account by ID."""
        with self.session() as session:
            return session.get(Account, account_id)

    def list_accounts(self) -> List[Account]:
        """List all configured accounts."""
        with self.session() as session:
            return list(session.execute(select(Account)).scalars().all())

    def create_or_update_account(
        self,
        account_id: str,
        name: str,
        email: str,
        provider: str,
        settings: Optional[Dict] = None,
    ) -> Account:
        """Create or update an account.

        Handles account renames: if an account with the same email exists but
        with a different ID, this is treated as a rename. The old account is
        replaced with a new one and all messages are migrated.
        """
        with self.session() as session:
            account = session.get(Account, account_id)
            if account:
                # Account exists with this ID - update it
                account.name = name
                account.email = email
                account.provider = provider
                account.settings = settings or {}
            else:
                # Account ID doesn't exist - check if email already exists (rename case)
                existing_by_email = session.execute(
                    select(Account).where(Account.email == email)
                ).scalar_one_or_none()

                if existing_by_email:
                    # Same email, different ID = account rename
                    old_id = existing_by_email.id
                    old_last_sync = existing_by_email.last_sync
                    logger.info(f"Detected account rename: {old_id} → {account_id}")

                    # Step 1: Clear the email on old account to avoid UNIQUE conflict
                    existing_by_email.email = f"__migrating__{old_id}"
                    session.flush()

                    # Step 2: Create new account with the new ID
                    account = Account(
                        id=account_id,
                        name=name,
                        email=email,
                        provider=provider,
                        settings=settings or {},
                        last_sync=old_last_sync,  # Preserve last sync time
                    )
                    session.add(account)
                    session.flush()  # Make new account visible for FK constraint

                    # Step 3: Update all messages to point to the new account
                    from sqlalchemy import update
                    result = session.execute(
                        update(Message)
                        .where(Message.account_id == old_id)
                        .values(account_id=account_id)
                    )
                    logger.info(f"Migrated {result.rowcount} messages from {old_id} to {account_id}")

                    # Step 4: Delete the old account
                    session.delete(existing_by_email)
                    logger.info(f"Deleted old account: {old_id}")
                else:
                    # Completely new account
                    account = Account(
                        id=account_id,
                        name=name,
                        email=email,
                        provider=provider,
                        settings=settings or {},
                    )
                    session.add(account)
            session.commit()
            session.refresh(account)
            return account

    def update_last_sync(self, account_id: str, timestamp: datetime) -> None:
        """Update the last sync timestamp for an account."""
        with self.session() as session:
            account = session.get(Account, account_id)
            if account:
                account.last_sync = timestamp
                session.commit()

    def get_last_sync_time(self, account_id: str) -> Optional[datetime]:
        """Get the last sync timestamp for an account."""
        with self.session() as session:
            account = session.get(Account, account_id)
            return account.last_sync if account else None

    # Message operations

    def get_message(self, message_id: str) -> Optional[Message]:
        """Get message by ID."""
        with self.session() as session:
            return session.get(Message, message_id)

    def create_or_update_message(
        self,
        message_id: str,
        account_id: str,
        thread_id: Optional[str],
        subject: str,
        from_email: str,
        to_emails: List[str],
        date: datetime,
        snippet: str,
        is_unread: bool,
        provider_labels: List[str],
        folder: str = "inbox",
        body_text: Optional[str] = None,
        body_html: Optional[str] = None,
        imap_folder: Optional[str] = None,
        has_attachments: bool = False,
    ) -> Message:
        """Create or update a message."""
        with self.session() as session:
            message = session.get(Message, message_id)
            if message:
                message.thread_id = thread_id
                message.subject = subject
                message.from_email = from_email
                message.to_emails = to_emails
                message.date = date
                message.snippet = snippet
                message.is_unread = is_unread
                message.provider_labels = provider_labels
                message.folder = folder
                message.body_text = body_text
                message.body_html = body_html
                message.imap_folder = imap_folder
                message.has_attachments = has_attachments
            else:
                message = Message(
                    id=message_id,
                    account_id=account_id,
                    thread_id=thread_id,
                    subject=subject,
                    from_email=from_email,
                    to_emails=to_emails,
                    date=date,
                    snippet=snippet,
                    is_unread=is_unread,
                    provider_labels=provider_labels,
                    folder=folder,
                    body_text=body_text,
                    body_html=body_html,
                    imap_folder=imap_folder,
                    has_attachments=has_attachments,
                )
                session.add(message)
            session.commit()
            session.refresh(message)
            return message

    def update_message_read_status(
        self, message_id: str, is_unread: bool
    ) -> Optional[Message]:
        """Update read status of a message.

        Args:
            message_id: Message ID
            is_unread: True if unread, False if read

        Returns:
            Updated message or None if not found
        """
        with self.session() as session:
            message = session.get(Message, message_id)
            if message:
                message.is_unread = is_unread
                session.commit()
                session.refresh(message)
                return message
            return None

    def update_message_body(
        self, message_id: str, body_text: Optional[str], body_html: Optional[str]
    ) -> Optional[Message]:
        """Update body content of a message.

        Args:
            message_id: Message ID
            body_text: Plain text body
            body_html: HTML body

        Returns:
            Updated message or None if not found
        """
        with self.session() as session:
            message = session.get(Message, message_id)
            if message:
                message.body_text = body_text
                message.body_html = body_html
                session.commit()
                session.refresh(message)
                return message
            return None

    def move_to_trash(self, message_id: str) -> Optional[Message]:
        """Move a message to trash folder (soft delete).

        Args:
            message_id: Message ID to move to trash

        Returns:
            Updated message if successful, None if not found
        """
        with self.session() as session:
            message = session.get(Message, message_id)
            if message:
                # Save current folder so we can restore later
                message.original_folder = message.folder
                message.folder = "trash"
                session.commit()
                session.refresh(message)
                return message
            return None

    def restore_from_trash(self, message_id: str) -> Optional[Message]:
        """Restore a message from trash to its original folder.

        Args:
            message_id: Message ID to restore

        Returns:
            Updated message if successful, None if not found
        """
        with self.session() as session:
            message = session.get(Message, message_id)
            if message and message.folder == "trash":
                # Restore to original folder, default to inbox if not set
                message.folder = message.original_folder or "inbox"
                message.original_folder = None  # Clear the saved folder
                session.commit()
                session.refresh(message)
                return message
            return None

    def delete_message(self, message_id: str) -> bool:
        """Permanently delete a message from the database.

        Args:
            message_id: Message ID to delete

        Returns:
            True if deleted, False if not found
        """
        with self.session() as session:
            message = session.get(Message, message_id)
            if message:
                # Also delete associated classification
                classification = session.get(Classification, message_id)
                if classification:
                    session.delete(classification)

                session.delete(message)
                session.commit()
                return True
            return False

    def query_messages(
        self,
        account_id: Optional[str] = None,
        tag: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_unread: Optional[bool] = None,
        folder: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Message]:
        """Query messages with filters.

        Args:
            account_id: Filter by account ID
            tag: Single tag filter (for backward compatibility)
            tags: Multiple tags filter (OR logic - match any)
            is_unread: Filter by read status
            folder: Filter by folder (inbox, sent, trash)
            limit: Maximum number of results
            offset: Pagination offset
        """
        with self.session() as session:
            query = select(Message)

            # Handle tag filtering - support both single tag and multiple tags
            tags_to_filter = tags if tags else ([tag] if tag else None)

            # Separate account tags (emails) from AI tags
            account_emails = []
            ai_tags = []

            if tags_to_filter:
                # Get all accounts to match emails
                accounts = session.execute(select(Account)).scalars().all()
                account_email_set = {acc.email for acc in accounts}

                # Separate tags into account emails and AI tags
                for t in tags_to_filter:
                    if t in account_email_set:
                        account_emails.append(t)
                    else:
                        ai_tags.append(t)

            # Apply account filtering (OR logic if multiple accounts)
            if account_id:
                query = query.where(Message.account_id == account_id)
            elif account_emails:
                # Get account IDs from emails
                accounts = session.execute(
                    select(Account).where(Account.email.in_(account_emails))
                ).scalars().all()
                account_ids = [acc.id for acc in accounts]

                if account_ids:
                    from sqlalchemy import or_
                    query = query.where(or_(*[Message.account_id == aid for aid in account_ids]))

            if is_unread is not None:
                query = query.where(Message.is_unread == is_unread)

            # Apply folder filtering
            if folder:
                query = query.where(Message.folder == folder)

            # Apply AI tag filtering (OR logic - match any)
            if ai_tags:
                from sqlalchemy import or_

                tag_conditions = [
                    Classification.tags.cast(String).like(f'%"{t}"%')
                    for t in ai_tags
                ]

                query = query.join(Classification).where(or_(*tag_conditions))

            query = query.order_by(Message.date.desc()).limit(limit).offset(offset)

            return list(session.execute(query).scalars().all())

    def count_messages(
        self,
        account_id: Optional[str] = None,
        tag: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_unread: Optional[bool] = None,
        folder: Optional[str] = None,
    ) -> int:
        """Count messages matching the given filters.

        Args:
            account_id: Filter by account ID
            tag: Single tag filter (for backward compatibility)
            tags: Multiple tags filter (OR logic - match any)
            is_unread: Filter by read status
            folder: Filter by folder (inbox, sent, trash)

        Returns:
            Total count of matching messages
        """
        from sqlalchemy import func

        with self.session() as session:
            query = select(func.count(Message.id))

            # Handle tag filtering - support both single tag and multiple tags
            tags_to_filter = tags if tags else ([tag] if tag else None)

            # Separate account tags (emails) from AI tags
            account_emails = []
            ai_tags = []

            if tags_to_filter:
                # Get all accounts to match emails
                accounts = session.execute(select(Account)).scalars().all()
                account_email_set = {acc.email for acc in accounts}

                # Separate tags into account emails and AI tags
                for t in tags_to_filter:
                    if t in account_email_set:
                        account_emails.append(t)
                    else:
                        ai_tags.append(t)

            # Apply account filtering (OR logic if multiple accounts)
            if account_id:
                query = query.where(Message.account_id == account_id)
            elif account_emails:
                # Get account IDs from emails
                accounts = session.execute(
                    select(Account).where(Account.email.in_(account_emails))
                ).scalars().all()
                account_ids = [acc.id for acc in accounts]

                if account_ids:
                    from sqlalchemy import or_
                    query = query.where(or_(*[Message.account_id == aid for aid in account_ids]))

            if is_unread is not None:
                query = query.where(Message.is_unread == is_unread)

            # Apply folder filtering
            if folder:
                query = query.where(Message.folder == folder)

            # Apply AI tag filtering (OR logic - match any)
            if ai_tags:
                from sqlalchemy import or_
                from sqlalchemy.sql.expression import cast
                from sqlalchemy.types import String

                tag_conditions = [
                    Classification.tags.cast(String).like(f'%"{t}"%')
                    for t in ai_tags
                ]

                query = query.select_from(Message).join(Classification).where(or_(*tag_conditions))

            result = session.execute(query).scalar()
            return result or 0

    # Classification operations

    def has_classification(self, message_id: str) -> bool:
        """Check if a message has been classified."""
        with self.session() as session:
            classification = session.get(Classification, message_id)
            return classification is not None

    def store_classification(
        self,
        message_id: str,
        tags: List[str],
        priority: str,
        todo: bool,
        can_archive: bool,
        model: str,
        confidence: Optional[float] = None,
    ) -> Classification:
        """Store or update a classification."""
        with self.session() as session:
            classification = session.get(Classification, message_id)
            if classification:
                classification.tags = tags
                classification.priority = priority
                classification.todo = todo
                classification.can_archive = can_archive
                classification.model = model
                classification.confidence = confidence
                classification.classified_at = datetime.utcnow()
            else:
                classification = Classification(
                    message_id=message_id,
                    tags=tags,
                    priority=priority,
                    todo=todo,
                    can_archive=can_archive,
                    model=model,
                    confidence=confidence,
                )
                session.add(classification)
            session.commit()
            session.refresh(classification)
            return classification

    def get_classification(self, message_id: str) -> Optional[Classification]:
        """Get classification for a message."""
        with self.session() as session:
            return session.get(Classification, message_id)

    # Feedback operations

    def store_feedback(
        self, message_id: str, original_tags: List[str], corrected_tags: List[str]
    ) -> Feedback:
        """Store user feedback for a classification correction."""
        with self.session() as session:
            feedback = Feedback(
                message_id=message_id,
                original_tags=original_tags,
                corrected_tags=corrected_tags,
            )
            session.add(feedback)
            session.commit()
            session.refresh(feedback)
            return feedback

    def get_feedback_stats(self) -> Dict[str, int]:
        """Get statistics about user feedback."""
        with self.session() as session:
            total_feedback = session.query(Feedback).count()
            return {"total_corrections": total_feedback}

    # Draft operations

    def create_draft(
        self,
        draft_id: str,
        account_id: str,
        subject: str,
        to_emails: List[str],
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None,
        thread_id: Optional[str] = None,
        in_reply_to: Optional[str] = None,
    ) -> Draft:
        """Create a new draft.

        Args:
            draft_id: Unique draft ID
            account_id: Account ID to send from
            subject: Email subject
            to_emails: List of recipient emails
            cc_emails: List of CC emails
            bcc_emails: List of BCC emails
            body_text: Plain text body
            body_html: HTML body
            thread_id: Thread ID for replies
            in_reply_to: Message ID being replied to

        Returns:
            Created draft
        """
        with self.session() as session:
            draft = Draft(
                id=draft_id,
                account_id=account_id,
                subject=subject,
                to_emails=to_emails,
                cc_emails=cc_emails,
                bcc_emails=bcc_emails,
                body_text=body_text,
                body_html=body_html,
                thread_id=thread_id,
                in_reply_to=in_reply_to,
            )
            session.add(draft)
            session.commit()
            session.refresh(draft)
            return draft

    def get_draft(self, draft_id: str) -> Optional[Draft]:
        """Get draft by ID."""
        with self.session() as session:
            return session.get(Draft, draft_id)

    def update_draft(
        self,
        draft_id: str,
        subject: Optional[str] = None,
        to_emails: Optional[List[str]] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None,
    ) -> Optional[Draft]:
        """Update an existing draft.

        Args:
            draft_id: Draft ID to update
            subject: Updated subject (if provided)
            to_emails: Updated recipients (if provided)
            cc_emails: Updated CC list (if provided)
            bcc_emails: Updated BCC list (if provided)
            body_text: Updated plain text body (if provided)
            body_html: Updated HTML body (if provided)

        Returns:
            Updated draft or None if not found
        """
        with self.session() as session:
            draft = session.get(Draft, draft_id)
            if draft:
                if subject is not None:
                    draft.subject = subject
                if to_emails is not None:
                    draft.to_emails = to_emails
                if cc_emails is not None:
                    draft.cc_emails = cc_emails
                if bcc_emails is not None:
                    draft.bcc_emails = bcc_emails
                if body_text is not None:
                    draft.body_text = body_text
                if body_html is not None:
                    draft.body_html = body_html
                draft.updated_at = datetime.utcnow()
                session.commit()
                session.refresh(draft)
                return draft
            return None

    def delete_draft(self, draft_id: str) -> bool:
        """Delete a draft.

        Args:
            draft_id: Draft ID to delete

        Returns:
            True if deleted, False if not found
        """
        with self.session() as session:
            draft = session.get(Draft, draft_id)
            if draft:
                session.delete(draft)
                session.commit()
                return True
            return False

    def list_drafts(self, account_id: Optional[str] = None) -> List[Draft]:
        """List drafts, optionally filtered by account.

        Args:
            account_id: Filter by account ID (optional)

        Returns:
            List of drafts ordered by updated_at (newest first)
        """
        with self.session() as session:
            query = select(Draft)
            if account_id:
                query = query.where(Draft.account_id == account_id)
            query = query.order_by(Draft.updated_at.desc())
            return list(session.execute(query).scalars().all())

    # Attachment operations

    def add_attachment(
        self,
        attachment_id: str,
        filename: str,
        content_type: str,
        size: int,
        data: bytes,
        draft_id: Optional[str] = None,
        message_id: Optional[str] = None,
    ) -> Attachment:
        """Add an attachment to a draft or message.

        Args:
            attachment_id: Unique attachment ID
            filename: Original filename
            content_type: MIME content type
            size: File size in bytes
            data: Binary file data
            draft_id: Draft ID (for draft attachments)
            message_id: Message ID (for message attachments)

        Returns:
            Created attachment
        """
        with self.session() as session:
            attachment = Attachment(
                id=attachment_id,
                filename=filename,
                content_type=content_type,
                size=size,
                data=data,
                draft_id=draft_id,
                message_id=message_id,
            )
            session.add(attachment)
            session.commit()
            session.refresh(attachment)
            return attachment

    def get_attachment(self, attachment_id: str) -> Optional[Attachment]:
        """Get attachment by ID."""
        with self.session() as session:
            return session.get(Attachment, attachment_id)

    def delete_attachment(self, attachment_id: str) -> bool:
        """Delete an attachment.

        Args:
            attachment_id: Attachment ID to delete

        Returns:
            True if deleted, False if not found
        """
        with self.session() as session:
            attachment = session.get(Attachment, attachment_id)
            if attachment:
                session.delete(attachment)
                session.commit()
                return True
            return False

    def list_attachments(
        self, draft_id: Optional[str] = None, message_id: Optional[str] = None
    ) -> List[Attachment]:
        """List attachments for a draft or message.

        Args:
            draft_id: Filter by draft ID
            message_id: Filter by message ID

        Returns:
            List of attachments ordered by created_at
        """
        with self.session() as session:
            query = select(Attachment)
            if draft_id:
                query = query.where(Attachment.draft_id == draft_id)
            elif message_id:
                query = query.where(Attachment.message_id == message_id)
            query = query.order_by(Attachment.created_at.asc())
            attachments = list(session.execute(query).scalars().all())

            # Ensure all data is loaded before session closes (prevent lazy load errors)
            for att in attachments:
                # Access data to ensure it's loaded into the object
                _ = att.data
                # Expunge from session so it can be used after session closes
                session.expunge(att)

            return attachments

    # Maintenance operations

    def get_message_count(self, account_id: Optional[str] = None) -> int:
        """Get total message count.

        Args:
            account_id: Optional account ID filter

        Returns:
            Total message count
        """
        from sqlalchemy import func

        with self.session() as session:
            query = select(func.count(Message.id))
            if account_id:
                query = query.where(Message.account_id == account_id)
            result = session.execute(query).scalar()
            return result or 0

    def get_unclassified_messages(self, limit: int = 10000) -> List[Message]:
        """Get messages without classification.

        Args:
            limit: Maximum number of messages to return

        Returns:
            List of unclassified messages
        """
        from sqlalchemy import not_, exists

        with self.session() as session:
            # Find messages that don't have a classification
            subquery = select(Classification.message_id).where(
                Classification.message_id == Message.id
            ).exists()

            query = (
                select(Message)
                .where(not_(subquery))
                .order_by(Message.date.desc())
                .limit(limit)
            )

            return list(session.execute(query).scalars().all())

    def list_messages(self, limit: int = 10000) -> List[Message]:
        """List all messages up to limit.

        Args:
            limit: Maximum number of messages to return

        Returns:
            List of messages ordered by date descending
        """
        with self.session() as session:
            query = (
                select(Message)
                .order_by(Message.date.desc())
                .limit(limit)
            )
            return list(session.execute(query).scalars().all())

    def update_message_tags(
        self,
        message_id: str,
        tags: List[str],
        confidence: Optional[float] = None,
        user_edited: bool = False,
    ) -> Optional[Classification]:
        """Update tags for a message classification.

        Args:
            message_id: Message ID
            tags: New list of tags
            confidence: Optional confidence score
            user_edited: Whether this is a user edit (stores feedback if True)

        Returns:
            Updated classification or None if message not found
        """
        with self.session() as session:
            classification = session.get(Classification, message_id)
            if classification:
                old_tags = classification.tags.copy() if classification.tags else []

                classification.tags = tags
                if confidence is not None:
                    classification.confidence = confidence
                classification.classified_at = datetime.utcnow()

                # Store feedback if this is a user edit with changed tags
                if user_edited and old_tags != tags:
                    feedback = Feedback(
                        message_id=message_id,
                        original_tags=old_tags,
                        corrected_tags=tags,
                    )
                    session.add(feedback)

                session.commit()
                session.refresh(classification)
                return classification
            return None

    def has_user_feedback(self, message_id: str) -> bool:
        """Check if a message has user feedback (indicating user-edited tags).

        Args:
            message_id: Message ID to check

        Returns:
            True if the message has feedback entries
        """
        with self.session() as session:
            result = session.query(Feedback).filter(
                Feedback.message_id == message_id
            ).first()
            return result is not None

    def refresh_tag_stats(self) -> Dict[str, int]:
        """Recalculate tag statistics.

        Returns:
            Dictionary of tag names to counts
        """
        from sqlalchemy import func

        with self.session() as session:
            # Get all classifications with their tags
            classifications = session.execute(select(Classification)).scalars().all()

            # Count tags
            tag_counts: Dict[str, int] = {}
            for classification in classifications:
                for tag in classification.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1

            logger.info(f"Refreshed tag stats: {len(tag_counts)} unique tags")
            return tag_counts

    # Utility methods

    def close(self) -> None:
        """Close database connections."""
        self.engine.dispose()
        logger.info("Database connections closed")
