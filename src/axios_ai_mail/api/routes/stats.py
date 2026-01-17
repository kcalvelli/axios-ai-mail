"""Statistics and analytics API endpoints."""

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Request

from ..models import TagsListResponse, TagResponse, StatsResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tags", response_model=TagsListResponse)
async def list_tags(request: Request):
    """List all tags (AI + account) with counts and percentages."""
    db = request.app.state.db

    try:
        # Get all messages
        all_messages = db.query_messages(limit=100000)
        total_messages = len(all_messages)

        # Count AI tags
        tag_counts = {}
        total_classified = 0

        for message in all_messages:
            classification = db.get_classification(message.id)
            if classification:
                total_classified += 1
                for tag in classification.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1

        # Build AI tag responses
        tags = []
        for tag_name, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_classified * 100) if total_classified > 0 else 0
            tags.append(TagResponse(
                name=tag_name,
                count=count,
                percentage=percentage,
                type="ai",
            ))

        # Count messages per account (account tags)
        account_counts = {}
        for message in all_messages:
            account_id = message.account_id
            account_counts[account_id] = account_counts.get(account_id, 0) + 1

        # Get account details to include email as tag name
        accounts = db.list_accounts()
        account_map = {acc.id: acc for acc in accounts}

        # Build account tag responses
        for account_id, count in sorted(account_counts.items(), key=lambda x: x[1], reverse=True):
            account = account_map.get(account_id)
            if account:
                percentage = (count / total_messages * 100) if total_messages > 0 else 0
                tags.append(TagResponse(
                    name=account.email,  # Use email as tag name
                    count=count,
                    percentage=percentage,
                    type="account",
                ))

        return TagsListResponse(
            tags=tags,
            total_classified=total_classified,
        )

    except Exception as e:
        logger.error(f"Error listing tags: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=StatsResponse)
async def get_stats(request: Request):
    """Get overall system statistics."""
    db = request.app.state.db

    try:
        # Get all messages
        all_messages = db.query_messages(limit=100000)
        unread_messages = db.query_messages(is_unread=True, limit=100000)

        # Count classified messages
        classified_count = sum(1 for msg in all_messages if db.has_classification(msg.id))

        # Get accounts
        accounts = db.list_accounts()

        # Calculate classification rate
        total_count = len(all_messages)
        classification_rate = (classified_count / total_count * 100) if total_count > 0 else 0

        # Get top tags
        tag_counts = {}
        for message in all_messages:
            classification = db.get_classification(message.id)
            if classification:
                for tag in classification.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1

        top_tags = []
        for tag_name, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            percentage = (count / classified_count * 100) if classified_count > 0 else 0
            top_tags.append(TagResponse(
                name=tag_name,
                count=count,
                percentage=percentage,
            ))

        return StatsResponse(
            total_messages=total_count,
            classified_messages=classified_count,
            unread_messages=len(unread_messages),
            classification_rate=classification_rate,
            accounts_count=len(accounts),
            top_tags=top_tags,
        )

    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
