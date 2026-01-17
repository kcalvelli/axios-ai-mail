"""SQLAlchemy models for axios-ai-mail database."""

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""

    pass


class Account(Base):
    """Email account configuration."""

    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # gmail, imap, outlook
    last_sync: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    settings: Mapped[Dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    messages: Mapped[List["Message"]] = relationship(back_populates="account", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Account(id={self.id!r}, email={self.email!r}, provider={self.provider!r})>"


class Message(Base):
    """Email message metadata."""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    account_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False
    )
    thread_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    from_email: Mapped[str] = mapped_column(String(255), nullable=False)
    to_emails: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    snippet: Mapped[str] = mapped_column(Text, nullable=False)
    is_unread: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    provider_labels: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)
    folder: Mapped[str] = mapped_column(String(100), nullable=False, default="inbox")
    original_folder: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    imap_folder: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Actual IMAP folder name (e.g., "INBOX.Sent")
    body_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    account: Mapped["Account"] = relationship(back_populates="messages")
    classification: Mapped[Optional["Classification"]] = relationship(
        back_populates="message", cascade="all, delete-orphan", uselist=False
    )
    feedback_entries: Mapped[List["Feedback"]] = relationship(
        back_populates="message", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Message(id={self.id!r}, subject={self.subject!r})>"


class Classification(Base):
    """AI classification for a message."""

    __tablename__ = "classifications"

    message_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True
    )
    tags: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), nullable=False)  # high, normal
    todo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_archive: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    classified_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(nullable=True)

    # Relationships
    message: Mapped["Message"] = relationship(back_populates="classification")

    def __repr__(self) -> str:
        return f"<Classification(message_id={self.message_id!r}, tags={self.tags!r})>"


class Feedback(Base):
    """User feedback for classification corrections."""

    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False
    )
    original_tags: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    corrected_tags: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    corrected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    message: Mapped["Message"] = relationship(back_populates="feedback_entries")

    def __repr__(self) -> str:
        return f"<Feedback(id={self.id}, message_id={self.message_id!r})>"
