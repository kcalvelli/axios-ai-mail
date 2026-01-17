"""Database migration runner."""

import logging
from pathlib import Path
import sys

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from alembic.config import Config
from alembic import command

logger = logging.getLogger(__name__)


def run_migrations(db_path: Path) -> None:
    """Run all pending database migrations.

    Args:
        db_path: Path to SQLite database file
    """
    # Create alembic config
    alembic_ini = project_root / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini))

    # Set database path
    alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")

    # Run migrations
    logger.info(f"Running migrations for database: {db_path}")
    command.upgrade(alembic_cfg, "head")
    logger.info("Migrations completed successfully")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run database migrations")
    parser.add_argument(
        "--db-path",
        type=Path,
        default=Path.home() / ".local/share/axios-ai-mail/mail.db",
        help="Path to database file"
    )

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    run_migrations(args.db_path)
