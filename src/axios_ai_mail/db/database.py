"""Database abstraction layer."""

import logging
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, Generator, List, Optional

from sqlalchemy import create_engine, event, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .models import Account, Base, Classification, Feedback, Message

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
        """Create or update an account."""
        with self.session() as session:
            account = session.get(Account, account_id)
            if account:
                account.name = name
                account.email = email
                account.provider = provider
                account.settings = settings or {}
            else:
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
                )
                session.add(message)
            session.commit()
            session.refresh(message)
            return message

    def query_messages(
        self,
        account_id: Optional[str] = None,
        tag: Optional[str] = None,
        is_unread: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Message]:
        """Query messages with filters."""
        with self.session() as session:
            query = select(Message)

            if account_id:
                query = query.where(Message.account_id == account_id)

            if is_unread is not None:
                query = query.where(Message.is_unread == is_unread)

            if tag:
                # Join with classifications to filter by tag
                query = query.join(Classification).where(Classification.tags.contains([tag]))

            query = query.order_by(Message.date.desc()).limit(limit).offset(offset)

            return list(session.execute(query).scalars().all())

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

    # Utility methods

    def close(self) -> None:
        """Close database connections."""
        self.engine.dispose()
        logger.info("Database connections closed")
