"""Add imap_folder column to messages table

Revision ID: 004
Revises: 003
Create Date: 2026-01-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add imap_folder column (nullable) - stores actual IMAP folder name
    op.add_column('messages', sa.Column('imap_folder', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'imap_folder')
