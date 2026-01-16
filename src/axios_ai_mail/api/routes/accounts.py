"""Account-related API endpoints."""

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Request

from ..models import AccountResponse, AccountStatsResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/accounts", response_model=List[AccountResponse])
async def list_accounts(request: Request):
    """List all configured email accounts."""
    db = request.app.state.db

    try:
        accounts = db.list_accounts()
        return [
            AccountResponse(
                id=account.id,
                name=account.name,
                email=account.email,
                provider=account.provider,
                last_sync=account.last_sync,
            )
            for account in accounts
        ]

    except Exception as e:
        logger.error(f"Error listing accounts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/accounts/{account_id}/stats", response_model=AccountStatsResponse)
async def get_account_stats(request: Request, account_id: str):
    """Get statistics for a specific account."""
    db = request.app.state.db

    try:
        account = db.get_account(account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        # Get message counts
        all_messages = db.query_messages(account_id=account_id, limit=100000)
        unread_messages = db.query_messages(
            account_id=account_id,
            is_unread=True,
            limit=100000
        )

        # Count classified messages
        classified_count = sum(1 for msg in all_messages if db.has_classification(msg.id))

        # Calculate classification rate
        total_count = len(all_messages)
        classification_rate = (classified_count / total_count * 100) if total_count > 0 else 0

        return AccountStatsResponse(
            account_id=account_id,
            total_messages=total_count,
            unread_messages=len(unread_messages),
            classified_messages=classified_count,
            classification_rate=classification_rate,
            last_sync=account.last_sync,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stats for account {account_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
