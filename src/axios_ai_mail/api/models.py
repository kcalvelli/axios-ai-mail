"""Pydantic models for API request/response validation."""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# Response Models


class MessageResponse(BaseModel):
    """Message response model."""

    id: str
    account_id: str
    thread_id: Optional[str] = None
    subject: str
    from_email: str
    to_emails: List[str]
    date: datetime
    snippet: str
    is_unread: bool
    provider_labels: List[str]
    tags: List[str] = []  # From classification
    priority: Optional[str] = None
    todo: bool = False
    can_archive: bool = False
    classified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessagesListResponse(BaseModel):
    """List of messages with pagination."""

    messages: List[MessageResponse]
    total: int
    limit: int
    offset: int


class AccountResponse(BaseModel):
    """Account response model."""

    id: str
    name: str
    email: str
    provider: str
    last_sync: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccountStatsResponse(BaseModel):
    """Account statistics."""

    account_id: str
    total_messages: int
    unread_messages: int
    classified_messages: int
    classification_rate: float
    last_sync: Optional[datetime] = None


class TagResponse(BaseModel):
    """Tag with count."""

    name: str
    count: int
    percentage: float
    type: str = "ai"  # 'ai' or 'account'


class TagsListResponse(BaseModel):
    """List of tags with counts."""

    tags: List[TagResponse]
    total_classified: int


class StatsResponse(BaseModel):
    """Overall system statistics."""

    total_messages: int
    classified_messages: int
    unread_messages: int
    classification_rate: float
    accounts_count: int
    top_tags: List[TagResponse]
    accounts_breakdown: Dict[str, int] = {}  # Map of account_id to message count


class SyncStatusResponse(BaseModel):
    """Current sync status."""

    is_syncing: bool
    current_account: Optional[str] = None
    last_sync: Optional[datetime] = None
    message: str = "Idle"


class SyncResultResponse(BaseModel):
    """Sync operation result."""

    account_id: str
    fetched: int
    classified: int
    labeled: int
    errors: int
    duration: float


class ConfigResponse(BaseModel):
    """AI configuration."""

    enable: bool
    model: str
    endpoint: str
    temperature: float
    tags: List[dict]  # [{name: str, description: str}]


# Request Models


class UpdateTagsRequest(BaseModel):
    """Request to update message tags."""

    tags: List[str] = Field(..., min_length=0, max_length=20)


class MarkReadRequest(BaseModel):
    """Request to mark message as read/unread."""

    is_unread: bool


class TriggerSyncRequest(BaseModel):
    """Request to trigger manual sync."""

    account_id: Optional[str] = None
    max_messages: int = Field(default=100, ge=1, le=1000)


class UpdateConfigRequest(BaseModel):
    """Request to update AI configuration."""

    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)
    tags: Optional[List[dict]] = None


# WebSocket Models


class WebSocketMessage(BaseModel):
    """WebSocket message."""

    type: str
    data: dict = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)
