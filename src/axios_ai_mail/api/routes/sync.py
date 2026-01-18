"""Sync-related API endpoints."""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks

from ..models import SyncStatusResponse, SyncResultResponse, TriggerSyncRequest

logger = logging.getLogger(__name__)
router = APIRouter()

# Global sync state
_sync_state = {
    "is_syncing": False,
    "current_account": None,
    "last_sync": None,
}


def get_sync_state() -> dict:
    """Get current sync state."""
    return _sync_state.copy()


def set_sync_state(is_syncing: bool, current_account: Optional[str] = None):
    """Update sync state."""
    _sync_state["is_syncing"] = is_syncing
    _sync_state["current_account"] = current_account
    if not is_syncing:
        _sync_state["last_sync"] = datetime.now(timezone.utc)


async def run_sync_task(db, account_id: Optional[str], max_messages: int):
    """Run sync in background."""
    from ...sync_engine import SyncEngine
    from ...ai_classifier import AIClassifier, AIConfig
    from ...providers.factory import ProviderFactory
    from ...config.loader import ConfigLoader
    from ..websocket import send_sync_started, send_sync_completed, send_error

    try:
        set_sync_state(True, account_id)

        # Load AI config from file
        config = ConfigLoader.load_config()
        ai_settings = ConfigLoader.get_ai_config(config)
        custom_tags = ConfigLoader.get_custom_tags(config)

        if custom_tags:
            tag_names = [t["name"] for t in custom_tags]
            logger.info(f"Using custom tags from config: {tag_names}")

        # Get account(s) to sync
        if account_id:
            accounts = [db.get_account(account_id)]
            if not accounts[0]:
                logger.error(f"Account {account_id} not found")
                await send_error(f"Account {account_id} not found")
                return
        else:
            accounts = db.list_accounts()

        # Sync each account
        for account in accounts:
            if not account:
                continue

            logger.info(f"Syncing account: {account.id}")
            set_sync_state(True, account.id)

            # Send WebSocket event: sync started
            await send_sync_started(account.id)

            # Create provider using factory pattern
            provider = ProviderFactory.create_from_account(account)
            provider.authenticate()

            # Create AI classifier with config from file
            ai_config = AIConfig(
                model=ai_settings["model"],
                endpoint=ai_settings["endpoint"],
                temperature=ai_settings["temperature"],
                custom_tags=custom_tags,
            )
            ai_classifier = AIClassifier(ai_config)

            # Run sync
            sync_engine = SyncEngine(
                provider=provider,
                database=db,
                ai_classifier=ai_classifier,
                label_prefix=account.settings.get("label_prefix", "AI"),
            )

            result = sync_engine.sync(max_messages=max_messages)
            logger.info(f"Sync completed for {account.id}: {result}")

            # Send WebSocket event: sync completed
            await send_sync_completed(account.id, {
                "fetched": result.messages_fetched,
                "classified": result.messages_classified,
                "labeled": result.labels_updated,
                "errors": len(result.errors),
            })

    except Exception as e:
        logger.error(f"Sync failed: {e}", exc_info=True)
        await send_error("Sync failed", str(e))
    finally:
        set_sync_state(False)


@router.get("/sync/status", response_model=SyncStatusResponse)
async def get_sync_status(request: Request):
    """Get current sync status."""
    state = get_sync_state()

    message = "Idle"
    if state["is_syncing"]:
        account = state.get("current_account", "unknown")
        message = f"Syncing account: {account}"

    return SyncStatusResponse(
        is_syncing=state["is_syncing"],
        current_account=state.get("current_account"),
        last_sync=state.get("last_sync"),
        message=message,
    )


@router.post("/sync", response_model=SyncStatusResponse)
async def trigger_sync(
    request: Request,
    background_tasks: BackgroundTasks,
    body: TriggerSyncRequest = TriggerSyncRequest(),
):
    """Trigger a manual sync operation."""
    db = request.app.state.db
    state = get_sync_state()

    # Check if already syncing
    if state["is_syncing"]:
        raise HTTPException(
            status_code=409,
            detail=f"Sync already in progress for account: {state.get('current_account')}"
        )

    # Start sync in background
    background_tasks.add_task(
        run_sync_task,
        db,
        body.account_id,
        body.max_messages,
    )

    return SyncStatusResponse(
        is_syncing=True,
        current_account=body.account_id,
        message="Sync started",
    )
