"""Message-related API endpoints."""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Query

from ...db.models import Message, Classification
from ..models import (
    MessageResponse,
    MessagesListResponse,
    UpdateTagsRequest,
    MarkReadRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def serialize_message(message: Message, classification: Optional[Classification] = None) -> dict:
    """Convert Message ORM object to API response dict."""
    data = {
        "id": message.id,
        "account_id": message.account_id,
        "thread_id": message.thread_id,
        "subject": message.subject,
        "from_email": message.from_email,
        "to_emails": message.to_emails,
        "date": message.date,
        "snippet": message.snippet,
        "is_unread": message.is_unread,
        "provider_labels": message.provider_labels,
        "tags": [],
        "priority": None,
        "todo": False,
        "can_archive": False,
        "classified_at": None,
    }

    # Add classification data if available
    if classification:
        data.update({
            "tags": classification.tags,
            "priority": classification.priority,
            "todo": classification.todo,
            "can_archive": classification.can_archive,
            "classified_at": classification.classified_at,
        })

    return data


@router.get("/messages", response_model=MessagesListResponse)
async def list_messages(
    request: Request,
    account_id: Optional[str] = Query(None, description="Filter by account ID"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    is_unread: Optional[bool] = Query(None, description="Filter by read status"),
    search: Optional[str] = Query(None, description="Search in subject, from, snippet"),
    limit: int = Query(50, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """List messages with filtering and pagination."""
    db = request.app.state.db

    try:
        # Query messages using database method
        messages = db.query_messages(
            account_id=account_id,
            tag=tag,
            is_unread=is_unread,
            limit=limit + 1,  # Fetch one extra to check if there are more
            offset=offset,
        )

        # Apply search filter if provided (simple client-side filter for now)
        if search:
            search_lower = search.lower()
            messages = [
                m for m in messages
                if search_lower in m.subject.lower()
                or search_lower in m.from_email.lower()
                or search_lower in m.snippet.lower()
            ]

        # Check if there are more results
        has_more = len(messages) > limit
        messages = messages[:limit]

        # Get classifications for all messages
        serialized = []
        for message in messages:
            classification = db.get_classification(message.id)
            serialized.append(serialize_message(message, classification))

        # Count total (approximate - same as returned if no filters)
        total = offset + len(messages) + (1 if has_more else 0)

        return MessagesListResponse(
            messages=serialized,
            total=total,
            limit=limit,
            offset=offset,
        )

    except Exception as e:
        logger.error(f"Error listing messages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/{message_id}", response_model=MessageResponse)
async def get_message(request: Request, message_id: str):
    """Get a single message by ID."""
    db = request.app.state.db

    try:
        message = db.get_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        classification = db.get_classification(message_id)
        return serialize_message(message, classification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting message {message_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/messages/{message_id}/tags", response_model=MessageResponse)
async def update_message_tags(
    request: Request,
    message_id: str,
    body: UpdateTagsRequest,
):
    """Update tags for a message."""
    db = request.app.state.db

    try:
        message = db.get_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Get existing classification
        classification = db.get_classification(message_id)

        if classification:
            # Update existing classification
            db.store_classification(
                message_id=message_id,
                tags=body.tags,
                priority=classification.priority,
                todo=classification.todo,
                can_archive=classification.can_archive,
                model=classification.model,
                confidence=classification.confidence,
            )
        else:
            # Create new classification (manual)
            db.store_classification(
                message_id=message_id,
                tags=body.tags,
                priority="normal",
                todo=False,
                can_archive=False,
                model="manual",
                confidence=1.0,
            )

        # Store feedback (original vs corrected tags)
        if classification and set(classification.tags) != set(body.tags):
            db.store_feedback(
                message_id=message_id,
                original_tags=classification.tags,
                corrected_tags=body.tags,
            )

        # Get updated classification
        updated_classification = db.get_classification(message_id)
        return serialize_message(message, updated_classification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tags for message {message_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/{message_id}/read", response_model=MessageResponse)
async def mark_message_read(
    request: Request,
    message_id: str,
    body: MarkReadRequest,
):
    """Mark a message as read or unread."""
    db = request.app.state.db

    try:
        message = db.get_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Update message read status
        message.is_unread = body.is_unread
        with db.session() as session:
            session.merge(message)
            session.commit()

        classification = db.get_classification(message_id)
        return serialize_message(message, classification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking message {message_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
