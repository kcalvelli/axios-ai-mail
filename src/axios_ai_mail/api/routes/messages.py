"""Message-related API endpoints."""

import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel

from ...db.models import Message, Classification
from ..models import (
    MessageResponse,
    MessagesListResponse,
    UpdateTagsRequest,
    MarkReadRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# Request models for bulk operations
class BulkReadRequest(BaseModel):
    """Request to mark multiple messages as read/unread."""
    message_ids: List[str]
    is_unread: bool


class BulkDeleteRequest(BaseModel):
    """Request to delete multiple messages."""
    message_ids: List[str]


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
    tag: Optional[str] = Query(None, description="Filter by single tag (deprecated)"),
    tags: Optional[List[str]] = Query(None, description="Filter by multiple tags (OR logic)"),
    is_unread: Optional[bool] = Query(None, description="Filter by read status"),
    folder: Optional[str] = Query(None, description="Filter by folder (inbox, sent, trash)"),
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
            tags=tags,
            is_unread=is_unread,
            folder=folder,
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


@router.post("/messages/bulk/read")
async def bulk_mark_read(request: Request, body: BulkReadRequest):
    """Mark multiple messages as read or unread."""
    db = request.app.state.db

    try:
        updated_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                updated_message = db.update_message_read_status(message_id, body.is_unread)
                if updated_message:
                    updated_count += 1
                else:
                    errors.append({"message_id": message_id, "error": "Not found"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error updating message {message_id}: {e}")

        return {
            "updated": updated_count,
            "total": len(body.message_ids),
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Error in bulk mark read: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/bulk/delete")
async def bulk_delete(request: Request, body: BulkDeleteRequest):
    """Delete multiple messages (always moves to trash)."""
    db = request.app.state.db

    try:
        moved_to_trash_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                # Always move to trash
                updated = db.move_to_trash(message_id)
                if updated:
                    moved_to_trash_count += 1
                else:
                    errors.append({"message_id": message_id, "error": "Not found"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error deleting message {message_id}: {e}")

        return {
            "moved_to_trash": moved_to_trash_count,
            "total": len(body.message_ids),
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Error in bulk delete: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/bulk/restore")
async def bulk_restore(request: Request, body: BulkDeleteRequest):
    """Restore multiple messages from trash to inbox."""
    db = request.app.state.db

    try:
        restored_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                # Restore from trash
                updated = db.restore_from_trash(message_id)
                if updated:
                    restored_count += 1
                else:
                    errors.append({"message_id": message_id, "error": "Not found in trash"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error restoring message {message_id}: {e}")

        return {
            "restored": restored_count,
            "total": len(body.message_ids),
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Error in bulk restore: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/bulk/permanent-delete")
async def bulk_permanent_delete(request: Request, body: BulkDeleteRequest):
    """Permanently delete multiple messages (cannot be undone)."""
    db = request.app.state.db

    try:
        deleted_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                # Permanently delete from database
                success = db.delete_message(message_id)
                if success:
                    deleted_count += 1
                else:
                    errors.append({"message_id": message_id, "error": "Not found"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error permanently deleting message {message_id}: {e}")

        return {
            "deleted": deleted_count,
            "total": len(body.message_ids),
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Error in bulk permanent delete: {e}", exc_info=True)
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


@router.get("/messages/{message_id}/body")
async def get_message_body(request: Request, message_id: str):
    """Get full message body (text and HTML)."""
    db = request.app.state.db
    config = request.app.state.config

    try:
        message = db.get_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # If body is not in database, fetch it from provider on-demand
        if not message.body_text and not message.body_html:
            logger.info(f"Body not in DB for {message_id}, fetching from provider")

            # Only attempt on-demand fetch if config is available
            if config:
                try:
                    # Get provider for this account
                    from ...providers.factory import ProviderFactory
                    from ...config.loader import AccountConfig

                    # Find account config
                    account_config = None
                    for acc in config.accounts:
                        if acc.id == message.account_id:
                            account_config = acc
                            break

                    if account_config:
                        # Create provider and fetch body
                        provider = ProviderFactory.create_provider(account_config)
                        body_text, body_html = provider.fetch_body(message.id)

                        # Update database with fetched body
                        db.update_message_body(message.id, body_text, body_html)

                        # Update in-memory message object
                        message.body_text = body_text
                        message.body_html = body_html

                        logger.info(f"Fetched and cached body for {message_id}")
                    else:
                        logger.warning(f"Account config not found for {message.account_id}")
                except Exception as fetch_error:
                    logger.error(f"Failed to fetch body for {message_id}: {fetch_error}", exc_info=True)
                    # Continue and return what we have (might be None)
            else:
                logger.warning("Config not available, cannot fetch body on-demand")

        return {
            "id": message.id,
            "body_text": message.body_text,
            "body_html": message.body_html,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting message body {message_id}: {e}", exc_info=True)
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

        # Update message read status in database
        updated_message = db.update_message_read_status(message_id, body.is_unread)
        if not updated_message:
            raise HTTPException(status_code=404, detail="Message not found")

        classification = db.get_classification(message_id)
        return serialize_message(updated_message, classification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking message {message_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(request: Request, message_id: str):
    """Delete a message (always moves to trash)."""
    db = request.app.state.db

    try:
        # Check if message exists
        message = db.get_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Always move to trash (never permanently delete)
        updated_message = db.move_to_trash(message_id)
        if not updated_message:
            raise HTTPException(status_code=500, detail="Failed to move message to trash")
        return {"status": "moved_to_trash", "message_id": message_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message {message_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/{message_id}/restore")
async def restore_message(request: Request, message_id: str):
    """Restore a message from trash to inbox."""
    db = request.app.state.db

    try:
        # Restore from trash
        updated_message = db.restore_from_trash(message_id)
        if not updated_message:
            raise HTTPException(status_code=404, detail="Message not found in trash")

        classification = db.get_classification(message_id)
        return serialize_message(updated_message, classification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring message {message_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/delete-all")
async def delete_all_messages(
    request: Request,
    account_id: Optional[str] = Query(None, description="Filter by account ID"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    is_unread: Optional[bool] = Query(None, description="Filter by read status"),
    folder: Optional[str] = Query(None, description="Filter by folder"),
    search: Optional[str] = Query(None, description="Search filter"),
):
    """Delete all messages matching the given filters."""
    db = request.app.state.db

    try:
        # Query messages with filters (no limit to get all matching)
        messages = db.query_messages(
            account_id=account_id,
            tags=tags,
            is_unread=is_unread,
            folder=folder,
            limit=100000,  # Large limit to get all
            offset=0,
        )

        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            messages = [
                m for m in messages
                if search_lower in m.subject.lower()
                or search_lower in m.from_email.lower()
                or search_lower in m.snippet.lower()
            ]

        # Delete all matching messages (always move to trash)
        moved_to_trash_count = 0
        errors = []

        for message in messages:
            try:
                # Always move to trash
                updated = db.move_to_trash(message.id)
                if updated:
                    moved_to_trash_count += 1
                else:
                    errors.append({"message_id": message.id, "error": "Failed to move to trash"})
            except Exception as e:
                errors.append({"message_id": message.id, "error": str(e)})
                logger.error(f"Error deleting message {message.id}: {e}")

        return {
            "moved_to_trash": moved_to_trash_count,
            "total": len(messages),
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Error in delete all: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/clear-trash")
async def clear_trash(request: Request):
    """Permanently delete all messages in trash folder."""
    db = request.app.state.db

    try:
        # Query all messages in trash
        trash_messages = db.query_messages(folder="trash", limit=100000, offset=0)

        # Permanently delete all trash messages
        deleted_count = 0
        errors = []

        for message in trash_messages:
            try:
                success = db.delete_message(message.id)
                if success:
                    deleted_count += 1
                else:
                    errors.append({"message_id": message.id, "error": "Failed to delete"})
            except Exception as e:
                errors.append({"message_id": message.id, "error": str(e)})
                logger.error(f"Error permanently deleting message {message.id}: {e}")

        return {
            "deleted": deleted_count,
            "total": len(trash_messages),
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Error clearing trash: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/search")
async def search_messages(
    request: Request,
    q: str = Query(..., description="Search query"),
    account_id: Optional[str] = Query(None, description="Filter by account"),
    limit: int = Query(50, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """Full-text search across message bodies and subjects using FTS5."""
    db = request.app.state.db

    try:
        # Use FTS5 virtual table for full-text search
        # For now, fall back to simple LIKE search (FTS5 integration can be enhanced later)
        with db.session() as session:
            from sqlalchemy import or_
            query = session.query(Message)

            if account_id:
                query = query.where(Message.account_id == account_id)

            # Simple text search (can be enhanced with FTS5 later)
            search_pattern = f"%{q}%"
            query = query.where(
                or_(
                    Message.subject.like(search_pattern),
                    Message.from_email.like(search_pattern),
                    Message.snippet.like(search_pattern),
                    Message.body_text.like(search_pattern) if Message.body_text else False,
                )
            )

            # Order by date descending
            query = query.order_by(Message.date.desc())

            # Pagination
            total_query = query
            total = total_query.count()

            messages = query.offset(offset).limit(limit).all()

            # Serialize messages
            serialized = []
            for message in messages:
                classification = db.get_classification(message.id)
                serialized.append(serialize_message(message, classification))

            return {
                "messages": serialized,
                "total": total,
                "limit": limit,
                "offset": offset,
                "query": q,
            }

    except Exception as e:
        logger.error(f"Error searching messages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
