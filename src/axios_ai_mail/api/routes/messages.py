"""Message-related API endpoints."""

import asyncio
import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel

from ...db.models import Message, Classification
from ...providers.factory import ProviderFactory
from ..models import (
    MessageResponse,
    MessagesListResponse,
    UpdateTagsRequest,
    MarkReadRequest,
    SmartReply,
    SmartReplyResponse,
)
from ..websocket import send_messages_updated, send_messages_deleted, send_messages_restored

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
        "has_attachments": message.has_attachments,
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
            "confidence": classification.confidence,
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

        # Get actual total count with same filters
        total = db.count_messages(
            account_id=account_id,
            tag=tag,
            tags=tags,
            is_unread=is_unread,
            folder=folder,
        )

        # If search filter was applied, adjust total count
        # (search is client-side filtered, so count only what matched)
        if search:
            # Re-count after search filter
            search_lower = search.lower()
            all_messages = db.query_messages(
                account_id=account_id,
                tag=tag,
                tags=tags,
                is_unread=is_unread,
                folder=folder,
                limit=10000,  # Large limit to get all for count
                offset=0,
            )
            total = sum(
                1 for m in all_messages
                if search_lower in m.subject.lower()
                or search_lower in m.from_email.lower()
                or search_lower in m.snippet.lower()
            )

        return MessagesListResponse(
            messages=serialized,
            total=total,
            limit=limit,
            offset=offset,
        )

    except Exception as e:
        logger.error(f"Error listing messages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/unread-count")
async def get_unread_count(request: Request):
    """Get count of unread messages in inbox."""
    db = request.app.state.db

    try:
        count = db.count_messages(folder="inbox", is_unread=True)
        return {"count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/bulk/read")
async def bulk_mark_read(request: Request, body: BulkReadRequest):
    """Mark multiple messages as read or unread."""
    db = request.app.state.db

    try:
        updated_count = 0
        updated_ids = []
        provider_synced_count = 0
        provider_failed_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                # Phase 1: Get message and update database
                message = db.get_message(message_id)
                if not message:
                    errors.append({"message_id": message_id, "error": "Not found"})
                    continue

                updated_message = db.update_message_read_status(message_id, body.is_unread)
                if updated_message:
                    updated_count += 1
                    updated_ids.append(message_id)

                    # Phase 2: Sync to provider (best effort)
                    try:
                        account = db.get_account(message.account_id)
                        if account:
                            provider = ProviderFactory.create_from_account(account)
                            provider.authenticate()
                            if body.is_unread:
                                provider.mark_as_unread(message_id)
                            else:
                                provider.mark_as_read(message_id)
                            provider_synced_count += 1
                    except Exception as e:
                        provider_failed_count += 1
                        logger.error(f"Provider sync failed for {message_id}: {e}")
                else:
                    errors.append({"message_id": message_id, "error": "Update failed"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error updating message {message_id}: {e}")

        # Broadcast update to all clients
        if updated_ids:
            action = "unread" if body.is_unread else "read"
            asyncio.create_task(send_messages_updated(updated_ids, action))

        return {
            "updated": updated_count,
            "provider_synced": provider_synced_count,
            "provider_failed": provider_failed_count,
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
        moved_ids = []
        provider_synced_count = 0
        provider_failed_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                # Phase 1: Get message and move to trash in database
                message = db.get_message(message_id)
                if not message:
                    errors.append({"message_id": message_id, "error": "Not found"})
                    continue

                updated = db.move_to_trash(message_id)
                if updated:
                    moved_to_trash_count += 1
                    moved_ids.append(message_id)

                    # Phase 2: Sync to provider (best effort)
                    try:
                        account = db.get_account(message.account_id)
                        if account:
                            provider = ProviderFactory.create_from_account(account)
                            provider.authenticate()
                            provider.move_to_trash(message_id)
                            provider_synced_count += 1
                    except Exception as e:
                        provider_failed_count += 1
                        logger.error(f"Provider sync failed for {message_id}: {e}")
                else:
                    errors.append({"message_id": message_id, "error": "Failed to move to trash"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error deleting message {message_id}: {e}")

        # Broadcast delete to all clients
        if moved_ids:
            asyncio.create_task(send_messages_deleted(moved_ids, permanent=False))

        return {
            "moved_to_trash": moved_to_trash_count,
            "provider_synced": provider_synced_count,
            "provider_failed": provider_failed_count,
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
        restored_ids = []
        provider_synced_count = 0
        provider_failed_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                # Phase 1: Get message and restore from trash in database
                message = db.get_message(message_id)
                if not message:
                    errors.append({"message_id": message_id, "error": "Not found"})
                    continue

                updated = db.restore_from_trash(message_id)
                if updated:
                    restored_count += 1
                    restored_ids.append(message_id)

                    # Phase 2: Sync to provider (best effort)
                    try:
                        account = db.get_account(message.account_id)
                        if account:
                            provider = ProviderFactory.create_from_account(account)
                            provider.authenticate()
                            provider.restore_from_trash(message_id)
                            provider_synced_count += 1
                    except Exception as e:
                        provider_failed_count += 1
                        logger.error(f"Provider sync failed for {message_id}: {e}")
                else:
                    errors.append({"message_id": message_id, "error": "Not found in trash"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error restoring message {message_id}: {e}")

        # Broadcast restore to all clients
        if restored_ids:
            asyncio.create_task(send_messages_restored(restored_ids))

        return {
            "restored": restored_count,
            "provider_synced": provider_synced_count,
            "provider_failed": provider_failed_count,
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
        deleted_ids = []
        provider_synced_count = 0
        provider_failed_count = 0
        errors = []

        for message_id in body.message_ids:
            try:
                # Phase 1: Get message before deletion
                message = db.get_message(message_id)
                if not message:
                    errors.append({"message_id": message_id, "error": "Not found"})
                    continue

                # Phase 2: Sync to provider first (permanent delete)
                try:
                    account = db.get_account(message.account_id)
                    if account:
                        provider = ProviderFactory.create_from_account(account)
                        provider.authenticate()
                        provider.delete_message(message_id, permanent=True)
                        provider_synced_count += 1
                except Exception as e:
                    provider_failed_count += 1
                    logger.error(f"Provider permanent delete failed for {message_id}: {e}")

                # Phase 3: Delete from database
                success = db.delete_message(message_id)
                if success:
                    deleted_count += 1
                    deleted_ids.append(message_id)
                else:
                    errors.append({"message_id": message_id, "error": "Failed to delete"})
            except Exception as e:
                errors.append({"message_id": message_id, "error": str(e)})
                logger.error(f"Error permanently deleting message {message_id}: {e}")

        # Broadcast permanent delete to all clients
        if deleted_ids:
            asyncio.create_task(send_messages_deleted(deleted_ids, permanent=True))

        return {
            "deleted": deleted_count,
            "provider_synced": provider_synced_count,
            "provider_failed": provider_failed_count,
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

        # Broadcast update to all clients
        asyncio.create_task(send_messages_updated([message_id], "tags_updated"))

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

        # Sync to provider (best effort)
        provider_synced = False
        try:
            account = db.get_account(message.account_id)
            if account:
                provider = ProviderFactory.create_from_account(account)
                provider.authenticate()
                if body.is_unread:
                    provider.mark_as_unread(message_id)
                else:
                    provider.mark_as_read(message_id)
                provider_synced = True
                logger.info(f"Synced read status to provider for message {message_id}")
        except Exception as e:
            logger.error(f"Provider sync failed for message {message_id}: {e}", exc_info=True)
            # Don't fail the request - database operation succeeded

        # Broadcast update to all clients
        action = "unread" if body.is_unread else "read"
        asyncio.create_task(send_messages_updated([message_id], action))

        classification = db.get_classification(message_id)
        response = serialize_message(updated_message, classification)
        response["provider_synced"] = provider_synced
        return response

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

        # Phase 1: Update database (always succeeds)
        updated_message = db.move_to_trash(message_id)
        if not updated_message:
            raise HTTPException(status_code=500, detail="Failed to move message to trash")

        # Phase 2: Sync to provider (best effort)
        provider_synced = False
        try:
            # Get account and create provider
            account = db.get_account(message.account_id)
            if account:
                provider = ProviderFactory.create_from_account(account)
                provider.authenticate()
                provider.move_to_trash(message_id)
                provider_synced = True
                logger.info(f"Synced delete to provider for message {message_id}")
        except Exception as e:
            logger.error(f"Provider sync failed for message {message_id}: {e}", exc_info=True)
            # Don't fail the request - database operation succeeded

        # Broadcast delete to all clients
        asyncio.create_task(send_messages_deleted([message_id], permanent=False))

        return {
            "status": "moved_to_trash",
            "message_id": message_id,
            "provider_synced": provider_synced,
        }

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
        # Get message before restore (to get account_id)
        message = db.get_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Phase 1: Restore from trash in database
        updated_message = db.restore_from_trash(message_id)
        if not updated_message:
            raise HTTPException(status_code=404, detail="Message not found in trash")

        # Phase 2: Sync to provider (best effort)
        provider_synced = False
        try:
            account = db.get_account(message.account_id)
            if account:
                provider = ProviderFactory.create_from_account(account)
                provider.authenticate()
                provider.restore_from_trash(message_id)
                provider_synced = True
                logger.info(f"Synced restore to provider for message {message_id}")
        except Exception as e:
            logger.error(f"Provider sync failed for message {message_id}: {e}", exc_info=True)
            # Don't fail the request - database operation succeeded

        # Broadcast restore to all clients
        asyncio.create_task(send_messages_restored([message_id]))

        classification = db.get_classification(message_id)
        response = serialize_message(updated_message, classification)
        response["provider_synced"] = provider_synced
        return response

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
        provider_synced_count = 0
        provider_failed_count = 0
        errors = []

        for message in trash_messages:
            try:
                # Phase 1: Sync to provider first (permanent delete)
                try:
                    account = db.get_account(message.account_id)
                    if account:
                        provider = ProviderFactory.create_from_account(account)
                        provider.authenticate()
                        provider.delete_message(message.id, permanent=True)
                        provider_synced_count += 1
                except Exception as e:
                    provider_failed_count += 1
                    logger.error(f"Provider permanent delete failed for {message.id}: {e}")

                # Phase 2: Delete from database
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
            "provider_synced": provider_synced_count,
            "provider_failed": provider_failed_count,
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


@router.get("/messages/{message_id}/smart-replies", response_model=SmartReplyResponse)
async def get_smart_replies(request: Request, message_id: str):
    """Generate AI-powered smart reply suggestions for a message.

    Returns 3-4 short, contextual reply suggestions based on message content.
    Returns empty replies array for:
    - Messages in Sent folder
    - Messages tagged as newsletter or junk
    - When AI generation fails (graceful degradation)
    """
    db = request.app.state.db
    from datetime import datetime
    from ...ai_classifier import AIClassifier, AIConfig

    try:
        # Check if message exists
        message = db.get_message(message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        # Check if message is from sent folder - don't generate replies for own messages
        if message.folder == "sent":
            logger.debug(f"Skipping smart replies for sent message {message_id}")
            return SmartReplyResponse(
                replies=[],
                generated_at=datetime.utcnow(),
            )

        # Check classification - skip newsletters and junk
        classification = db.get_classification(message_id)
        if classification:
            skip_tags = {"newsletter", "junk"}
            if any(tag in skip_tags for tag in classification.tags):
                logger.debug(
                    f"Skipping smart replies for message {message_id} "
                    f"with tags {classification.tags}"
                )
                return SmartReplyResponse(
                    replies=[],
                    generated_at=datetime.utcnow(),
                )

        # Create provider Message object for AI classifier
        from ...providers.base import Message as ProviderMessage

        provider_message = ProviderMessage(
            id=message.id,
            thread_id=message.thread_id or "",
            subject=message.subject,
            from_email=message.from_email,
            to_emails=message.to_emails,
            date=message.date,
            snippet=message.snippet,
            body_text=message.body_text,
            body_html=message.body_html,
            is_unread=message.is_unread,
            has_attachments=message.has_attachments,
            labels=set(message.provider_labels) if message.provider_labels else set(),
        )

        # Generate replies using AI classifier
        try:
            # Get AI config from app state if available, otherwise use defaults
            ai_config = getattr(request.app.state, "ai_config", None)
            if ai_config is None:
                ai_config = AIConfig()

            classifier = AIClassifier(ai_config)
            reply_texts = classifier.generate_replies(provider_message)

            # Convert to SmartReply objects with IDs
            replies = [
                SmartReply(id=str(i + 1), text=text)
                for i, text in enumerate(reply_texts)
            ]

            return SmartReplyResponse(
                replies=replies,
                generated_at=datetime.utcnow(),
            )

        except Exception as ai_error:
            # Graceful degradation - return empty replies on AI error
            logger.warning(
                f"AI reply generation failed for message {message_id}: {ai_error}"
            )
            return SmartReplyResponse(
                replies=[],
                generated_at=datetime.utcnow(),
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting smart replies for {message_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
