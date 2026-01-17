"""Add original_folder column to messages table

Revision ID: 003
Revises: 002
Create Date: 2026-01-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add original_folder column (nullable)
    op.add_column('messages', sa.Column('original_folder', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'original_folder')
