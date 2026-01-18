"""Account maintenance CLI commands."""

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.prompt import Confirm

from ..config.loader import ConfigLoader
from ..db.database import Database

accounts_app = typer.Typer(help="Account maintenance commands")
console = Console()


def get_db() -> Database:
    """Get database instance."""
    db_path = Path.home() / ".local" / "share" / "axios-ai-mail" / "mail.db"
    return Database(db_path)


@accounts_app.command("list")
def list_accounts() -> None:
    """List all accounts with their status (active, orphaned, or new).

    Active accounts are defined in your Nix config and exist in database.
    Orphaned accounts exist only in the database (no longer in config).
    New accounts are in config but not yet synced to database.
    """
    db = get_db()
    config = ConfigLoader.load_config()

    # Get accounts from config and database
    config_accounts = config.get("accounts", {})
    config_account_ids = set(config_accounts.keys())
    db_accounts = db.list_accounts()
    db_account_ids = {a.id for a in db_accounts}

    if not db_accounts and not config_accounts:
        console.print("[yellow]No accounts found in database or config[/yellow]")
        return

    table = Table(title="Email Accounts")
    table.add_column("ID", style="cyan")
    table.add_column("Email", style="white")
    table.add_column("Provider", style="blue")
    table.add_column("Status", style="green")
    table.add_column("Messages", justify="right")
    table.add_column("Last Sync", style="dim")

    # Show database accounts first
    for account in db_accounts:
        status = "[green]Active[/green]" if account.id in config_account_ids else "[yellow]Orphaned[/yellow]"

        # Count messages for this account
        message_count = db.count_messages(account_id=account.id)

        # Format last sync
        last_sync = account.last_sync.strftime("%Y-%m-%d %H:%M") if account.last_sync else "Never"

        table.add_row(
            account.id,
            account.email,
            account.provider,
            status,
            str(message_count),
            last_sync,
        )

    # Show new accounts (in config but not in database)
    new_accounts = []
    for account_id, account_config in config_accounts.items():
        if account_id not in db_account_ids:
            new_accounts.append((account_id, account_config))
            table.add_row(
                account_id,
                account_config.get("email", "unknown"),
                account_config.get("provider", "unknown"),
                "[blue]New[/blue]",
                "-",
                "Never",
            )

    console.print(table)

    # Show warnings and hints
    orphaned = [a for a in db_accounts if a.id not in config_account_ids]

    if new_accounts:
        console.print()
        console.print(f"[blue]ℹ Found {len(new_accounts)} new account(s) in config.[/blue]")
        console.print("  Run [bold]axios-ai-mail sync run[/bold] to sync them.")

    if orphaned:
        console.print()
        console.print(f"[yellow]⚠ Found {len(orphaned)} orphaned account(s).[/yellow]")
        console.print("  Run [bold]axios-ai-mail accounts cleanup[/bold] to remove them.")
        if new_accounts:
            console.print("  Or run [bold]axios-ai-mail accounts migrate <old> <new>[/bold] to preserve messages.")


@accounts_app.command("cleanup")
def cleanup_orphaned(
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Show what would be deleted without actually deleting"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation prompts"),
) -> None:
    """Remove orphaned accounts and their messages.

    Orphaned accounts are those that exist in the database but are no longer
    defined in your Nix configuration.
    """
    db = get_db()
    config = ConfigLoader.load_config()

    config_accounts = set(config.get("accounts", {}).keys())
    db_accounts = db.list_accounts()

    orphaned = [a for a in db_accounts if a.id not in config_accounts]

    if not orphaned:
        console.print("[green]✓ No orphaned accounts found[/green]")
        return

    console.print(f"Found {len(orphaned)} orphaned account(s):\n")

    total_messages = 0
    for account in orphaned:
        message_count = db.count_messages(account_id=account.id)
        total_messages += message_count
        console.print(f"  • [cyan]{account.id}[/cyan] ({account.email})")
        console.print(f"    Provider: {account.provider}, Messages: {message_count}")

    console.print()
    console.print(f"[bold]Total messages to delete: {total_messages}[/bold]")

    if dry_run:
        console.print("\n[yellow]Dry run - no changes made[/yellow]")
        return

    if not force:
        if not Confirm.ask("\nPermanently delete these accounts and their messages?"):
            console.print("[yellow]Cancelled[/yellow]")
            return

    # Delete orphaned accounts and their data
    for account in orphaned:
        _delete_account_data(db, account.id)
        console.print(f"[green]✓ Deleted account: {account.id}[/green]")

    console.print(f"\n[green]✓ Cleanup complete. Removed {len(orphaned)} account(s) and {total_messages} message(s).[/green]")


@accounts_app.command("migrate")
def migrate_account(
    source: str = typer.Argument(..., help="Source account ID"),
    dest: str = typer.Argument(..., help="Destination account ID"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Show what would be migrated"),
) -> None:
    """Migrate messages from one account to another.

    This is useful when you rename an account in your Nix config.
    The source account will become orphaned after migration.

    Example:
        axios-ai-mail accounts migrate personal gmail
    """
    db = get_db()

    # Verify source exists
    source_account = db.get_account(source)
    if not source_account:
        console.print(f"[red]Error: Source account '{source}' not found[/red]")
        raise typer.Exit(1)

    # Verify destination exists
    dest_account = db.get_account(dest)
    if not dest_account:
        console.print(f"[red]Error: Destination account '{dest}' not found[/red]")
        console.print("Make sure to sync the new account first: axios-ai-mail sync run")
        raise typer.Exit(1)

    # Count messages to migrate
    message_count = db.count_messages(account_id=source)

    console.print(f"Migration: [cyan]{source}[/cyan] → [cyan]{dest}[/cyan]")
    console.print(f"  Source: {source_account.email} ({message_count} messages)")
    console.print(f"  Destination: {dest_account.email}")

    if message_count == 0:
        console.print("\n[yellow]No messages to migrate[/yellow]")
        return

    if dry_run:
        console.print(f"\n[yellow]Dry run - would migrate {message_count} message(s)[/yellow]")
        return

    if not Confirm.ask(f"\nMigrate {message_count} message(s)?"):
        console.print("[yellow]Cancelled[/yellow]")
        return

    # Perform migration
    migrated = _migrate_messages(db, source, dest)
    console.print(f"\n[green]✓ Migrated {migrated} message(s) from {source} to {dest}[/green]")
    console.print(f"\nYou can now clean up the orphaned account with:")
    console.print(f"  [dim]axios-ai-mail accounts cleanup[/dim]")


@accounts_app.command("delete")
def delete_account(
    account_id: str = typer.Argument(..., help="Account ID to delete"),
    keep_messages: bool = typer.Option(False, "--keep-messages", help="Keep messages (reassign to another account later)"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
) -> None:
    """Delete an account and optionally its messages.

    Use --keep-messages to preserve messages for later migration.
    """
    db = get_db()

    account = db.get_account(account_id)
    if not account:
        console.print(f"[red]Error: Account '{account_id}' not found[/red]")
        raise typer.Exit(1)

    message_count = db.count_messages(account_id=account_id)

    console.print(f"Account: [cyan]{account_id}[/cyan]")
    console.print(f"  Email: {account.email}")
    console.print(f"  Provider: {account.provider}")
    console.print(f"  Messages: {message_count}")

    if keep_messages:
        console.print("\n[yellow]Note: Messages will be orphaned (no account association)[/yellow]")

    if not force:
        action = "delete account (keep messages)" if keep_messages else f"delete account and {message_count} message(s)"
        if not Confirm.ask(f"\nPermanently {action}?"):
            console.print("[yellow]Cancelled[/yellow]")
            return

    if keep_messages:
        _delete_account_only(db, account_id)
        console.print(f"\n[green]✓ Deleted account: {account_id}[/green]")
        console.print(f"[yellow]Note: {message_count} message(s) are now orphaned[/yellow]")
    else:
        _delete_account_data(db, account_id)
        console.print(f"\n[green]✓ Deleted account {account_id} and {message_count} message(s)[/green]")


@accounts_app.command("stats")
def account_stats(
    account_id: Optional[str] = typer.Argument(None, help="Account ID (optional, shows all if not specified)"),
) -> None:
    """Show detailed statistics for accounts."""
    db = get_db()

    if account_id:
        accounts = [db.get_account(account_id)]
        if not accounts[0]:
            console.print(f"[red]Error: Account '{account_id}' not found[/red]")
            raise typer.Exit(1)
    else:
        accounts = db.list_accounts()

    if not accounts:
        console.print("[yellow]No accounts found[/yellow]")
        return

    for account in accounts:
        console.print(f"\n[bold cyan]{account.id}[/bold cyan] ({account.email})")
        console.print(f"  Provider: {account.provider}")

        # Message stats
        total = db.count_messages(account_id=account.id)
        unread = db.count_messages(account_id=account.id, is_unread=True)
        inbox = db.count_messages(account_id=account.id, folder="inbox")
        trash = db.count_messages(account_id=account.id, folder="trash")

        console.print(f"  Messages: {total} total, {unread} unread")
        console.print(f"  Folders: {inbox} inbox, {trash} trash")

        if account.last_sync:
            console.print(f"  Last sync: {account.last_sync.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            console.print("  Last sync: Never")


def _delete_account_data(db: Database, account_id: str) -> None:
    """Delete an account and all its associated data."""
    from sqlalchemy import delete, select
    from ..db.models import Account, Message, Classification, Attachment

    with db.session() as session:
        # Get all message IDs for this account
        messages = session.execute(
            select(Message.id).where(Message.account_id == account_id)
        ).scalars().all()

        # Delete classifications for these messages
        if messages:
            session.execute(
                delete(Classification).where(Classification.message_id.in_(messages))
            )

            # Delete attachments for these messages
            session.execute(
                delete(Attachment).where(Attachment.message_id.in_(messages))
            )

        # Delete messages
        session.execute(
            delete(Message).where(Message.account_id == account_id)
        )

        # Delete the account
        session.execute(
            delete(Account).where(Account.id == account_id)
        )

        session.commit()


def _delete_account_only(db: Database, account_id: str) -> None:
    """Delete only the account record, keeping messages."""
    from sqlalchemy import delete
    from ..db.models import Account

    with db.session() as session:
        session.execute(
            delete(Account).where(Account.id == account_id)
        )
        session.commit()


def _migrate_messages(db: Database, source_id: str, dest_id: str) -> int:
    """Migrate messages from source account to destination."""
    from sqlalchemy import update
    from ..db.models import Message

    with db.session() as session:
        result = session.execute(
            update(Message)
            .where(Message.account_id == source_id)
            .values(account_id=dest_id)
        )
        session.commit()
        return result.rowcount
