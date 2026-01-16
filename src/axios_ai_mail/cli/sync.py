"""Sync command for manual email synchronization."""

import logging
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from ..ai_classifier import AIClassifier, AIConfig
from ..config.loader import ConfigLoader
from ..db.database import Database
from ..providers.factory import ProviderFactory
from ..sync_engine import SyncEngine

console = Console()
sync_app = typer.Typer(help="Email synchronization commands")
logger = logging.getLogger(__name__)


@sync_app.command("run")
def sync_run(
    account: Optional[str] = typer.Option(None, "--account", "-a", help="Account ID to sync"),
    max_messages: int = typer.Option(100, "--max", help="Maximum messages to fetch"),
    db_path: Path = typer.Option(
        Path.home() / ".local/share/axios-ai-mail/mail.db",
        "--db",
        help="Database path",
    ),
) -> None:
    """Manually trigger email sync."""
    console.print("[bold blue]Starting email sync...[/bold blue]")

    # Initialize database
    db = Database(db_path)

    # Load configuration and sync to database
    config = ConfigLoader.load_config()
    if config:
        ConfigLoader.sync_to_database(db, config)

    # Get accounts to sync
    if account:
        db_account = db.get_account(account)
        if not db_account:
            console.print(f"[red]Account not found: {account}[/red]")
            raise typer.Exit(1)
        accounts = [db_account]
    else:
        accounts = db.list_accounts()

    if not accounts:
        console.print("[yellow]No accounts configured[/yellow]")
        console.print("\nAdd accounts to your home.nix configuration and run 'home-manager switch'")
        raise typer.Exit(0)

    # Sync each account
    results = []
    for db_account in accounts:
        console.print(f"\n[bold]Syncing account: {db_account.email}[/bold]")

        try:
            # Initialize provider using factory pattern
            provider = ProviderFactory.create_from_account(db_account)
            provider.authenticate()

            # Initialize AI classifier
            ai_config = AIConfig(
                model=db_account.settings.get("ai_model", "llama3.2"),
                endpoint=db_account.settings.get("ai_endpoint", "http://localhost:11434"),
            )
            ai_classifier = AIClassifier(ai_config)

            # Initialize sync engine
            sync_engine = SyncEngine(
                provider=provider,
                database=db,
                ai_classifier=ai_classifier,
                label_prefix=db_account.settings.get("label_prefix", "AI"),
            )

            # Run sync
            result = sync_engine.sync(max_messages=max_messages)
            results.append(result)

            # Display result
            if result.errors:
                console.print(f"[yellow]⚠ Sync completed with {len(result.errors)} errors[/yellow]")
            else:
                console.print("[green]✓ Sync completed successfully[/green]")

            console.print(f"  Messages fetched: {result.messages_fetched}")
            console.print(f"  Messages classified: {result.messages_classified}")
            console.print(f"  Labels updated: {result.labels_updated}")
            console.print(f"  Duration: {result.duration_seconds:.2f}s")

        except Exception as e:
            console.print(f"[red]Sync failed for {db_account.email}: {e}[/red]")
            logger.exception("Sync error")
            continue

    # Summary
    if results:
        console.print("\n[bold]Sync Summary[/bold]")
        table = Table()
        table.add_column("Account")
        table.add_column("Fetched")
        table.add_column("Classified")
        table.add_column("Labeled")
        table.add_column("Errors")

        for result in results:
            table.add_row(
                result.account_id,
                str(result.messages_fetched),
                str(result.messages_classified),
                str(result.labels_updated),
                str(len(result.errors)),
            )

        console.print(table)


@sync_app.command("reclassify")
def sync_reclassify(
    account: str = typer.Argument(..., help="Account ID to reclassify"),
    max_messages: Optional[int] = typer.Option(None, "--max", help="Maximum messages to reclassify"),
    db_path: Path = typer.Option(
        Path.home() / ".local/share/axios-ai-mail/mail.db",
        "--db",
        help="Database path",
    ),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview changes without applying"),
) -> None:
    """Reclassify all messages for an account."""
    console.print(f"[bold blue]Reclassifying messages for account: {account}[/bold blue]")

    if dry_run:
        console.print("[yellow]DRY RUN MODE - No changes will be made[/yellow]")

    # Initialize database
    db = Database(db_path)

    # Load configuration and sync to database
    config = ConfigLoader.load_config()
    if config:
        ConfigLoader.sync_to_database(db, config)

    # Get account
    db_account = db.get_account(account)
    if not db_account:
        console.print(f"[red]Account not found: {account}[/red]")
        raise typer.Exit(1)

    try:
        # Initialize provider using factory pattern
        provider = ProviderFactory.create_from_account(db_account)
        provider.authenticate()

        # Initialize AI classifier
        ai_config = AIConfig(
            model=db_account.settings.get("ai_model", "llama3.2"),
            endpoint=db_account.settings.get("ai_endpoint", "http://localhost:11434"),
        )
        ai_classifier = AIClassifier(ai_config)

        # Initialize sync engine
        sync_engine = SyncEngine(
            provider=provider,
            database=db,
            ai_classifier=ai_classifier,
            label_prefix=db_account.settings.get("label_prefix", "AI"),
        )

        # Run reclassification
        with console.status("[bold green]Reclassifying messages..."):
            result = sync_engine.reclassify_all(max_messages=max_messages)

        # Display result
        if result.errors:
            console.print(f"[yellow]⚠ Reclassification completed with {len(result.errors)} errors[/yellow]")
        else:
            console.print("[green]✓ Reclassification completed successfully[/green]")

        console.print(f"  Messages classified: {result.messages_classified}")
        console.print(f"  Labels updated: {result.labels_updated}")
        console.print(f"  Duration: {result.duration_seconds:.2f}s")

        if result.errors and typer.confirm("Show errors?"):
            for error in result.errors[:10]:  # Show first 10
                console.print(f"  [red]•[/red] {error}")

    except Exception as e:
        console.print(f"[red]Reclassification failed: {e}[/red]")
        logger.exception("Reclassification error")
        raise typer.Exit(1)
