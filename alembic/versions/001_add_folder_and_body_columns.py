"""Add folder and body columns to messages table

Revision ID: 001
Revises:
Create Date: 2026-01-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add folder column with default 'inbox'
    op.add_column('messages', sa.Column('folder', sa.String(length=100), nullable=False, server_default='inbox'))

    # Add body columns (nullable)
    op.add_column('messages', sa.Column('body_text', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('body_html', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'body_html')
    op.drop_column('messages', 'body_text')
    op.drop_column('messages', 'folder')
